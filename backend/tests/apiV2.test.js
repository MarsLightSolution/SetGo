// /api/v2: identity from the token, owner/participant/admin checks, no secrets in responses.
jest.mock('twilio', () => () => ({
  verify: { v2: { services: () => ({ verificationChecks: { create: jest.fn().mockResolvedValue({ status: 'approved' }) }, verifications: { create: jest.fn().mockResolvedValue({ status: 'pending' }) } }) } },
}));
jest.mock('../utils/redisClient', () => ({ del: jest.fn().mockResolvedValue(1), get: jest.fn(), set: jest.fn() }));
jest.mock('../services/emailService', () => ({ sendEmail: jest.fn().mockResolvedValue() }));
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn(), getIO: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn().mockResolvedValue({ data: {} }), post: jest.fn().mockResolvedValue({ data: {} }) }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');
const Order = require('../models/Order');
const Product = require('../models/product.model');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');

let replSet;
let app;
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;
let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({ email: `v${n}@example.com`, username: `v2_user${n}`, password: 'x'.repeat(12), ...extra });
};
const makeOrder = (buyer, seller, status = 'paid', productId = new mongoose.Types.ObjectId()) => Order.create({
  buyerId: buyer._id, sellerId: seller._id, productId, total: 10, status,
  paymentStatus: 'completed',
  checkoutDetails: { name: 'B', email: 'b@example.com', address: '1 St', city: 'Baku', pincode: '1000' },
});
const makeProduct = (owner) => Product.create({
  title: { en: 'Bike' }, category: { en: 'Sport' }, price: 10, description: { en: 'A bike' },
  condition: 'Used', postalCode: '1000', name: { en: 'Seller' }, termsAccepted: true, quantity: 1, owner: owner._id,
});
const as = (user) => (req) => (user ? req.set('Authorization', tokenFor(user)) : req);
const api = (method, path, user) => as(user)(request(app)[method](`/api/v2${path}`));

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Order.init(), Product.init(), Conversation.init(), Message.init()]);
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/v2', require('../Routes/v2'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

