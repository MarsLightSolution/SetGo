#!/usr/bin/env node
// Dev/test data for checkout and wallet testing. Resets ONLY seed data (users with a
// seed.<name>@example.com email, their products, orders and transactions) to a known state.
// example.com is reserved for testing and accepts no mail, so order emails go nowhere.
//
//   node scripts/seed-dev.js
//
// Every seed user's password: Test@1234
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Product = require('../models/product.model');
const Order = require('../models/Order');
const Transaction = require('../models/transaction.model');

const PRODUCTION_CLUSTER_HOSTS = ['dwmup'];
const PRODUCTION_DB_NAMES = ['SetGo_prod'];
const seedEmail = (key) => `seed.${key}@example.com`;
const SEED_EMAIL_PATTERN = /^seed\.[a-z0-9]+@example\.com$/;
const PASSWORD = 'Test@1234';
const BAKU = [49.8671, 40.4093];

const USERS = [
  { key: 'seller1', username: 'seedseller1', profileName: 'Seed Seller One', walletBalance: 0 },
  { key: 'seller2', username: 'seedseller2', profileName: 'Seed Seller Two', walletBalance: 0 },
  { key: 'buyer1', username: 'seedbuyer1', profileName: 'Rich Buyer', walletBalance: 1000 },
  { key: 'buyer2', username: 'seedbuyer2', profileName: 'Partial Buyer', walletBalance: 30 },
  { key: 'buyer3', username: 'seedbuyer3', profileName: 'Empty Wallet Buyer', walletBalance: 0 },
  // Card (online) payment testing
  { key: 'cardseller', username: 'seedcardseller', profileName: 'Card Test Seller', walletBalance: 0 },
  { key: 'cardbuyer1', username: 'seedcardbuyer1', profileName: 'Card Buyer Approve', walletBalance: 0 },
  { key: 'cardbuyer2', username: 'seedcardbuyer2', profileName: 'Card Buyer Decline', walletBalance: 0 },
  { key: 'cardbuyer3', username: 'seedcardbuyer3', profileName: 'Card Buyer Mixed', walletBalance: 3 },
];

const tr = (en, az, ru) => ({ en, az, ru });
const PRODUCTS = [
  { owner: 'seller1', image: 'bike.jpg', price: 25, quantity: 1, condition: 'Used', category: 'Leisure, Hobby & Neighborhood',
    title: tr('City bike', 'Şəhər velosipedi', 'Городской велосипед'),
    description: tr('Seed product: cheap single item.', 'Test məhsulu: ucuz tək əşya.', 'Тестовый товар: недорогой, один экземпляр.') },
  { owner: 'seller1', image: 'washingMachine.png', price: 50, quantity: 1, condition: 'Like New', category: 'Household & Furniture',
    title: tr('Washing machine', 'Paltaryuyan maşın', 'Стиральная машина'),
    description: tr('Seed product: buyer2 (30 ₼) cannot pay this from wallet alone.', 'Test məhsulu.', 'Тестовый товар.') },
  { owner: 'seller1', image: 'camping.png', price: 80, quantity: 3, condition: 'New', category: 'Leisure, Hobby & Neighborhood',
    title: tr('Camping tent (3 in stock)', 'Çadır (3 ədəd)', 'Палатка (3 шт.)'),
    description: tr('Seed product: quantity 3, for repeat purchases.', 'Test məhsulu: 3 ədəd.', 'Тестовый товар: 3 шт.') },
  { owner: 'seller2', image: 'transportTrolley.png', price: 120, quantity: 1, condition: 'Used', category: 'Other',
    title: tr('Transport trolley', 'Yük arabası', 'Грузовая тележка'),
    description: tr('Seed product.', 'Test məhsulu.', 'Тестовый товар.') },
  { owner: 'seller2', image: 'horse.jpg', price: 300, quantity: 1, condition: 'New', category: 'Other',
    title: tr('Rocking horse', 'Yellənən at', 'Лошадка-качалка'),
    description: tr('Seed product: high price.', 'Test məhsulu: yüksək qiymət.', 'Тестовый товар: высокая цена.') },
  { owner: 'seller2', image: 'bike.jpg', price: 15, quantity: 1, condition: 'Defective / Needs Repair', category: 'Cars & Motorcycles',
    title: tr('Bike for parts', 'Ehtiyat hissələri üçün velosiped', 'Велосипед на запчасти'),
    description: tr('Seed product: cheapest item.', 'Test məhsulu.', 'Тестовый товар.') },
  // Card (online) payment testing: small amounts, plenty of stock for repeat runs
  ...[1, 2, 5, 10].map((price) => ({
    owner: 'cardseller', image: 'camping.png', price, quantity: 50, condition: 'New', category: 'Other',
    title: tr(`Card test ${price} AZN`, `Kart testi ${price} AZN`, `Тест карты ${price} AZN`),
    description: tr('Card payment test item (50 in stock).', 'Kartla ödəniş testi (50 ədəd).', 'Тест оплаты картой (50 шт.).'),
  })),
  { owner: 'cardseller', image: 'horse.jpg', price: 1, quantity: 1, condition: 'New', category: 'Other',
    title: tr('Card test last item 1 AZN', 'Kart testi son ədəd 1 AZN', 'Тест карты последний 1 AZN'),
    description: tr('Only 1 in stock: second purchase must say out of stock.', 'Yalnız 1 ədəd.', 'Только 1 шт.') },
];

