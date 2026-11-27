// POST /order-receipt/:orderId/confirm — buyer (from the token) confirms receipt.
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');
const Order = require('../models/Order');

const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;

let replSet;
let app;
let n = 0;
const makeUser = () => {
  n += 1;
  return User.create({ email: `r${n}@example.com`, username: `receipt_user${n}`, password: 'x'.repeat(12) });
};
const makeOrder = (buyer, seller, status) => Order.create({
  buyerId: buyer._id, sellerId: seller._id, productId: new mongoose.Types.ObjectId(), total: 10, status,
  paymentStatus: 'completed',
  checkoutDetails: { name: 'B', email: 'b@example.com', address: '1 St', city: 'Baku', pincode: '1000' },
});
const confirm = (order, user) => {
  const req = request(app).post(`/order-receipt/${order._id}/confirm`);
  return user ? req.set('Authorization', tokenFor(user)) : req;
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Order.init()]);
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/order-receipt', require('../Routes/orderReceipt.routes'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

test('requires login', async () => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const order = await makeOrder(buyer, seller, 'paid');
  expect((await confirm(order)).status).toBe(401);
});

test.each(['paid', 'shipped'])('buyer can confirm a %s order', async (status) => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const order = await makeOrder(buyer, seller, status);
  const res = await confirm(order, buyer);
  expect(res.status).toBe(200);
  const saved = await Order.findById(order._id);
  expect(saved.status).toBe('delivered');
  expect(saved.deliveryConfirmedByBuyer).toBe(true);
});

test('only the buyer can confirm', async () => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const order = await makeOrder(buyer, seller, 'shipped');
  expect((await confirm(order, seller)).status).toBe(403);
  expect((await Order.findById(order._id)).deliveryConfirmedByBuyer).toBeFalsy();
});

test('cancelled orders cannot be confirmed; double confirm is rejected', async () => {
  const buyer = await makeUser();
  const seller = await makeUser();
  const cancelled = await makeOrder(buyer, seller, 'cancelled');
  expect((await confirm(cancelled, buyer)).status).toBe(400);

  const order = await makeOrder(buyer, seller, 'paid');
  expect((await confirm(order, buyer)).status).toBe(200);
  expect((await confirm(order, buyer)).status).toBe(400);
});