describe('orders', () => {
  test('order detail: buyer, seller, admin only', async () => {
    const [buyer, seller, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    const admin = await makeUser({ role: 'admin' });
    const order = await makeOrder(buyer, seller);
    expect((await api('get', `/orders/${order._id}`)).status).toBe(401);
    expect((await api('get', `/orders/${order._id}`, stranger)).status).toBe(403);
    for (const u of [buyer, seller, admin]) expect((await api('get', `/orders/${order._id}`, u)).status).toBe(200);
  });

  test("lists: only your own (or admin)", async () => {
    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    expect((await api('get', `/orders/user/${a._id}`, b)).status).toBe(403);
    expect((await api('get', `/orders/user/${a._id}`, a)).status).toBe(200);
    expect((await api('get', `/orders/seller/${a._id}`, b)).status).toBe(403);
    expect((await api('get', `/orders/seller/${a._id}`, a)).status).toBe(200);
  });

  test('tracking: only the seller; then the buyer confirms the shipped order', async () => {
    const [buyer, seller] = await Promise.all([makeUser(), makeUser()]);
    const product = await makeProduct(seller);
    const order = await makeOrder(buyer, seller, 'paid', product._id);
    expect((await api('patch', `/orders/${order._id}/tracking`, buyer).send({ trackingId: 'T1' })).status).toBe(403);
    expect((await api('patch', `/orders/${order._id}/tracking`, seller).send({ trackingId: 'T1' })).status).toBe(200);
    expect((await Order.findById(order._id)).status).toBe('shipped');

    expect((await api('post', `/orders/${order._id}/confirm-receipt`, seller)).status).toBe(403);
    expect((await api('post', `/orders/${order._id}/confirm-receipt`, buyer)).status).toBe(200);
    const saved = await Order.findById(order._id);
    expect(saved.status).toBe('delivered');
    expect(saved.deliveryConfirmedByBuyer).toBe(true);
    expect((await api('post', `/orders/${order._id}/confirm-receipt`, buyer)).status).toBe(400);
  });

  test('cancelled orders cannot be confirmed', async () => {
    const [buyer, seller] = await Promise.all([makeUser(), makeUser()]);
    const order = await makeOrder(buyer, seller, 'cancelled');
    expect((await api('post', `/orders/${order._id}/confirm-receipt`, buyer)).status).toBe(400);
  });
});

describe('reviews', () => {
  test('confirm-delivery uses the logged-in buyer, not the body', async () => {
    const [buyer, seller, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    const order = await makeOrder(buyer, seller);
    expect((await api('post', `/reviews/orders/${order._id}/confirm-delivery`).send({ buyerId: String(buyer._id) })).status).toBe(401);
    const spoof = await api('post', `/reviews/orders/${order._id}/confirm-delivery`, stranger).send({ buyerId: String(buyer._id) });
    expect(spoof.status).toBe(403);
    expect((await api('post', `/reviews/orders/${order._id}/confirm-delivery`, buyer).send({})).status).toBe(200);
  });

  test('admin statistics are admin only', async () => {
    const user = await makeUser();
    expect((await api('get', '/reviews/admin/statistics', user)).status).toBe(403);
  });
});

describe('users and profile', () => {
  test('no secrets; others get public fields only', async () => {
    const me = await makeUser({ phoneNumber: '+994500000001', resetToken: 'reset-secret', refreshTokens: ['rt-secret'] });
    const other = await makeUser();
    for (const path of [`/profile/userdata/${me._id}`, `/users/get-users/${me._id}`]) {
      expect((await api('get', path)).status).toBe(401);
      const asOther = await api('get', path, other);
      expect(asOther.status).toBe(200);
      expect(asOther.body.data.username).toBe(me.username);
      expect(asOther.body.data.email).toBeUndefined();
      expect(asOther.body.data.phoneNumber).toBeUndefined();
      const asMe = await api('get', path, me);
      expect(asMe.body.data.email).toBe(me.email);
      expect(JSON.stringify(asMe.body)).not.toMatch(/reset-secret|rt-secret|"password"/);
    }
  });

  test('user list is admin only and has no secrets', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    expect((await api('get', '/users/get-users', user)).status).toBe(403);
    const res = await api('get', '/users/get-users', admin);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/"password"|refreshTokens/);
  });

  test("wallet and transactions: own only", async () => {
    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    expect((await api('get', `/users/${a._id}/wallet`, b)).status).toBe(403);
    expect((await api('get', `/users/${a._id}/transactions`, b)).status).toBe(403);
    expect((await api('get', `/users/${a._id}/wallet`, a)).status).toBe(200);
  });

  test("cannot change someone else's account", async () => {
    const [victim, attacker] = await Promise.all([makeUser(), makeUser()]);
    expect((await api('patch', `/profile/updatepassword/${victim._id}`, attacker).send({ password: 'y'.repeat(12) })).status).toBe(403);
    expect((await api('delete', `/profile/deleteuser/${victim._id}`, attacker)).status).toBe(403);
    expect((await api('patch', `/profile/nameupdate/${victim._id}/profileName`, attacker).send({ profileName: 'x' })).status).toBe(403);
    expect(await User.exists({ _id: victim._id })).toBeTruthy();
  });

  test('check-status returns only the flag', async () => {
    const u = await makeUser({ emailVerified: true });
    const res = await api('get', `/auth/check-status?email=${encodeURIComponent(u.email.toUpperCase())}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, emailVerified: true });
  });
});

describe('change password', () => {
  const bcrypt = require('bcrypt');
  test('own password only, current password required, signup rules', async () => {
    const me = await makeUser({ password: await bcrypt.hash('OldPass123', 10) });
    const send = (body, user = me) => api('patch', '/profile/change-password', user).send(body);

    expect((await api('patch', '/profile/change-password').send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' })).status).toBe(401);
    expect((await send({ newPassword: 'NewPass123' })).status).toBe(400);
    const wrong = await send({ currentPassword: 'nope', newPassword: 'NewPass123' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe('WRONG_PASSWORD');
    expect((await send({ currentPassword: 'OldPass123', newPassword: 'short' })).body.code).toBe('WEAK_PASSWORD');
    expect((await send({ currentPassword: 'OldPass123', newPassword: 'alllowercase1' })).body.code).toBe('WEAK_PASSWORD');
    expect((await send({ currentPassword: 'OldPass123', newPassword: 'OldPass123' })).body.code).toBe('SAME_PASSWORD');

    const ok = await send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' });
    expect(ok.status).toBe(200);
    expect(JSON.stringify(ok.body)).not.toMatch(/password"/i);
    const saved = await User.findById(me._id).select('+password');
    expect(await bcrypt.compare('NewPass123', saved.password)).toBe(true);
  });
});

describe('follow', () => {
  test('follower is the logged-in user; lists have no emails', async () => {
    const [a, b, c] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    expect((await api('post', `/follow/${b._id}/follow`).send({ followerId: String(a._id) })).status).toBe(401);
    // c claims to be a: the follow is recorded for c.
    expect((await api('post', `/follow/${b._id}/follow`, c).send({ followerId: String(a._id) })).status).toBe(200);
    const followers = await api('get', `/follow/${b._id}/followers`);
    expect(followers.body.followers.map((f) => String(f._id))).toEqual([String(c._id)]);
    expect(JSON.stringify(followers.body)).not.toMatch(/@example\.com/);
  });
});

describe('products', () => {
  test('only the owner or an admin can change an ad', async () => {
    const [owner, other] = await Promise.all([makeUser(), makeUser()]);
    const admin = await makeUser({ role: 'admin' });
    const product = await makeProduct(owner);
    expect((await api('patch', `/products/mark-sold/${product._id}`, other)).status).toBe(403);
    expect((await api('put', `/products/priority/${product._id}`, other)).status).toBe(403);
    expect((await api('delete', `/products/product/${product._id}`, other)).status).toBe(403);
    expect(await Product.exists({ _id: product._id })).toBeTruthy();
    expect((await api('put', `/products/priority/${product._id}`, admin)).status).toBe(200);
    expect((await api('patch', `/products/mark-sold/${product._id}`, owner)).status).toBe(200);
  });
});

describe('chat', () => {
  test('participants only; sender from the token; no emails', async () => {
    const [a, b, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    expect((await api('get', '/chat/users')).status).toBe(401);
    const users = await api('get', '/chat/users', a);
    expect(JSON.stringify(users.body)).not.toMatch(/@example\.com/);

    const conv = (await api('post', '/chat/conversations', a).send({ participants: [String(a._id), String(b._id)] })).body.conversation;
    expect((await api('get', `/chat/messages/${conv._id}`, stranger)).status).toBe(403);
    expect((await api('post', '/chat/messages', stranger).send({ conversationId: conv._id, senderId: String(a._id), text: 'x' })).status).toBe(403);
    const sent = await api('post', '/chat/messages', b).send({ conversationId: conv._id, senderId: String(a._id), text: 'hi' });
    expect(sent.status).toBe(200);
    expect(String(sent.body.message.senderId)).toBe(String(b._id));
  });
});

describe('admin only', () => {
  test.each([
    ['get', '/ads/admin/all'],
    ['get', '/logs/error'],
    ['get', '/logs/error/db'],
    ['get', '/redis/clear-cache'],
    ['post', '/notifications'],
  ])('%s %s', async (method, path) => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    expect((await api(method, path)).status).toBe(401);
    expect((await api(method, path, user)).status).toBe(403);
    expect((await api(method, path, admin)).status).not.toBe(403);
  });
});

describe('chatbot', () => {
  test("order lookup only finds the caller's own orders", async () => {
    const [buyer, seller, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    const order = await makeOrder(buyer, seller);
    expect((await api('post', '/chatbot/ask').send({ question: 'Track a specific order', orderId: String(order._id) })).status).toBe(401);
    const mine = await api('post', '/chatbot/ask', buyer).send({ question: 'Track a specific order', orderId: String(order._id) });
    expect(mine.body.answer).toMatch(/PAID/);
    const theirs = await api('post', '/chatbot/ask', stranger).send({ question: 'Track a specific order', orderId: String(order._id) });
    expect(theirs.body.answer).not.toMatch(/PAID|Baku/);
    const other = await api('post', '/chatbot/ask', stranger).send({ question: 'Wallet & Escrow help' });
    expect(other.body.success).toBe(true);
  });
});
