jest.mock('../services/emailService', () => ({ sendEmail: jest.fn().mockResolvedValue() }));
jest.mock('../utils/ioInstance', () => ({ emitToUser: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);
process.env.Admin_Id = new mongoose.Types.ObjectId().toString();
process.env.AZERICARD_ENABLED = 'false';

const User = require('../models/user');
const Product = require('../models/product.model');
const Order = require('../models/Order');
const Transaction = require('../models/transaction.model');

let replSet;
let app;

const checkoutDetails = { name: 'Buyer', email: 'buyer@example.com', address: '1 Main St', city: 'Baku', pincode: 'AZ1000' };

const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;
const balance = async (user) => (await User.findById(user._id)).walletBalance;

let n = 0;
const makeUser = (walletBalance = 0, extra = {}) => {
  n += 1;
  return User.create({ email: `u${n}@example.com`, username: `user${n}`, password: 'x'.repeat(12), walletBalance, ...extra });
};
const makeProduct = (owner, price = 50, quantity = 1) =>
  Product.create({
    title: { en: 'Bike' }, category: { en: 'Sport' }, price, description: { en: 'A bike' },
    condition: 'Used', postalCode: 'AZ1000', name: { en: 'Seller' }, termsAccepted: true,
    quantity, owner: owner._id,
  });

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Product.init(), Order.init(), Transaction.init()]);

  app = express();
  app.use(express.json());
  app.use('/api/payments', require('../Routes/payment-proxy.routes'));
  app.use('/api/transaction', require('../Routes/transaction.route'));
  app.use('/Orders', require('../Routes/Order'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

describe('POST /api/payments/initiate', () => {
  test('wallet checkout moves money, creates a paid order, ledgers it and reserves the item', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(100);
    const product = await makeProduct(seller, 50);

    const res = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    const order = await Order.findById(res.body.data.orderId);
    expect(order).toMatchObject({ status: 'paid', paymentStatus: 'completed', paymentMethod: 'wallet', paidAmount: 50 });
    expect(await balance(buyer)).toBe(50);
    expect(await balance(seller)).toBe(50);
    const txn = await Transaction.findOne({ transactionId: order.transactionId });
    expect(txn).toMatchObject({ amount: 50, paymentMode: 'Wallet', status: 'success' });
    expect(String(txn.senderId)).toBe(String(buyer._id));
    expect((await Product.findById(product._id)).quantity).toBe(0);
  });

  test("ignores a body buyerId: cannot spend someone else's wallet", async () => {
    const seller = await makeUser(0);
    const victim = await makeUser(500);
    const attacker = await makeUser(0);
    const product = await makeProduct(seller, 50);

    const res = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(attacker))
      .send({ buyerId: victim._id, productId: product._id, walletDeduction: 50, checkoutDetails });

    expect(res.status).toBe(403);
    expect(await balance(victim)).toBe(500);
    expect(await Order.countDocuments({ productId: product._id })).toBe(0);
  });

  test('insufficient balance rolls back everything, including the item reservation', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(10);
    const product = await makeProduct(seller, 50);

    const res = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
    expect(await balance(buyer)).toBe(10);
    expect((await Product.findById(product._id)).quantity).toBe(1);
    expect(await Order.countDocuments({ productId: product._id })).toBe(0);
  });

  test('card or mixed payment is refused before anything is written', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(20);
    const product = await makeProduct(seller, 50);

    const res = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 20, checkoutDetails });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ONLINE_PAYMENT_UNAVAILABLE');
    expect(await balance(buyer)).toBe(20);
    expect(await Order.countDocuments({ productId: product._id })).toBe(0);
  });

  test('two buyers racing for the last item: exactly one wins', async () => {
    const seller = await makeUser(0);
    const a = await makeUser(100);
    const b = await makeUser(100);
    const product = await makeProduct(seller, 50, 1);

    const results = await Promise.all([a, b].map((u) =>
      request(app).post('/api/payments/initiate').set('Authorization', tokenFor(u))
        .send({ productId: product._id, walletDeduction: 50, checkoutDetails })));

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await balance(seller)).toBe(50);
    expect((await balance(a)) + (await balance(b))).toBe(150);
  });

  test('cannot buy your own product', async () => {
    const seller = await makeUser(100);
    const product = await makeProduct(seller, 50);
    const res = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(seller))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OWN_PRODUCT');
  });
});

