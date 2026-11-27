// v2 socket events act only as the handshake-verified user.
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../models/user');
const Product = require('../models/product.model');
const Conversation = require('../models/Conversation');
const initSocketV2 = require('../controller/v2/socket');

let replSet;
let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({ email: `s${n}@example.com`, username: `sock_user${n}`, password: 'x'.repeat(12), ...extra });
};
const conversationBetween = (a, b) => Conversation.create({
  participants: [{ userId: String(a._id), userName: 'a' }, { userId: String(b._id), userName: 'b' }],
});

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Conversation.init(), Product.init()]);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

function fakeIo() {
  const emitted = [];
  const io = {
    handlers: {},
    on(evt, fn) { this.handlers[evt] = fn; },
    to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }),
    emit: (event, payload) => emitted.push({ room: '*', event, payload }),
  };
  initSocketV2(io);
  const connect = (userId) => {
    const socket = {
      id: `s_${Math.random()}`, userId, rooms: new Set(), handlers: {},
      join(room) { this.rooms.add(room); },
      on(evt, fn) { this.handlers[evt] = fn; },
      to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }),
    };
    io.handlers.connection(socket);
    return socket;
  };
  return { emitted, connect };
}
const flush = () => new Promise((r) => setTimeout(r, 50));

test('v2:join-user joins only the own room; v2:joinConversation is participants-only', async () => {
  const [a, b, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
  const conv = await conversationBetween(a, b);
  const { connect } = fakeIo();

  const s = connect(String(stranger._id));
  s.handlers['v2:join-user'](String(a._id));
  expect(s.rooms.has(`user_${a._id}`)).toBe(false);
  expect(s.rooms.has(`user_${stranger._id}`)).toBe(true);
  s.handlers['v2:joinConversation'](String(conv._id));
  await flush();
  expect(s.rooms.has(String(conv._id))).toBe(false);

  const sa = connect(String(a._id));
  sa.handlers['v2:joinConversation'](String(conv._id));
  await flush();
  expect(sa.rooms.has(String(conv._id))).toBe(true);
});

test('v2:sendMessage: non-participants dropped; real senderId; recipient notified', async () => {
  const [a, b, stranger] = await Promise.all([makeUser(), makeUser(), makeUser()]);
  const conv = await conversationBetween(a, b);
  const { emitted, connect } = fakeIo();

  connect(String(stranger._id)).handlers['v2:sendMessage']({ conversationId: String(conv._id), senderId: String(a._id), text: 'x' });
  await flush();
  expect(emitted.filter((e) => e.event === 'newMessage')).toHaveLength(0);

  connect(String(a._id)).handlers['v2:sendMessage']({ conversationId: String(conv._id), senderId: String(b._id), text: 'hi' });
  await flush();
  expect(emitted.find((e) => e.event === 'newMessage').payload.senderId).toBe(String(a._id));
  expect(emitted.find((e) => e.event === 'new-message').room).toBe(`user_${b._id}`);
});

test('v2:send-notification: only "like", to the real owner, text rebuilt', async () => {
  const owner = await makeUser();
  const liker = await makeUser({ username: 'liker_v2' });
  const victim = await makeUser();
  const product = await Product.create({
    title: { en: 'Bike' }, category: { en: 'Sport' }, price: 10, description: { en: 'A bike' },
    condition: 'Used', postalCode: 'AZ1000', name: { en: 'Seller' }, termsAccepted: true, quantity: 1, owner: owner._id,
  });
  const { emitted, connect } = fakeIo();
  const s = connect(String(liker._id));
  s.handlers['v2:send-notification']({ recipientId: String(victim._id), type: 'system', title: 'verify at evil.example' });
  s.handlers['v2:send-notification']({ recipientId: String(victim._id), type: 'like', title: 'fake', metadata: { productId: String(product._id) } });
  await flush();
  const sent = emitted.filter((e) => e.event === 'notification');
  expect(sent).toHaveLength(1);
  expect(sent[0].room).toBe(`user_${owner._id}`);
  expect(sent[0].payload.title).toBe('liker_v2 liked your item');
});
