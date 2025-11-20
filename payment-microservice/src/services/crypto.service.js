const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

class CryptoService {
  constructor() {
    this.privateKey = fs.readFileSync(config.azericard.privateKeyPath, 'utf8');
    this.publicKey = fs.readFileSync(config.azericard.publicKeyPath, 'utf8');
  }

  /**
   * Generate MAC (Message Authentication Code) using RSA with SHA256
   * This is required by Azericard for request signing
   */
  generateMAC(dataString) {
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(dataString);
      sign.end();
      
      const signature = sign.sign(this.privateKey, 'hex');
      return signature.toUpperCase();
    } catch (error) {
      logger.error('MAC generation error:', error);
      throw new Error('Failed to generate MAC');
    }
  }

  /**
   * Verify MAC signature from Azericard response
   */
  verifyMAC(dataString, signature) {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(dataString);
      verify.end();
      
      return verify.verify(this.publicKey, signature, 'hex');
    } catch (error) {
      logger.error('MAC verification error:', error);
      return false;
    }
  }

  /**
   * Generate random order ID
   */
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD${timestamp}${random}`;
  }

  /**
   * Hash sensitive data for storage
   */
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = new CryptoService();