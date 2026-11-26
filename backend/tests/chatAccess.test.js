// Chat REST API and socket events: identity from the token, participants-only access.
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');
const Product = require('../models/product.model');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');
const initSocket = require('../controller/Socketcontroller');

let replSet;
let app;
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;

let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({ email: `c${n}@example.com`, username: `chat_user${n}`, password: 'x'.repeat(12), ...extra });
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Conversation.init(), Message.init(), Product.init()]);
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/chat', require('../Routes/chat'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

async function conversationBetween(a, b) {
  const res = await request(app).post('/api/chat/conversations').set('Authorization', tokenFor(a))
    .send({ participants: [String(a._id), String(b._id)] });
  expect(res.status).toBe(200);
  return res.body.conversation;
}

describe('chat REST', () => {
  test('every route requires login', async () => {
    for (const [method, path] of [['get', '/api/chat/users'], ['get', '/api/chat/messages/x'], ['post', '/api/chat/messages'], ['post', '/api/chat/connect']]) {
      expect((await request(app)[method](path)).status).toBe(401);
    }
  });

  test('user list never includes emails', async () => {
    const a = await makeUser();
    await makeUser();
    const res = await request(app).get('/api/chat/users').set('Authorization', tokenFor(a));
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toMatch(/@example\.com/);
  });

  test('only participants can read or post; sender comes from the token', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const stranger = await makeUser();
    const conv = await conversationBetween(a, b);

    // Stranger: cannot read, cannot post, cannot spoof a sender.
    expect((await request(app).get(`/api/chat/messages/${conv._id}`).set('Authorization', tokenFor(stranger))).status).toBe(403);
    const spoof = await request(app).post('/api/chat/messages').set('Authorization', tokenFor(stranger))
      .send({ conversationId: conv._id, senderId: String(a._id), text: 'pay me here' });
    expect(spoof.status).toBe(403);
    expect(await Message.countDocuments({ conversationId: conv._id })).toBe(0);

    // Participant b sends while claiming to be a: stored as b.
    const sent = await request(app).post('/api/chat/messages').set('Authorization', tokenFor(b))
      .send({ conversationId: conv._id, senderId: String(a._id), text: 'hello' });
    expect(sent.status).toBe(200);
    expect(String(sent.body.message.senderId)).toBe(String(b._id));

    const read = await request(app).get(`/api/chat/messages/${conv._id}`).set('Authorization', tokenFor(a));
    expect(read.status).toBe(200);
    expect(read.body.messages).toHaveLength(1);
  });

  test("conversations list: own only; a stranger cannot list someone else's", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const stranger = await makeUser();
    await conversationBetween(a, b);
    expect((await request(app).get(`/api/chat/conversations/${a._id}`).set('Authorization', tokenFor(stranger))).status).toBe(403);
    const own = await request(app).get(`/api/chat/conversations/${a._id}`).set('Authorization', tokenFor(a));
    expect(own.status).toBe(200);
    expect(own.body.conversations).toHaveLength(1);
  });

  test('get-or-create uses the logged-in user as sender', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const c = await makeUser();
    // c asks for a conversation "between a and b": gets c<->b instead.
    const res = await request(app).post('/api/chat/conversation/get-or-create').set('Authorization', tokenFor(c))
      .send({ senderId: String(a._id), receiverId: String(b._id) });
    expect(res.status).toBe(200);
    const ids = res.body.conversation.participants.map((p) => String(p.userId)).sort();
    expect(ids).toEqual([String(b._id), String(c._id)].sort());
  });
});

// ── Socket handlers, driven through a minimal fake io/socket ──────────────────
function fakeIo() {
  const emitted = [];
  const io = {
    handlers: {},
    on(evt, fn) { this.handlers[evt] = fn; },
    to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }),
    emit: (event, payload) => emitted.push({ room: '*', event, payload }),
  };
  initSocket(io);
  const connect = (userId) => {
    const socket = {
      id: `s_${Math.random()}`, userId, rooms: new Set(), handlers: {},
      join(room) { this.rooms.add(room); },
      on(evt, fn) { this.handlers[evt] = fn; },
      to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }),
      disconnect: jest.fn(),
    };
    io.handlers.connection(socket);
    return socket;
  };
  return { emitted, connect };
}
const flush = () => new Promise((r) => setTimeout(r, 50));

describe('socket events', () => {
  test('join-user always joins only the own room; joinConversation is participants-only', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const stranger = await makeUser();
    const conv = await conversationBetween(a, b);
    const { connect } = fakeIo();

    const s = connect(String(stranger._id));
    s.handlers['join-user'](String(a._id));
    expect(s.rooms.has(`user_${a._id}`)).toBe(false);
    expect(s.rooms.has(`user_${stranger._id}`)).toBe(true);

    s.handlers.joinConversation(String(conv._id));
    await flush();
    expect(s.rooms.has(String(conv._id))).toBe(false);

    const sa = connect(String(a._id));
    sa.handlers.joinConversation(String(conv._id));
    await flush();
    expect(sa.rooms.has(String(conv._id))).toBe(true);
  });

  test('sendMessage: non-participants are dropped; senderId is the real user; recipient notified', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const stranger = await makeUser();
    const conv = await conversationBetween(a, b);
    const { emitted, connect } = fakeIo();

    connect(String(stranger._id)).handlers.sendMessage({ conversationId: String(conv._id), senderId: String(a._id), text: 'x' });
    await flush();
    expect(emitted.filter((e) => e.event === 'newMessage')).toHaveLength(0);

    connect(String(a._id)).handlers.sendMessage({ conversationId: String(conv._id), senderId: String(b._id), text: 'hi', senderName: 'A' });
    await flush();
    const relayed = emitted.find((e) => e.event === 'newMessage');
    expect(relayed.payload.senderId).toBe(String(a._id));
    expect(emitted.find((e) => e.event === 'new-message').room).toBe(`user_${b._id}`);
  });

  test('send-notification: only "like", only to the real product owner, text rebuilt server-side', async () => {
    const owner = await makeUser();
    const liker = await makeUser({ username: 'liker_name' });
    const victim = await makeUser();
    const product = await Product.create({
      title: { en: 'Bike' }, category: { en: 'Sport' }, price: 10, description: { en: 'A bike' },
      condition: 'Used', postalCode: 'AZ1000', name: { en: 'Seller' }, termsAccepted: true, quantity: 1, owner: owner._id,
    });
    const { emitted, connect } = fakeIo();
    const s = connect(String(liker._id));

    s.handlers['send-notification']({ recipientId: String(victim._id), type: 'system', title: 'SATGO: verify your card at evil.example' });
    s.handlers['send-notification']({ recipientId: String(victim._id), type: 'like', title: 'fake', metadata: { productId: String(product._id) } });
    await flush();

    const sent = emitted.filter((e) => e.event === 'notification');
    expect(sent).toHaveLength(1);
    expect(sent[0].room).toBe(`user_${owner._id}`);
    expect(sent[0].payload.title).toBe('liker_name liked your item');
    expect(JSON.stringify(sent)).not.toContain('evil.example');
  });
});
