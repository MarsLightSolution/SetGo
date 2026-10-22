const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');
const logger = require('../../utils/logger');

const BACKEND_DIR = path.join(__dirname, '..', '..');
const cache = {};

function readPem(envPem, envPath) {
  if (process.env[envPem]) return process.env[envPem].replace(/\\n/g, '\n');
  if (process.env[envPath]) return fs.readFileSync(path.resolve(BACKEND_DIR, process.env[envPath]), 'utf8');
  return null;
}

function ephemeralPair(label) {
  if (!cache[label]) {
    cache[label] = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    logger.warn(`[Azericard] Using an in-memory ${label} key pair (mock mode only)`);
  }
  return cache[label];
}

// Our key pair: we sign requests; Azericard verifies with the public key we sent them.
function ownPrivateKey() {
  const pem = readPem('AZERICARD_PRIVATE_KEY', 'AZERICARD_PRIVATE_KEY_PATH');
  if (pem) return crypto.createPrivateKey(pem);
  if (getConfig().mode === 'mock') return ephemeralPair('merchant').privateKey;
  throw new Error('AZERICARD_PRIVATE_KEY or AZERICARD_PRIVATE_KEY_PATH must be set');
}

function ownPublicKey() {
  return crypto.createPublicKey(ownPrivateKey());
}

// The mock bank's own key pair, standing in for Azericard's.
function mockBankKeyPair() {
  return ephemeralPair('mock-bank');
}

// Azericard's public key, used to verify callbacks (UNVERIFIED: plan §4 — confirm callbacks are
// signed by Azericard with their own key, and get that key from them).
function bankPublicKey() {
  if (getConfig().mode === 'mock') return mockBankKeyPair().publicKey;
  const pem = readPem('AZERICARD_BANK_PUBLIC_KEY', 'AZERICARD_BANK_PUBLIC_KEY_PATH');
  if (!pem) throw new Error('AZERICARD_BANK_PUBLIC_KEY or AZERICARD_BANK_PUBLIC_KEY_PATH must be set');
  return crypto.createPublicKey(pem);
}

module.exports = { ownPrivateKey, ownPublicKey, bankPublicKey, mockBankKeyPair };
