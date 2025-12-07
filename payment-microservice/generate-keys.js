const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
  console.log('✓ Created keys directory');
}

// Generate RSA key pair
console.log('Generating RSA key pair (2048-bit)...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Write keys to files
fs.writeFile(path.join(keysDir, 'private.pem'), privateKey, (err) => {
  if (err) {
    console.error('Failed to write private.pem:', err);
    process.exit(1);
  }
  fs.writeFile(path.join(keysDir, 'public.pem'), publicKey, (err) => {
    if (err) {
      console.error('Failed to write public.pem:', err);
      process.exit(1);
    }
    console.log('✓ RSA keys generated successfully!');
    console.log('  - private.pem (keep this secret!)');
    console.log('  - public.pem');
    console.log('\n⚠️  Remember to add keys/ to .gitignore!');
  });
});