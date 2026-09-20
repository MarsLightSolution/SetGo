/**
 * One-off migration: retire User.transactionHistory in favour of the Transaction collection.
 *
 *   node scripts/migrate-drop-transaction-history.js            # dry run (writes nothing)
 *   node scripts/migrate-drop-transaction-history.js --apply    # perform the migration
 *
 * What it does
 *   1. Reads every embedded history entry and checks a Transaction document exists for it.
 *      - Orphans that have both a debit AND a credit entry are back-filled as Transaction docs.
 *      - Orphans that cannot be reconstructed (one-sided) block the drop; re-run with
 *        --allow-orphans once you have looked at the report.
 *   2. Sets Transaction.paymentMode on old docs ("Wallet" if the sender has a debit entry for it,
 *      otherwise "online") - the field was being sent by the controllers but never stored.
 *   3. Reports duplicate transactionIds (the schema now has a unique index on transactionId; the
 *      index build fails if duplicates exist, so resolve them first).
 *   4. With --apply: $unset transactionHistory on every user.
 *
 * Safe to re-run. Take a backup (mongodump) before running with --apply.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const ALLOW_ORPHANS = process.argv.includes('--allow-orphans');

(async () => {
  await mongoose.connect(process.env.MONGO_DB);
  const users = mongoose.connection.collection('users');
  const txns = mongoose.connection.collection('transactions');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  // 1. Flatten embedded history
  const entries = await users.aggregate([
    { $match: { 'transactionHistory.0': { $exists: true } } },
    { $unwind: '$transactionHistory' },
    { $project: { _id: 0, userId: '$_id', txnId: '$transactionHistory.transactionId',
        direction: '$transactionHistory.direction', amount: '$transactionHistory.amount',
        createdAt: '$transactionHistory.createdAt' } },
  ]).toArray();
  console.log(`Embedded history entries: ${entries.length}`);

  const byTxn = new Map();
  for (const e of entries) {
    if (!byTxn.has(e.txnId)) byTxn.set(e.txnId, []);
    byTxn.get(e.txnId).push(e);
  }

  const txnIds = [...byTxn.keys()];
  const existing = new Map(
    (await txns.find({ transactionId: { $in: txnIds } }).toArray()).map((t) => [t.transactionId, t])
  );

  // 2. Orphans
  const backfill = [];
  const unrecoverable = [];
  for (const [txnId, list] of byTxn) {
    if (existing.has(txnId)) continue;
    const debit = list.find((e) => e.direction === 'debit');
    const credit = list.find((e) => e.direction === 'credit');
    if (debit && credit) {
      backfill.push({
        senderId: debit.userId, receiverId: credit.userId, type: 'transfer', amount: credit.amount,
        description: 'Backfilled from user.transactionHistory', transactionId: txnId,
        source: 'transfer', paymentMode: 'Wallet', status: 'success', createdAt: credit.createdAt || new Date(),
      });
    } else {
      unrecoverable.push({ txnId, entries: list });
    }
  }
  console.log(`Orphan history with a full debit+credit pair (will back-fill): ${backfill.length}`);
  console.log(`Orphan history that cannot be reconstructed: ${unrecoverable.length}`);
  unrecoverable.slice(0, 20).forEach((o) => console.log('  ', JSON.stringify(o)));

  // 3. paymentMode for existing docs that don't have it
  const modeUpdates = [];
  for (const [txnId, doc] of existing) {
    if (doc.paymentMode) continue;
    const hasDebit = byTxn.get(txnId).some((e) => e.direction === 'debit');
    modeUpdates.push({ txnId, mode: hasDebit ? 'Wallet' : 'online' });
  }
  console.log(`Transaction docs needing paymentMode: ${modeUpdates.length}`);

  // 4. Duplicate transactionIds (would block the new unique index)
  const dupes = await txns.aggregate([
    { $group: { _id: '$transactionId', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } },
  ]).toArray();
  console.log(`Duplicate transactionIds in Transaction collection: ${dupes.length}`);
  dupes.slice(0, 20).forEach((d) => console.log('  ', d._id, 'x', d.n));

  const blocked = (unrecoverable.length > 0 && !ALLOW_ORPHANS) || dupes.length > 0;
  if (!APPLY) {
    console.log(blocked ? '\nDry run: resolve the items above before --apply.' : '\nDry run OK: safe to --apply.');
    return;
  }
  if (blocked) {
    console.error('\nRefusing to apply: unresolved orphans or duplicates (see above).');
    process.exitCode = 1;
    return;
  }

  if (backfill.length) await txns.insertMany(backfill);
  for (const u of modeUpdates) await txns.updateOne({ transactionId: u.txnId }, { $set: { paymentMode: u.mode } });
  const res = await users.updateMany({ transactionHistory: { $exists: true } }, { $unset: { transactionHistory: '' } });
  console.log(`\nDone. Back-filled ${backfill.length}, set paymentMode on ${modeUpdates.length}, ` +
    `removed transactionHistory from ${res.modifiedCount} users.`);
})().catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
