// Account / profile / follow / admin-only routes: act only on the logged-in user's own account.
const mockTwilioCheck = jest.fn().mockResolvedValue({ status: 'approved' });
const mockTwilioSend = jest.fn().mockResolvedValue({ status: 'pending' });
jest.mock('twilio', () => () => ({
  verify: { v2: { services: () => ({ verificationChecks: { create: mockTwilioCheck }, verifications: { create: mockTwilioSend } }) } },
}));
jest.mock('../utils/redisClient', () => ({ del: jest.fn().mockResolvedValue(1) }));
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');

let replSet;
let app;
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;

let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({ email: `a${n}@example.com`, username: `acct_user${n}`, password: 'x'.repeat(12), ...extra });
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await User.init();
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/', require('../Routes/Profileroutes'));
  app.use('/', require('../Routes/Twillioroutes'));
  app.use('/', require('../Routes/Followerroutes'));
  app.use('/redis', require('../Routes/redisRoutes'));
  app.use('/logs', require('../Routes/logRoutes'));
  app.use('/api/ads', require('../Routes/adRoutes'));
  app.use('/api/notifications', require('../Routes/notificationRoutes'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

describe('profile', () => {
  test('/userdata/:id: login required; others see public fields only; self sees no secrets', async () => {
    const me = await makeUser({ phoneNumber: '+994500000001', resetToken: 'reset-secret', refreshTokens: ['rt-secret'] });
    const other = await makeUser();
    expect((await request(app).get(`/userdata/${me._id}`)).status).toBe(401);

    const asOther = await request(app).get(`/userdata/${me._id}`).set('Authorization', tokenFor(other));
    expect(asOther.status).toBe(200);
    expect(asOther.body.data.username).toBe(me.username);
    const leaked = JSON.stringify(asOther.body);
    for (const s of ['@example.com', '+994500000001', 'reset-secret', 'rt-secret', 'walletBalance']) expect(leaked).not.toContain(s);

    const asSelf = await request(app).get(`/userdata/${me._id}`).set('Authorization', tokenFor(me));
    expect(asSelf.body.data.email).toBe(me.email);
    expect(JSON.stringify(asSelf.body)).not.toMatch(/reset-secret|rt-secret|password/);
  });

  test("cannot change another user's password, name or delete their account", async () => {
    const me = await makeUser();
    const victim = await makeUser();
    const auth = tokenFor(me);
    expect((await request(app).patch(`/updatepassword/${victim._id}`).set('Authorization', auth).send({ password: 'hacked123' })).status).toBe(403);
    expect((await request(app).patch(`/nameupdate/${victim._id}/profileName`).set('Authorization', auth).send({ profileName: 'x' })).status).toBe(403);
    expect((await request(app).delete(`/deleteuser/${victim._id}`).set('Authorization', auth)).status).toBe(403);
    expect(await User.exists({ _id: victim._id })).toBeTruthy();
    expect((await request(app).patch(`/updatepassword/${me._id}`).set('Authorization', auth).send({ password: 'newpass123' })).status).toBe(200);
  });

  test("phone verification updates only the logged-in user's account", async () => {
    const me = await makeUser();
    const victim = await makeUser();
    expect((await request(app).post('/verifyphoneupdate').send({ phoneNumber: '+994501111111', code: '1', userId: String(victim._id) })).status).toBe(401);
    const res = await request(app).post('/verifyphoneupdate').set('Authorization', tokenFor(me))
      .send({ phoneNumber: '+994501111111', code: '1', userId: String(victim._id) });
    expect(res.status).toBe(200);
    expect((await User.findById(victim._id)).phoneNumber).toBeFalsy();
    expect((await User.findById(me._id)).phoneNumber).toBe('+994501111111');
  });

  test('send-otp / verify-otp: login required; email is always the logged-in user', async () => {
    const me = await makeUser();
    const victim = await makeUser();
    expect((await request(app).post('/send-otp').send({ email: victim.email, phoneNumber: '+994502222222' })).status).toBe(401);
    const res = await request(app).post('/verify-otp').set('Authorization', tokenFor(me))
      .send({ email: victim.email, phoneNumber: '+994502222222', code: '1' });
    expect(res.status).toBe(200);
    expect((await User.findById(victim._id)).phoneNumber).toBeFalsy();
    expect((await User.findById(me._id)).phoneNumber).toBe('+994502222222');
  });

  test("email change: login required; can't target another user", async () => {
    const victim = await makeUser();
    const me = await makeUser();
    expect((await request(app).post('/emailverify').send({ userId: String(victim._id), password: 'x', newEmail: 'n@example.com' })).status).toBe(401);
    // Targets "victim" but acts as me (wrong password for me → 401, victim untouched).
    await request(app).post('/emailverify').set('Authorization', tokenFor(me)).send({ userId: String(victim._id), password: 'x', newEmail: 'n@example.com' });
    expect((await User.findById(victim._id)).email).toBe(victim.email);
  });
});

describe('follow', () => {
  test('follower is the logged-in user, not the body followerId', async () => {
    const me = await makeUser();
    const spoofed = await makeUser();
    const target = await makeUser();
    expect((await request(app).post(`/follow/${target._id}`).send({ followerId: String(spoofed._id) })).status).toBe(401);
    const res = await request(app).post(`/follow/${target._id}`).set('Authorization', tokenFor(me)).send({ followerId: String(spoofed._id) });
    expect(res.status).toBe(200);
    const t = await User.findById(target._id);
    expect(t.followers.map(String)).toEqual([String(me._id)]);
    expect((await User.findById(spoofed._id)).following).toHaveLength(0);

    const list = await request(app).get(`/${target._id}/followers`);
    expect(JSON.stringify(list.body)).not.toContain('@example.com');
  });
});

describe('admin-only routes', () => {
  test('banner ads, cache clear, error logs, notification create: users 403, admin allowed', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const cases = [
      ['get', '/api/ads/all'], ['delete', `/api/ads/${new mongoose.Types.ObjectId()}`], ['get', '/api/ads/admin/all'],
      ['get', '/redis/clear-cache'], ['get', '/logs/error/db'],
    ];
    for (const [m, p] of cases) {
      expect((await request(app)[m](p)).status).toBe(401);
      expect((await request(app)[m](p).set('Authorization', tokenFor(user))).status).toBe(403);
      expect((await request(app)[m](p).set('Authorization', tokenFor(admin))).status).not.toBe(403);
    }
    const notif = { recipientId: String(user._id), type: 'system', title: 'Verify your card at evil.example' };
    expect((await request(app).post('/api/notifications').set('Authorization', tokenFor(user)).send(notif)).status).toBe(403);
  });
});
