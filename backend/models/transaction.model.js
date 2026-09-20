const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Single ledger for wallet money movement. One document per transfer:
//   - "Wallet" mode : sender's wallet is debited AND receiver's wallet is credited
//   - "online" mode : sender paid through the gateway (their wallet is untouched),
//                     only the receiver's wallet is credited
// A user's history is derived from this collection (see userController.getUserTransactions),
// it is no longer duplicated on the User document.
const e_transactionSchema = new mongoose.Schema(
    {
        senderId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        type: {
            type: String,
            enum: ["credit", "debit", "refund", "transfer"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            default: ""
        },
        // Unique so a replayed/duplicate request cannot move money twice
        transactionId: {
            type: String,
            required: true,
            unique: true
        },
        referenceId: {
            type: String,
            default: null
        },
        source: {
            type: String,
            enum: ["reward", "purchase", "referral", "admin", "transfer"],
            default: "purchase"
        },
        paymentMode: {
            type: String,
            enum: ["Wallet", "online"],
            default: "Wallet"
        },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "success"
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

// A user's history = transactions they sent or received, newest first
e_transactionSchema.index({ senderId: 1, createdAt: -1 });
e_transactionSchema.index({ receiverId: 1, createdAt: -1 });

/**
 * Filter matching every ledger entry that touched `userId`'s wallet.
 * Sender side only counts for "Wallet" mode (online payments don't debit the wallet).
 */
e_transactionSchema.statics.walletEntriesFilter = function (userId) {
    return {
        $or: [
            { receiverId: userId },
            { senderId: userId, paymentMode: { $ne: "online" } },
        ],
    };
};

module.exports = mongoose.model("Transaction", e_transactionSchema);
