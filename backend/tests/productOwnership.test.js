// Product mutations: only the owner (or an admin) may change an ad; the owner of a new ad is the
// logged-in user; shop listings need a shop the poster owns.
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: { results: [{ types: ['postal_code'], address_components: [{ types: ['country'], short_name: 'AZ' }] }] },
  }),
}));
jest.mock('../utils/ioInstance', () => ({ setIO: jest.fn(), emitToUser: jest.fn() }));

const fs = require('fs');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-'.repeat(3);

const User = require('../models/user');
const Product = require('../models/product.model');
const Shop = require('../models/Shop');

let replSet;
let app;
const tokenFor = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET)}`;
// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const uploaded = [];

let n = 0;
const makeUser = (extra = {}) => {
  n += 1;
  return User.create({ email: `p${n}@example.com`, username: `prod_user${n}`, password: 'x'.repeat(12), ...extra });
};
const makeProduct = (owner, extra = {}) => Product.create({
  title: { en: 'Bike' }, category: { en: 'Sport' }, price: 10, description: { en: 'A bike' },
  condition: 'Used', postalCode: '1000', name: { en: 'Seller' }, termsAccepted: true, quantity: 1,
  owner: owner._id, ...extra,
});
const makeShop = (owner) => {
  n += 1;
  return Shop.create({ shopName: { en: `Shop ${n}` }, slug: `shop-${n}`, owner: owner._id });
};

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([User.init(), Product.init(), Shop.init()]);
  app = express();
  app.use(express.json());
  app.use(require('cookie-parser')());
  app.use('/api/products', require('../Routes/product.route'));
  app.use((err, req, res, _next) => res.status(err.statusCode || 500).json({ message: err.message }));
}, 120000);

afterAll(async () => {
  for (const p of uploaded) fs.unlink(path.join(__dirname, '..', p), () => {});
  await mongoose.disconnect();
  await replSet.stop();
});

describe('changing an ad', () => {
  test('delete: stranger 403, owner 200', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const p = await makeProduct(owner);
    expect((await request(app).delete(`/api/products/product/${p._id}`).set('Authorization', tokenFor(stranger))).status).toBe(403);
    expect(await Product.exists({ _id: p._id })).toBeTruthy();
    expect((await request(app).delete(`/api/products/product/${p._id}`).set('Authorization', tokenFor(owner))).status).toBe(200);
    expect(await Product.exists({ _id: p._id })).toBeFalsy();
  });

  test('update: stranger cannot change the price', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const p = await makeProduct(owner);
    const res = await request(app).put(`/api/products/product/${p._id}`).set('Authorization', tokenFor(stranger)).field('price', '1');
    expect(res.status).toBe(403);
    expect((await Product.findById(p._id)).price).toBe(10);
  });

  test("update: owner cannot move the ad into someone else's shop", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const p = await makeProduct(owner);
    const othersShop = await makeShop(other);
    const res = await request(app).put(`/api/products/product/${p._id}`).set('Authorization', tokenFor(owner)).field('shop', String(othersShop._id));
    expect(res.status).toBe(403);
    expect((await Product.findById(p._id)).shop).toBeFalsy();
  });

  test('mark sold: stranger 403, owner toggles', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const p = await makeProduct(owner);
    expect((await request(app).patch(`/api/products/mark-sold/${p._id}`).set('Authorization', tokenFor(stranger))).status).toBe(403);
    expect((await request(app).patch(`/api/products/mark-sold/${p._id}`).set('Authorization', tokenFor(owner))).status).toBe(200);
    expect((await Product.findById(p._id)).isSell).toBe(true);
  });

  test('boost: needs login; stranger 403; owner and admin allowed', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const p = await makeProduct(owner);
    expect((await request(app).put(`/api/products/priority/${p._id}`)).status).toBe(401);
    expect((await request(app).put(`/api/products/priority/${p._id}`).set('Authorization', tokenFor(stranger))).status).toBe(403);
    expect((await request(app).put(`/api/products/priority/${p._id}`).set('Authorization', tokenFor(owner))).status).toBe(200);
    expect((await Product.findById(p._id)).priority).toBe(true);
    expect((await request(app).put(`/api/products/priority/${p._id}`).set('Authorization', tokenFor(admin))).status).toBe(200);
    expect((await Product.findById(p._id)).priority).toBe(false);
  });

  test('category lookup treats the name literally (no regex injection)', async () => {
    const res = await request(app).get('/api/products/category/' + encodeURIComponent('(a+)+$'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('posting an ad', () => {
  const post = (user, fields) => {
    let req = request(app).post('/api/products/add').set('Authorization', tokenFor(user));
    for (const [k, v] of Object.entries({
      title: 'Lamp', category: 'Home', price: '5', description: 'A lamp', postalCode: '1000',
      name: 'Seller', termsAccepted: 'true', condition: 'Used', latitude: '40.4', longitude: '49.8', ...fields,
    })) req = req.field(k, v);
    return req.attach('pictures', PNG, { filename: 'p.png', contentType: 'image/png' });
  };

  test('owner is the logged-in user, not the "user" sent in the body', async () => {
    const me = await makeUser();
    const victim = await makeUser();
    const res = await post(me, { user: String(victim._id) });
    expect(res.status).toBe(201);
    const created = await Product.findById(res.body.data._id);
    uploaded.push(...created.pictures);
    expect(String(created.owner)).toBe(String(me._id));
  });

  test("cannot list in someone else's shop", async () => {
    const me = await makeUser();
    const other = await makeUser();
    const othersShop = await makeShop(other);
    const res = await post(me, { shop: String(othersShop._id), listingType: 'shop' });
    expect(res.status).toBe(403);
    expect(await Product.countDocuments({ shop: othersShop._id })).toBe(0);
  });
});
