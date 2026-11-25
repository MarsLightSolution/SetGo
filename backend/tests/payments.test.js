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
const Notification = require('../models/Notification');

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
  app.use('/', require('../Routes/Admin'));
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

const payWithWallet = async (price = 50) => {
  const seller = await makeUser(0);
  const buyer = await makeUser(price);
  const product = await makeProduct(seller, price);
  const paid = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
    .send({ productId: product._id, walletDeduction: price, checkoutDetails });
  return { seller, buyer, product, orderId: paid.body.data.orderId };
};

describe('POST /api/payments/order/:id/cancel (buyer)', () => {
  test('a paid order cannot be cancelled or refunded by the buyer: support / admin only', async () => {
    const { seller, buyer, orderId } = await payWithWallet(50);

    const res = await request(app).post(`/api/payments/order/${orderId}/cancel`).set('Authorization', tokenFor(buyer)).send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('REFUND_ADMIN_ONLY');
    expect(await balance(buyer)).toBe(0);
    expect(await balance(seller)).toBe(50);
    expect(await Order.findById(orderId)).toMatchObject({ status: 'paid', paymentStatus: 'completed' });
  });

  test('only the buyer can call it', async () => {
    const { seller, orderId } = await payWithWallet(50);
    const res = await request(app).post(`/api/payments/order/${orderId}/cancel`).set('Authorization', tokenFor(seller)).send({});
    expect(res.status).toBe(403);
  });
});

describe('admin order actions', () => {
  let admin;
  beforeAll(async () => {
    admin = await makeUser(0, { role: 'admin' });
  });
  const asAdmin = (method, path, body = {}) => request(app)[method](path).set('Authorization', tokenFor(admin)).send(body);
  const notesFor = (user, orderId) => Notification.find({ recipientId: String(user._id), type: 'order', 'metadata.orderId': String(orderId) }).lean();

  test('admin routes need an admin login', async () => {
    const { buyer, orderId } = await payWithWallet(20);
    expect((await request(app).get('/dashboard')).status).toBe(401);
    expect((await request(app).post(`/${orderId}/refund`).send({})).status).toBe(401);
    for (const [method, path] of [['get', '/dashboard'], ['post', `/${orderId}/refund`], ['post', `/${orderId}/cancel`], ['post', `/${orderId}/approve-delivery`], ['put', `/${orderId}/release`]]) {
      const res = await request(app)[method](path).set('Authorization', tokenFor(buyer)).send({});
      expect(res.status).toBe(403);
    }
    expect(await Order.findById(orderId)).toMatchObject({ status: 'paid', paymentStatus: 'completed' });
  });

  test('refund of a wallet order: money back seller -> buyer, restocked, both notified, only once', async () => {
    const { seller, buyer, product, orderId } = await payWithWallet(50);

    const res = await asAdmin('post', `/${orderId}/refund`, { reason: 'Item not as described' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ mode: 'wallet', status: 'refunded', amount: 50 });
    expect(await balance(buyer)).toBe(50);
    expect(await balance(seller)).toBe(0);
    expect(await Order.findById(orderId)).toMatchObject({ status: 'cancelled', paymentStatus: 'refunded', cancellationReason: 'Item not as described' });
    expect(await Transaction.exists({ transactionId: `REFUND_${orderId}`, type: 'refund' })).toBeTruthy();
    expect((await Product.findById(product._id)).quantity).toBe(1);

    await new Promise((r) => setTimeout(r, 50));
    expect((await notesFor(buyer, orderId)).map((n) => n.title)).toContain('Refund completed');
    expect((await notesFor(seller, orderId)).map((n) => n.title)).toContain('Refund completed');

    const again = await asAdmin('post', `/${orderId}/refund`);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('ALREADY_REFUNDED');
    expect(await balance(buyer)).toBe(50);
  });

  test('admin cancel of a paid order refunds it', async () => {
    const { buyer, seller, orderId } = await payWithWallet(30);
    const res = await asAdmin('post', `/${orderId}/cancel`, { reason: 'Seller cannot ship' });
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('wallet');
    expect(await balance(buyer)).toBe(30);
    expect(await balance(seller)).toBe(0);
    expect(await Order.findById(orderId)).toMatchObject({ status: 'cancelled', paymentStatus: 'refunded' });
  });

  test('refund fails cleanly when the seller wallet no longer holds the money', async () => {
    const { buyer, seller, orderId } = await payWithWallet(40);
    await User.updateOne({ _id: seller._id }, { $set: { walletBalance: 10 } });
    const res = await asAdmin('post', `/${orderId}/refund`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SELLER_BALANCE_TOO_LOW');
    expect(await balance(buyer)).toBe(0);
    expect(await Order.findById(orderId)).toMatchObject({ status: 'paid', paymentStatus: 'completed' });
  });

  test('approve delivery and release funds notify buyer and seller', async () => {
    const { buyer, seller, orderId } = await payWithWallet(25);
    await Order.updateOne({ _id: orderId }, { $set: { status: 'shipped' } });

    expect((await asAdmin('post', `/${orderId}/approve-delivery`)).status).toBe(200);
    expect((await asAdmin('put', `/${orderId}/release`)).status).toBe(200);
    expect(await Order.findById(orderId)).toMatchObject({ status: 'released' });

    await new Promise((r) => setTimeout(r, 50));
    expect((await notesFor(buyer, orderId)).map((n) => n.title)).toContain('Delivery confirmed');
    expect((await notesFor(seller, orderId)).map((n) => n.title)).toEqual(expect.arrayContaining(['Delivery confirmed', 'Funds released']));

    expect((await asAdmin('post', `/${orderId}/refund`)).status).toBe(200);
  });

  test('dashboard lists orders with payment and refund status', async () => {
    const { orderId } = await payWithWallet(15);
    const res = await asAdmin('get', '/dashboard');
    expect(res.status).toBe(200);
    const row = res.body.data.orders.find((o) => String(o.id) === String(orderId));
    expect(row).toMatchObject({ paymentStatus: 'completed', cardAmount: 0, refundStatus: null });
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
