jest.mock('../services/emailService', () => ({ sendEmail: jest.fn().mockResolvedValue() }));
jest.mock('../utils/ioInstance', () => ({ emitToUser: jest.fn() }));

const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);
process.env.Admin_Id = new mongoose.Types.ObjectId().toString();
process.env.AZERICARD_ENABLED = 'true';
process.env.AZERICARD_MODE = 'mock';
process.env.SERVER_FRONTEND = 'http://localhost:5173';
delete process.env.AZERICARD_PRIVATE_KEY_PATH;
delete process.env.AZERICARD_PRIVATE_KEY;

const User = require('../models/user');
const Product = require('../models/product.model');
const Order = require('../models/Order');
const Transaction = require('../models/transaction.model');
const p = require('../services/azericard/protocol');
const { mockBankKeyPair } = require('../services/azericard/keys');
const { getConfig } = require('../services/azericard/config');
const mockBank = require('../services/azericard/mockBank');
const { reconcileStaleCardOrders } = require('../services/cardPayments');

let replSet;
let app;
let server;
let platform;

const checkoutDetails = { name: 'Buyer Person', email: 'buyer@example.com', address: '1 Main St', city: 'Baku', pincode: 'AZ1000' };
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;
const balance = async (user) => (await User.findById(user._id)).walletBalance;
const quantity = async (product) => (await Product.findById(product._id)).quantity;
const later = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

let n = 0;
const makeUser = (walletBalance = 0) => {
  n += 1;
  return User.create({ email: `c${n}@example.com`, username: `card${n}`, password: 'x'.repeat(12), walletBalance });
};
const makeProduct = (owner, price = 50) =>
  Product.create({
    title: { en: 'Bike' }, category: { en: 'Sport' }, price, description: { en: 'A bike' },
    condition: 'Used', postalCode: 'AZ1000', name: { en: 'Seller' }, termsAccepted: true,
    quantity: 1, owner: owner._id,
  });
const setup = async (price = 50, buyerWallet = 0) => {
  const seller = await makeUser(0);
  const buyer = await makeUser(buyerWallet);
  const product = await makeProduct(seller, price);
  return { seller, buyer, product };
};

const initiate = (buyer, product, walletDeduction) =>
  request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
    .send({ productId: product._id, walletDeduction, checkoutDetails, lang: 'ru' });

// What the browser does: post the signed form to the bank, click a button there, then follow the
// bank's "return to merchant" form, which POSTs the signed result to BACKREF.
async function payAtBank(gateway, decision) {
  const pageRes = await request(app).post('/api/payments/mock-azericard/pay').type('form').send({ ...gateway.fields, M_INFO: 'e30=' });
  expect(pageRes.status).toBe(200);
  const done = await request(app).post(`/api/payments/mock-azericard/pay/${gateway.fields.ORDER}/decision`).type('form').send({ decision });
  expect(done.status).toBe(200);
  const entry = mockBank.payments.get(gateway.fields.ORDER);
  const postBack = decision === 'approve' || decision === 'decline' ? entry.result : {};
  const back = await request(app).post(new URL(gateway.fields.BACKREF).pathname).type('form').send(postBack);
  expect(back.status).toBe(303);
  return back.headers.location;
}

const postCallback = (fields) => request(app).post('/api/payments/azericard/callback').type('form').send(fields);

function bankSigned(requestFields, { approved = true, approval, intRef } = {}) {
  const fields = {
    TERMINAL: requestFields.TERMINAL, TRTYPE: '1', ORDER: requestFields.ORDER, AMOUNT: requestFields.AMOUNT,
    CURRENCY: requestFields.CURRENCY, ACTION: approved ? '0' : '2', RC: approved ? '00' : '05',
    APPROVAL: approval !== undefined ? approval : approved ? '654321' : '',
    RRN: String(crypto.randomInt(1e11, 1e12)), INT_REF: intRef || crypto.randomBytes(8).toString('hex').toUpperCase(),
    TIMESTAMP: p.timestamp(), NONCE: p.nonce(),
  };
  fields.P_SIGN = p.sign(fields, p.RESULT_SIGN_FIELDS, mockBankKeyPair().privateKey);
  return fields;
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Product.init(), Order.init(), Transaction.init()]);

  app = express();
  app.use('/api/payments', require('../Routes/azericard.routes'));
  app.use(express.json());
  app.use('/api/payments', require('../Routes/payment-proxy.routes'));
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  process.env.SERVER_BACKEND = `http://127.0.0.1:${server.address().port}`;

  platform = await User.create({ _id: process.env.Admin_Id, email: 'platform@example.com', username: 'platform', password: 'x'.repeat(12), walletBalance: 0 });
}, 120000);

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await replSet.stop();
});