function copySeedImages() {
  const from = path.join(__dirname, '..', '..', 'Frontend', 'public', 'images');
  const to = path.join(__dirname, '..', 'uploads', 'seed');
  fs.mkdirSync(to, { recursive: true });
  for (const img of new Set(PRODUCTS.map((p) => p.image))) {
    const src = path.join(from, img);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(to, img));
  }
}

(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed with NODE_ENV=production');

  await mongoose.connect(process.env.MONGO_DB);
  const host = mongoose.connection.host;
  if (PRODUCTION_CLUSTER_HOSTS.some((h) => host.includes(h)) || PRODUCTION_DB_NAMES.includes(mongoose.connection.name)) {
    throw new Error(`Refusing to seed a production database (${host} / ${mongoose.connection.name})`);
  }
  console.log(`Seeding ${host} / ${mongoose.connection.name}`);

  const existing = await User.find({ email: { $regex: SEED_EMAIL_PATTERN } }).select('_id');
  const oldIds = existing.map((u) => u._id);
  if (oldIds.length) {
    const r = await Promise.all([
      Order.deleteMany({ $or: [{ buyerId: { $in: oldIds } }, { sellerId: { $in: oldIds } }] }),
      Transaction.deleteMany({ $or: [{ senderId: { $in: oldIds } }, { receiverId: { $in: oldIds } }] }),
      Product.deleteMany({ owner: { $in: oldIds } }),
    ]);
    console.log(`Cleared previous seed data: ${r[0].deletedCount} orders, ${r[1].deletedCount} transactions, ${r[2].deletedCount} products`);
  }

  const hash = await bcrypt.hash(PASSWORD, 12);
  const users = {};
  for (const u of USERS) {
    const email = seedEmail(u.key);
    users[u.key] = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          username: u.username, profileName: u.profileName, password: hash, walletBalance: u.walletBalance,
          emailVerified: true, role: 'user', deliveryAddress: '1 Test Street, Baku', phoneNumber: '+994500000000',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  copySeedImages();
  const products = await Product.insertMany(PRODUCTS.map((p) => ({
    title: p.title,
    category: tr(p.category, p.category, p.category),
    description: p.description,
    name: tr(users[p.owner].profileName, users[p.owner].profileName, users[p.owner].profileName),
    price: p.price,
    quantity: p.quantity,
    condition: p.condition,
    pictures: [`uploads/seed/${p.image}`],
    location: { type: 'Point', coordinates: BAKU },
    postalCode: 'AZ1000',
    street: 'Test Street',
    termsAccepted: true,
    owner: users[p.owner]._id,
  })));

  if (!process.env.Admin_Id || !(await User.exists({ _id: process.env.Admin_Id }))) {
    console.warn('\nWARNING: Admin_Id is not set to an existing user; wallet + card checkouts will be refused.');
  }

  console.log('\nUsers (password for all: ' + PASSWORD + ')');
  console.table(USERS.map((u) => ({ email: seedEmail(u.key), wallet: `${u.walletBalance} ₼`, id: String(users[u.key]._id) })));
  console.log('Products');
  console.table(products.map((p) => ({ title: p.title.en, price: `${p.price} ₼`, qty: p.quantity, seller: p.name.en, id: String(p._id) })));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('SEED FAILED:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
