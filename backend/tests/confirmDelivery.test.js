// Buyer confirms delivery: must work once the seller has shipped (status "shipped").
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');
const Order = require('../models/Order');

// Token too: once the review routes require login (PR #220) the buyer comes from it.
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;

let replSet;
let app;
let n = 0;
const makeUser = () => {
  n += 1;
  return User.create({ email: `d${n}@example.com`, username: `deliv_user${n}`, password: 'x'.repeat(12) });
};
const makeOrder = (buyer, seller, status) => Order.create({
  buyerId: buyer._id, sellerId: seller._id, productId: new mongoose.Types.ObjectId(), total: 10, status,
  paymentStatus: 'completed',
  checkoutDetails: { name: 'B', email: 'b@example.com', address: '1 St', city: 'Baku', pincode: '1000' },
});

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Order.init()]);
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/reviews', require('../Routes/reviewRoutes'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

test('a shipped order can be confirmed by its buyer', async () => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const order = await makeOrder(buyer, seller, 'shipped');
  const res = await request(app).post(`/reviews/orders/${order._id}/confirm-delivery`).set('Authorization', tokenFor(buyer)).send({ buyerId: String(buyer._id) });
  expect(res.status).toBe(200);
  const saved = await Order.findById(order._id);
  expect(saved.status).toBe('delivered');
  expect(saved.deliveryConfirmedByBuyer).toBe(true);
});

test('cancelled orders still cannot be confirmed', async () => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const order = await makeOrder(buyer, seller, 'cancelled');
  const res = await request(app).post(`/reviews/orders/${order._id}/confirm-delivery`).set('Authorization', tokenFor(buyer)).send({ buyerId: String(buyer._id) });
  expect(res.status).toBe(400);
});