describe('protocol (per Azericard docs and samples)', () => {
  test('purchase P_SIGN string matches the documented field order', () => {
    // Values from Azericard's Java sample (H_PsignGeneration.java), all 7 fields as in the PHP sample.
    const values = {
      AMOUNT: '1', CURRENCY: 'AZN', TERMINAL: '17203590', TRTYPE: '1',
      TIMESTAMP: '20240612060600', NONCE: '10077541feab809c88f074b56cf948d9', MERCH_URL: 'https://abb.test.az',
    };
    expect(p.signingString(values, p.REQUEST_SIGN_FIELDS))
      .toBe('113AZN81720359011142024061206060032' + '10077541feab809c88f074b56cf948d9' + '19https://abb.test.az');
  });

  test('callback P_SIGN string: empty value is a bare "-"', () => {
    expect(p.signingString({ AMOUNT: '10.00', TERMINAL: '17204526', APPROVAL: '', RRN: '321676432435', INT_REF: '660C5AA4B9D84B19' }, p.RESULT_SIGN_FIELDS))
      .toBe('510.00817204526-1232167643243516660C5AA4B9D84B19');
  });

  test('signature is lowercase hex and verifies', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const values = { AMOUNT: '1', CURRENCY: 'AZN', TERMINAL: '1', TRTYPE: '1', TIMESTAMP: p.timestamp(), NONCE: p.nonce(), MERCH_URL: 'https://satgo.az' };
    const sig = p.sign(values, p.REQUEST_SIGN_FIELDS, privateKey);
    expect(sig).toMatch(/^[0-9a-f]{512}$/);
    expect(p.verify(values, p.REQUEST_SIGN_FIELDS, sig, publicKey)).toBe(true);
  });

  test('ORDER: numeric, 14 digits, last 6 from a sequence that does not reset daily', () => {
    expect(p.gatewayOrderId(1, new Date('2026-10-22T10:00:00Z'))).toBe('20261022000001');
    expect(p.gatewayOrderId(1000001, new Date('2026-10-23T10:00:00Z'))).toBe('20261023000001');
  });

  test('mock mode is refused in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => getConfig()).toThrow(/not allowed in production/);
    } finally {
      process.env.NODE_ENV = env;
    }
  });
});