describe('POST /api/payments/order/:id/cancel', () => {
  test('reverses the payment seller -> buyer through the ledger and restocks', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(50);
    const product = await makeProduct(seller, 50);
    const paid = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });
    const orderId = paid.body.data.orderId;

    const res = await request(app).post(`/api/payments/order/${orderId}/cancel`).set('Authorization', tokenFor(buyer)).send({});
    expect(res.status).toBe(200);
    expect(await balance(buyer)).toBe(50);
    expect(await balance(seller)).toBe(0);
    expect(await Transaction.exists({ transactionId: `REFUND_${orderId}`, type: 'refund' })).toBeTruthy();
    expect((await Product.findById(product._id)).quantity).toBe(1);

    const again = await request(app).post(`/api/payments/order/${orderId}/cancel`).set('Authorization', tokenFor(buyer)).send({});
    expect(again.status).toBe(400);
    expect(await balance(buyer)).toBe(50);
  });

  test('only the buyer can cancel', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(50);
    const product = await makeProduct(seller, 50);
    const paid = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });

    const res = await request(app).post(`/api/payments/order/${paid.body.data.orderId}/cancel`).set('Authorization', tokenFor(seller)).send({});
    expect(res.status).toBe(403);
  });
});

describe('GET /api/payments/order/:id', () => {
  test('buyer can read their order (req.user._id comparison works)', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(50);
    const product = await makeProduct(seller, 50);
    const paid = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 50, checkoutDetails });

    const res = await request(app).get(`/api/payments/order/${paid.body.data.orderId}`).set('Authorization', tokenFor(buyer));
    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe('completed');

    const stranger = await makeUser(0);
    const denied = await request(app).get(`/api/payments/order/${paid.body.data.orderId}`).set('Authorization', tokenFor(stranger));
    expect(denied.status).toBe(403);
  });
});

describe('POST /api/transaction/transferFund', () => {
  test("rejects a senderId that isn't the logged-in user", async () => {
    const victim = await makeUser(500);
    const attacker = await makeUser(0);
    const res = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(attacker))
      .send({ senderId: victim._id, receiverId: attacker._id, amount: 500, transactionId: 'steal-1' });
    expect(res.status).toBe(403);
    expect(await balance(victim)).toBe(500);
    expect(await balance(attacker)).toBe(0);
  });

  test('transfers from own wallet and ledgers it; duplicate transactionId is refused', async () => {
    const a = await makeUser(100);
    const b = await makeUser(0);
    const body = { receiverId: String(b._id), amount: 30, transactionId: 'tx-own-1' };

    const res = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(a)).send(body);
    expect(res.status).toBe(200);
    const dup = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(a)).send(body);
    expect(dup.status).toBe(409);
    expect(await balance(a)).toBe(70);
    expect(await balance(b)).toBe(30);
  });

  test('cannot overdraw', async () => {
    const a = await makeUser(10);
    const b = await makeUser(0);
    const res = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(a))
      .send({ receiverId: String(b._id), amount: 30, transactionId: 'tx-over-1' });
    expect(res.status).toBe(400);
    expect(await balance(a)).toBe(10);
  });

  test('an admin may send from the platform wallet; a non-admin may not', async () => {
    const platform = await User.create({
      _id: process.env.Admin_Id, email: 'platform@example.com', username: 'platform', password: 'x'.repeat(12), walletBalance: 100,
    });
    const admin = await makeUser(0, { role: 'admin' });
    const user = await makeUser(0);
    const seller = await makeUser(0);

    const byUser = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(user))
      .send({ senderId: String(platform._id), receiverId: String(seller._id), amount: 40, transactionId: 'rel-1' });
    expect(byUser.status).toBe(403);

    const byAdmin = await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(admin))
      .send({ senderId: String(platform._id), receiverId: String(seller._id), amount: 40, transactionId: 'rel-2' });
    expect(byAdmin.status).toBe(200);
    expect(await balance(seller)).toBe(40);
  });
});

describe('POST /Orders (legacy mobile flow)', () => {
  test('creates the order only for a real matching payment, once', async () => {
    const seller = await makeUser(0);
    const buyer = await makeUser(100);
    const product = await makeProduct(seller, 50);
    const address = { name: 'Buyer', email: 'buyer@example.com', city: 'Baku', address: '1 Main St', zipCode: 'AZ1000' };

    const fake = await request(app).post('/Orders').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, transactionId: 'never-paid', address });
    expect(fake.status).toBe(402);

    await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(buyer))
      .send({ receiverId: String(seller._id), amount: 50, transactionId: 'mobile-1' });

    const ok = await request(app).post('/Orders').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, transactionId: 'mobile-1', address });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ status: 'paid', paymentStatus: 'completed', total: 50 });

    const replay = await request(app).post('/Orders').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, transactionId: 'mobile-1', address });
    expect(replay.status).toBe(409);
  });

  test("cannot claim someone else's payment", async () => {
    const seller = await makeUser(0);
    const payer = await makeUser(100);
    const other = await makeUser(0);
    const product = await makeProduct(seller, 50);
    await request(app).post('/api/transaction/transferFund').set('Authorization', tokenFor(payer))
      .send({ receiverId: String(seller._id), amount: 50, transactionId: 'mobile-2' });

    const res = await request(app).post('/Orders').set('Authorization', tokenFor(other))
      .send({ productId: product._id, transactionId: 'mobile-2', address: { name: 'x', email: 'x@x.x', city: 'c', address: 'a', zipCode: 'z' } });
    expect(res.status).toBe(402);
  });
});
