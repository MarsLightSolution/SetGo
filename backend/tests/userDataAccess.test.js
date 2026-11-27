// Access control for user data (/users), wallet history, and identity on /reviews writes.
jest.mock('../services/emailService', () => ({ sendEmail: jest.fn().mockResolvedValue() }));
jest.mock('../utils/ioInstance', () => ({ emitToUser: jest.fn() }));
jest.mock('../utils/redisClient', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
}));

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
const redisClient = require('../utils/redisClient');

let replSet;
let app;

const SECRET_KEYS = ['password', 'refreshTokens', 'resetToken', 'resetTokenExpiration', 'pushToken'];
const checkoutDetails = { name: 'Buyer', email: 'buyer@example.com', address: '1 Main St', city: 'Baku', pincode: '1000' };
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;

let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({
    email: `ua${n}@example.com`, username: `ua_user${n}`, password: 'hashed-secret-value',
    refreshTokens: ['live-refresh-token'], resetToken: 'reset-123', phoneNumber: '+994500000000',
    walletBalance: 100, ...extra,
  });
};
const makeProduct = (owner, price = 40) =>
  Product.create({
    title: { en: 'Bike' }, category: { en: 'Sport' }, price, description: { en: 'A bike' },
    condition: 'Used', postalCode: 'AZ1000', name: { en: 'Seller' }, termsAccepted: true,
    quantity: 1, owner: owner._id,
  });

const expectNoSecrets = (obj) => {
  const json = JSON.stringify(obj);
  for (const k of SECRET_KEYS) expect(obj).not.toHaveProperty(k);
  expect(json).not.toContain('hashed-secret-value');
  expect(json).not.toContain('live-refresh-token');
  expect(json).not.toContain('reset-123');
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Product.init(), Order.init(), Transaction.init()]);

  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/users', require('../Routes/userRouter'));
  app.use('/reviews', require('../Routes/reviewRoutes'));
  app.use('/api/payments', require('../Routes/payment-proxy.routes'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

describe('/users/get-users', () => {
  test('requires login, and admin; never returns secrets; purges the legacy cache', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });

    const anon = await request(app).get('/users/get-users');
    expect(anon.status).toBe(401);
    expect((await request(app).get('/users/get-users').set('Authorization', tokenFor(user))).status).toBe(403);

    const res = await request(app).get('/users/get-users').set('Authorization', tokenFor(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    res.body.data.forEach(expectNoSecrets);
    expect(redisClient.del).toHaveBeenCalledWith('userList');
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  test('/:id: self gets private fields without secrets; others get public profile only', async () => {
    const me = await makeUser();
    const other = await makeUser();

    expect((await request(app).get(`/users/get-users/${me._id}`)).status).toBe(401);

    const self = await request(app).get(`/users/get-users/${me._id}`).set('Authorization', tokenFor(me));
    expect(self.status).toBe(200);
    expect(self.body.data).toMatchObject({ email: me.email, walletBalance: 100, phoneNumber: '+994500000000' });
    expectNoSecrets(self.body.data);

    const peek = await request(app).get(`/users/get-users/${me._id}`).set('Authorization', tokenFor(other));
    expect(peek.status).toBe(200);
    expect(peek.body.data.username).toBe(me.username);
    for (const k of ['email', 'walletBalance', 'phoneNumber', 'deliveryAddress', 'billingAddress']) {
      expect(peek.body.data).not.toHaveProperty(k);
    }
    expectNoSecrets(peek.body.data);
  });
});

describe('/users/:id/wallet and /transactions', () => {
  test('only the user themself or an admin', async () => {
    const me = await makeUser();
    const other = await makeUser();
    const admin = await makeUser({ role: 'admin' });

    for (const path of [`/users/${me._id}/wallet`, `/users/${me._id}/transactions`]) {
      expect((await request(app).get(path)).status).toBe(401);
      expect((await request(app).get(path).set('Authorization', tokenFor(other))).status).toBe(403);
      expect((await request(app).get(path).set('Authorization', tokenFor(me))).status).toBe(200);
      expect((await request(app).get(path).set('Authorization', tokenFor(admin))).status).toBe(200);
    }
  });
});

describe('/reviews identity comes from the token', () => {
  test('a stranger cannot confirm delivery by sending the buyer id', async () => {
    const seller = await makeUser({ walletBalance: 0 });
    const buyer = await makeUser();
    const stranger = await makeUser();
    const product = await makeProduct(seller);
    const placed = await request(app).post('/api/payments/initiate').set('Authorization', tokenFor(buyer))
      .send({ productId: product._id, walletDeduction: 40, checkoutDetails });
    expect(placed.status).toBe(200);
    const orderId = placed.body.data.orderId;

    const url = `/reviews/orders/${orderId}/confirm-delivery`;
    expect((await request(app).post(url).send({ buyerId: String(buyer._id) })).status).toBe(401);
    const spoof = await request(app).post(url).set('Authorization', tokenFor(stranger)).send({ buyerId: String(buyer._id) });
    expect(spoof.status).toBe(403);
    expect((await Order.findById(orderId)).status).toBe('paid');

    const ok = await request(app).post(url).set('Authorization', tokenFor(buyer)).send({});
    expect(ok.status).toBe(200);
    expect((await Order.findById(orderId)).status).toBe('delivered');
  });

  test('write routes require login; public reads stay public', async () => {
    const id = new mongoose.Types.ObjectId();
    expect((await request(app).post(`/reviews/${id}/helpful`).send({ userId: String(id) })).status).toBe(401);
    expect((await request(app).post('/reviews').send({})).status).toBe(401);
    expect((await request(app).get('/reviews/pending?buyerId=x')).status).toBe(401);
    expect((await request(app).get('/reviews/admin/statistics')).status).toBe(401);
    expect((await request(app).get(`/reviews/product/${id}/summary`)).status).not.toBe(401);
  });
});