describe('card checkout against the mock bank', () => {
  test('card only, approved: order paid, seller credited from the gateway, item reserved', async () => {
    const { seller, buyer, product } = await setup(50);

    const res = await initiate(buyer, product, 0);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ paymentMethod: 'card', completed: false });
    const { orderId, gateway } = res.body.data;
    expect(gateway.url).toBe(getConfig().gatewayUrl);
    expect(gateway.fields).toMatchObject({
      AMOUNT: '50.00', CURRENCY: 'AZN', TRTYPE: '1', LANG: 'RU', NAME: 'Buyer Person',
      MERCH_URL: `http://localhost:5173/payment/result/${orderId}`, DESC: `SATGO order ${orderId}`,
      BACKREF: `${process.env.SERVER_BACKEND}/api/payments/azericard/return/${orderId}`,
    });
    expect(gateway.fields.ORDER).toMatch(/^\d{14}$/);
    expect(gateway.fields.P_SIGN).toMatch(/^[0-9a-f]+$/);
    expect(await quantity(product)).toBe(0);

    const landing = await payAtBank(gateway, 'approve');
    expect(landing).toBe(`http://localhost:5173/payment/result/${orderId}`);

    const order = await Order.findById(orderId);
    expect(order).toMatchObject({ paymentStatus: 'completed', status: 'paid', paymentMethod: 'card', paidAmount: 50 });
    expect(order.gateway.approvalCode).toBeTruthy();
    expect(await balance(seller)).toBe(50);
    expect(await Transaction.findOne({ transactionId: `CARD_${orderId}` })).toMatchObject({ paymentMode: 'online', amount: 50 });
  });

  test('wallet + card, approved: wallet part held on the platform, then settled to the seller', async () => {
    const { seller, buyer, product } = await setup(50, 30);
    const platformBefore = await balance(platform);

    const res = await initiate(buyer, product, 30);
    expect(res.body.paymentMethod).toBe('mixed');
    expect(res.body.data.gateway.fields.AMOUNT).toBe('20.00');
    expect(await balance(buyer)).toBe(0);
    expect(await balance(platform)).toBe(platformBefore + 30);

    await payAtBank(res.body.data.gateway, 'approve');

    expect(await balance(platform)).toBe(platformBefore);
    expect(await balance(seller)).toBe(50);
    expect(await Order.findById(res.body.data.orderId)).toMatchObject({ paymentStatus: 'completed', paymentMethod: 'mixed', paidAmount: 50 });
  });

  test('wallet + card, declined: hold released to the buyer, item back in stock', async () => {
    const { seller, buyer, product } = await setup(50, 30);
    const platformBefore = await balance(platform);

    const res = await initiate(buyer, product, 30);
    await payAtBank(res.body.data.gateway, 'decline');

    expect(await Order.findById(res.body.data.orderId)).toMatchObject({ paymentStatus: 'failed', status: 'cancelled' });
    expect(await balance(buyer)).toBe(30);
    expect(await balance(platform)).toBe(platformBefore);
    expect(await balance(seller)).toBe(0);
    expect(await quantity(product)).toBe(1);
  });

  test('the browser return alone completes the order when the callback never arrives', async () => {
    const { seller, buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const back = await request(app).post(`/api/payments/azericard/return/${res.body.data.orderId}`).type('form')
      .send(bankSigned(res.body.data.gateway.fields));
    expect(back.status).toBe(303);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('completed');
    expect(await balance(seller)).toBe(40);
  });

  test('a replayed result changes nothing', async () => {
    const { seller, buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'approve');

    const sent = mockBank.payments.get(res.body.data.gateway.fields.ORDER).result;
    expect((await postCallback(sent)).status).toBe(200);
    expect(await balance(seller)).toBe(40);
    expect(await Transaction.countDocuments({ referenceId: res.body.data.orderId })).toBe(1);
  });

  test('a result not signed by the bank is rejected', async () => {
    const { seller, buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const forged = { ...bankSigned(res.body.data.gateway.fields) };
    forged.P_SIGN = p.sign(forged, p.RESULT_SIGN_FIELDS, crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey);

    expect((await postCallback(forged)).status).toBe(400);
    expect((await postCallback({ ...bankSigned(res.body.data.gateway.fields), AMOUNT: '1.00' })).status).toBe(400);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
    expect(await balance(seller)).toBe(0);
  });

  test('a declined result with ACTION/RC flipped to "approved" is not applied (APPROVAL is signed and empty)', async () => {
    const { seller, buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const declined = bankSigned(res.body.data.gateway.fields, { approved: false });

    const cb = await postCallback({ ...declined, ACTION: '0', RC: '00' });
    expect(cb.status).toBe(200);
    const order = await Order.findById(res.body.data.orderId);
    expect(order.paymentStatus).toBe('processing');
    expect(order.paymentMetadata.needsReview).toBe(true);
    expect(await balance(seller)).toBe(0);
  });

  test("one bank transaction cannot pay for a second order (ORDER isn't signed)", async () => {
    const a = await setup(40);
    const b = await setup(40);
    const resA = await initiate(a.buyer, a.product, 0);
    const resB = await initiate(b.buyer, b.product, 0);
    await payAtBank(resA.body.data.gateway, 'approve');

    const paidForA = mockBank.payments.get(resA.body.data.gateway.fields.ORDER).result;
    await postCallback({ ...paidForA, ORDER: resB.body.data.gateway.fields.ORDER });

    const orderB = await Order.findById(resB.body.data.orderId);
    expect(orderB.paymentStatus).toBe('processing');
    expect(orderB.paymentMetadata.needsReview).toBe(true);
    expect(await balance(b.seller)).toBe(0);
  });

  test('a genuine approval arriving after a (forged) decline is flagged for review', async () => {
    const { buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    await postCallback(bankSigned(res.body.data.gateway.fields, { approved: false }));
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('failed');

    await postCallback(bankSigned(res.body.data.gateway.fields));
    const order = await Order.findById(res.body.data.orderId);
    expect(order.paymentStatus).toBe('failed');
    expect(order.paymentMetadata.needsReview).toBe(true);
  });

  test('a correctly signed result for the wrong amount is not applied', async () => {
    const { seller, buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const cb = await postCallback(bankSigned({ ...res.body.data.gateway.fields, AMOUNT: '1.00' }));
    expect(cb.status).toBe(409);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
    expect(await balance(seller)).toBe(0);
  });

  test('the bank rejects a request we did not sign', async () => {
    const { buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const page = await request(app).post('/api/payments/mock-azericard/pay').type('form')
      .send({ ...res.body.data.gateway.fields, AMOUNT: '0.01' });
    expect(page.status).toBe(400);
  });

  test('ORDER trace numbers (last 6 digits) are unique across checkouts', async () => {
    const orders = [];
    for (let i = 0; i < 5; i += 1) {
      const { buyer, product } = await setup(10);
      orders.push((await initiate(buyer, product, 0)).body.data.gateway.fields.ORDER);
    }
    expect(new Set(orders.map((o) => o.slice(-6))).size).toBe(5);
  });

  test('the buyer cannot cancel while the bank is still confirming', async () => {
    const { buyer, product } = await setup(40);
    const res = await initiate(buyer, product, 0);
    const cancel = await request(app).post(`/api/payments/order/${res.body.data.orderId}/cancel`).set('Authorization', tokenFor(buyer)).send({});
    expect(cancel.status).toBe(409);
    expect(cancel.body.code).toBe('PAYMENT_IN_PROGRESS');
  });

  test('allowlist: only listed accounts (by email or id) may pay by card', async () => {
    const allowed = await setup(10);
    const other = await setup(10);
    process.env.AZERICARD_ALLOWED_USERS = ` ${allowed.buyer.email.toUpperCase()} , someone-else@example.com`;
    try {
      expect((await initiate(other.buyer, other.product, 0)).status).toBe(503);
      expect(await quantity(other.product)).toBe(1);
      expect((await initiate(allowed.buyer, allowed.product, 0)).status).toBe(200);
      process.env.AZERICARD_ALLOWED_USERS = String(other.buyer._id);
      expect((await initiate(other.buyer, other.product, 0)).status).toBe(200);
    } finally {
      delete process.env.AZERICARD_ALLOWED_USERS;
    }
  });

  test('test terminal in production without an allowlist: nobody can pay by card', async () => {
    const { buyer, product } = await setup(10);
    const saved = { ...process.env };
    Object.assign(process.env, {
      NODE_ENV: 'production', AZERICARD_MODE: 'test',
      AZERICARD_GATEWAY_URL: 'https://testmpi.3dsecure.az/cgi-bin/cgi_link', AZERICARD_TERMINAL: '17204526',
    });
    try {
      expect((await initiate(buyer, product, 0)).status).toBe(503);
      expect(await quantity(product)).toBe(1);
    } finally {
      process.env = saved;
    }
  });

  test('card payments switched off: refused before anything is written', async () => {
    process.env.AZERICARD_ENABLED = 'false';
    try {
      const { buyer, product } = await setup(40);
      const res = await initiate(buyer, product, 0);
      expect(res.status).toBe(503);
      expect(await quantity(product)).toBe(1);
    } finally {
      process.env.AZERICARD_ENABLED = 'true';
    }
  });
});

describe('reconciliation of payments with no result', () => {
  test('mock: approved at the bank but no result reached us -> completed by the status check', async () => {
    const { seller, buyer, product } = await setup(60);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'approve_no_callback');
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');

    await reconcileStaleCardOrders({ now: later() });
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('completed');
    expect(await balance(seller)).toBe(60);
  });

  test('mock: buyer never reached the bank -> failed, wallet hold released, item restocked', async () => {
    const { buyer, product } = await setup(60, 25);
    const res = await initiate(buyer, product, 25);
    await reconcileStaleCardOrders({ now: later() });
    expect(await Order.findById(res.body.data.orderId)).toMatchObject({ paymentStatus: 'failed', status: 'cancelled' });
    expect(await balance(buyer)).toBe(25);
    expect(await quantity(product)).toBe(1);
  });

  test('mock: cancelled at the bank page -> failed after the status check', async () => {
    const { seller, buyer, product } = await setup(60);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'cancel');
    await reconcileStaleCardOrders({ now: later() });
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('failed');
    expect(await balance(seller)).toBe(0);
  });

  test('test/live (no status check yet): a stuck order is flagged for review, never auto-failed', async () => {
    const { buyer, product } = await setup(60, 25);
    const res = await initiate(buyer, product, 25);

    const saved = { ...process.env };
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    Object.assign(process.env, {
      AZERICARD_MODE: 'test',
      AZERICARD_GATEWAY_URL: 'https://testmpi.3dsecure.az/cgi-bin/cgi_link',
      AZERICARD_TERMINAL: '17204526',
      AZERICARD_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      AZERICARD_BANK_PUBLIC_KEY: mockBankKeyPair().publicKey.export({ type: 'spki', format: 'pem' }),
    });
    try {
      const summary = await reconcileStaleCardOrders({ now: later() });
      expect(summary.review).toBeGreaterThanOrEqual(1);
      const order = await Order.findById(res.body.data.orderId);
      expect(order.paymentStatus).toBe('processing');
      expect(order.paymentMetadata.needsReview).toBe(true);
      expect(await balance(buyer)).toBe(0);
    } finally {
      process.env = saved;
    }
  });

  test('recent orders are left alone', async () => {
    const { buyer, product } = await setup(60);
    const res = await initiate(buyer, product, 0);
    await reconcileStaleCardOrders();
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
  });
});
