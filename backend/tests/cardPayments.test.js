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

const checkoutDetails = { name: 'Buyer', email: 'buyer@example.com', address: '1 Main St', city: 'Baku', pincode: 'AZ1000' };
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

const initiate = (buyer, product, walletDeduction) =>
  request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
    .send({ productId: product._id, walletDeduction, checkoutDetails });

// What the browser does: post the signed form to the bank, then click a button there.
async function payAtBank(gateway, decision) {
  const page = await request(app).post('/api/payments/mock-azericard/pay').type('form').send(gateway.fields);
  expect(page.status).toBe(200);
  const done = await request(app).post(`/api/payments/mock-azericard/pay/${gateway.fields.ORDER}/decision`).type('form').send({ decision });
  expect(done.status).toBe(303);
  expect(done.headers.location).toBe(gateway.fields.BACKREF);
}

const postCallback = (fields) => request(app).post('/api/payments/azericard/callback').type('form').send(fields);

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Product.init(), Order.init(), Transaction.init()]);

  app = express();
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

describe('card checkout against the mock bank', () => {
  test('card only, approved: order paid, seller credited from the gateway, item reserved', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 50);

    const res = await initiate(buyer, product, 0);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ paymentMethod: 'card', completed: false });
    const { orderId, gateway } = res.body.data;
    expect(gateway.url).toBe(getConfig().gatewayUrl);
    expect(gateway.fields).toMatchObject({ AMOUNT: '50.00', CURRENCY: '944', TRTYPE: '1', BACKREF: `http://localhost:5173/payment/result/${orderId}` });
    expect(await quantity(product)).toBe(0);
    expect((await Order.findById(orderId)).paymentStatus).toBe('processing');

    await payAtBank(gateway, 'approve');

    const order = await Order.findById(orderId);
    expect(order).toMatchObject({ paymentStatus: 'completed', status: 'paid', paymentMethod: 'card', paidAmount: 50 });
    expect(order.gateway.rrn).toBeTruthy();
    expect(await balance(seller)).toBe(50);
    expect(await balance(buyer)).toBe(0);
    expect(await Transaction.findOne({ transactionId: `CARD_${orderId}` })).toMatchObject({ paymentMode: 'online', amount: 50 });
  });

  test('wallet + card, approved: wallet part held on the platform, then settled to the seller', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(30);
    const product = await makeProduct(seller, 50);
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
    const seller = await makeUser(0);
    const buyer = await makeUser(30);
    const product = await makeProduct(seller, 50);
    const platformBefore = await balance(platform);

    const res = await initiate(buyer, product, 30);
    await payAtBank(res.body.data.gateway, 'decline');

    expect(await Order.findById(res.body.data.orderId)).toMatchObject({ paymentStatus: 'failed', status: 'cancelled' });
    expect(await balance(buyer)).toBe(30);
    expect(await balance(platform)).toBe(platformBefore);
    expect(await balance(seller)).toBe(0);
    expect(await quantity(product)).toBe(1);
  });

  test('a replayed callback changes nothing', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 40);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'approve');

    const sent = mockBank.payments.get(res.body.data.gateway.fields.ORDER).result;
    const replay = await postCallback(sent);
    expect(replay.status).toBe(200);
    expect(await balance(seller)).toBe(40);
    expect(await Transaction.countDocuments({ referenceId: res.body.data.orderId })).toBe(1);
  });

  test('a forged callback (not signed by the bank) is rejected', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 40);
    const res = await initiate(buyer, product, 0);
    const { fields } = res.body.data.gateway;

    const forged = {
      TERMINAL: fields.TERMINAL, TRTYPE: '1', ORDER: fields.ORDER, AMOUNT: fields.AMOUNT, CURRENCY: fields.CURRENCY,
      ACTION: '0', RC: '00', APPROVAL: '123456', RRN: '111111111111', INT_REF: 'ABC', TIMESTAMP: p.timestamp(), NONCE: p.nonce(),
    };
    forged.P_SIGN = p.sign(forged, p.RESULT_SIGN_FIELDS, crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey);

    const cb = await postCallback(forged);
    expect(cb.status).toBe(400);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
    expect(await balance(seller)).toBe(0);

    const tampered = { ...mockSigned(fields, true), AMOUNT: '1.00' };
    expect((await postCallback(tampered)).status).toBe(400);
  });

  test('a correctly signed result for the wrong amount is not applied', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 40);
    const res = await initiate(buyer, product, 0);

    const wrong = mockSigned({ ...res.body.data.gateway.fields, AMOUNT: '1.00' }, true);
    const cb = await postCallback(wrong);
    expect(cb.status).toBe(409);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
    expect(await balance(seller)).toBe(0);
  });

  test('the bank rejects a request we did not sign', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 40);
    const res = await initiate(buyer, product, 0);
    const page = await request(app).post('/api/payments/mock-azericard/pay').type('form')
      .send({ ...res.body.data.gateway.fields, AMOUNT: '0.01' });
    expect(page.status).toBe(400);
  });

  test('the buyer cannot cancel while the bank is still confirming', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 40);
    const res = await initiate(buyer, product, 0);
    const cancel = await request(app).post(`/api/payments/order/${res.body.data.orderId}/cancel`).set('Authorization', tokenFor(buyer)).send({});
    expect(cancel.status).toBe(409);
    expect(cancel.body.code).toBe('PAYMENT_IN_PROGRESS');
  });

  test('card payments switched off: refused before anything is written', async () => {
    process.env.AZERICARD_ENABLED = 'false';
    try {
      const seller = await makeUser(0);
      const buyer = await makeUser(0);
      const product = await makeProduct(seller, 40);
      const res = await initiate(buyer, product, 0);
      expect(res.status).toBe(503);
      expect(await quantity(product)).toBe(1);
    } finally {
      process.env.AZERICARD_ENABLED = 'true';
    }
  });
});

