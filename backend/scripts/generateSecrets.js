const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Security Credential Generator
 * Run this script to generate secure credentials for your .env file
 * Usage: node scripts/generateSecrets.js
 */

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateApiKey() {
  return `sk_${crypto.randomBytes(32).toString('hex')}`;
}

console.log('\n🔐 SECURE CREDENTIAL GENERATOR FOR SETGO BACKEND\n');
console.log('=' .repeat(70));
console.log('\n⚠️  IMPORTANT: Replace these values in your .env file immediately!\n');
console.log('=' .repeat(70));

console.log('\n📝 JWT SECRETS (High Priority):');
console.log('-'.repeat(70));
// console.log(`JWT_SECRET=${generateSecret(64)}`);
console.log(`REFRESH_TOKEN_SECRET=${generateSecret(64)}`);

console.log('\n🔑 SESSION & COOKIE SECRETS:');
console.log('-'.repeat(70));
console.log(`SESSION_SECRET=${generateSecret(32)}`);
console.log(`COOKIE_SECRET=${generateSecret(32)}`);

console.log('\n💳 PAYMENT WEBHOOK SECRETS:');
console.log('-'.repeat(70));
console.log(`PAYMENT_WEBHOOK_SECRET=${generateSecret(32)}`);
console.log(`PAYMENTWALL_SECRET_KEY=${generateApiKey()}`);

console.log('\n🛡️  ENCRYPTION KEYS:');
console.log('-'.repeat(70));
console.log(`ENCRYPTION_KEY=${generateSecret(32)}`);
console.log(`API_KEY_SECRET=${generateApiKey()}`);

console.log('\n=' .repeat(70));
console.log('\n✅ NEXT STEPS:');
console.log('   1. Copy these values to your .env file');
console.log('   2. NEVER commit the .env file to version control');
console.log('   3. Rotate all existing exposed credentials immediately');
console.log('   4. Update .env.example with placeholder values only');
console.log('   5. Store production secrets in secure vault (AWS Secrets Manager, etc.)');
console.log('\n=' .repeat(70));
console.log('\n');

// Security note: do not record secrets in logs. Log that generation occurred.
logger.info('generateSecrets executed; secrets were printed to stdout for manual copy (not logged).');