describe('reconciliation of payments whose callback never arrived', () => {
  test('approved at the bank but the callback was lost: completed by the status check', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 60);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'approve_no_callback');
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');

    const summary = await reconcileStaleCardOrders({ now: later() });
    expect(summary.completed).toBeGreaterThanOrEqual(1);
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('completed');
    expect(await balance(seller)).toBe(60);
  });

  test('buyer never reached the bank: failed, wallet hold released, item restocked', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(25);
    const product = await makeProduct(seller, 60);
    const res = await initiate(buyer, product, 25);
    expect(await balance(buyer)).toBe(0);

    await reconcileStaleCardOrders({ now: later() });
    expect(await Order.findById(res.body.data.orderId)).toMatchObject({ paymentStatus: 'failed', status: 'cancelled' });
    expect(await balance(buyer)).toBe(25);
    expect(await quantity(product)).toBe(1);
  });

  test('cancelled at the bank page: failed after the status check', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 60);
    const res = await initiate(buyer, product, 0);
    await payAtBank(res.body.data.gateway, 'cancel');

    await reconcileStaleCardOrders({ now: later() });
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('failed');
    expect(await balance(seller)).toBe(0);
  });

  test('recent orders are left alone', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(0);
    const product = await makeProduct(seller, 60);
    const res = await initiate(buyer, product, 0);
    await reconcileStaleCardOrders();
    expect((await Order.findById(res.body.data.orderId)).paymentStatus).toBe('processing');
  });
});

describe('protocol and config', () => {
  test('signing string: length-prefixed values, "-" for empty', () => {
    expect(p.signingString({ A: 'AZN', B: '', C: '12.50' }, ['A', 'B', 'C'])).toBe('3AZN-512.50');
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

function mockSigned(requestFields, approved) {
  const fields = {
    TERMINAL: requestFields.TERMINAL, TRTYPE: '1', ORDER: requestFields.ORDER, AMOUNT: requestFields.AMOUNT,
    CURRENCY: requestFields.CURRENCY, ACTION: approved ? '0' : '2', RC: approved ? '00' : '05', APPROVAL: '654321',
    RRN: '222222222222', INT_REF: 'DEF', TIMESTAMP: p.timestamp(), NONCE: p.nonce(),
  };
  fields.P_SIGN = p.sign(fields, p.RESULT_SIGN_FIELDS, mockBankKeyPair().privateKey);
  return fields;
}
