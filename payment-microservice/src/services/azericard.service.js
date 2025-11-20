const axios = require('axios');
const querystring = require('querystring');
const config = require('../config');
const cryptoService = require('./crypto.service');
const logger = require('../utils/logger');

class AzericardService {
  constructor() {
    this.gatewayUrl = config.azericard.gatewayUrl;
    this.terminalId = config.azericard.terminalId;
    this.merchantName = config.azericard.merchantName;
    this.merchantUrl = config.azericard.merchantUrl;
  }

  /**
   * Prepare MAC source string according to Azericard specifications
   * Order matters! Follow Azericard documentation field order
   */
  prepareMACString(params) {
    const fields = [
      params.AMOUNT || '',
      params.CURRENCY || '',
      params.ORDER || '',
      params.DESC || '',
      params.MERCH_NAME || '',
      params.MERCH_URL || '',
      params.TERMINAL || '',
      params.EMAIL || '',
      params.TRTYPE || '',
      params.COUNTRY || '',
      params.MERCH_GMT || '',
      params.TIMESTAMP || '',
      params.NONCE || '',
      params.BACKREF || '',
    ];

    return fields.join('');
  }

  /**
   * Create payment (Authorization - TRTYPE=1)
   */
  async createPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'AZN',
        orderId,
        description,
        email,
        backUrl,
        metadata = {},
      } = paymentData;

      // Convert amount to smallest currency unit (kopikas for AZN)
      const amountInKopikas = Math.round(amount * 100);

      const timestamp = new Date().toISOString();
      const nonce = crypto.randomBytes(16).toString('hex');

      const params = {
        AMOUNT: amountInKopikas.toString(),
        CURRENCY: currency,
        ORDER: orderId,
        DESC: description,
        MERCH_NAME: this.merchantName,
        MERCH_URL: this.merchantUrl,
        TERMINAL: this.terminalId,
        EMAIL: email,
        TRTYPE: '1', // Authorization
        COUNTRY: 'AZ',
        MERCH_GMT: '+04',
        TIMESTAMP: timestamp,
        NONCE: nonce,
        BACKREF: backUrl,
      };

      // Generate MAC
      const macString = this.prepareMACString(params);
      params.P_SIGN = cryptoService.generateMAC(macString);

      logger.info('Creating Azericard payment', { orderId, amount });

      // Send POST request to Azericard
      const response = await axios.post(
        this.gatewayUrl,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        redirectUrl: response.data.redirectUrl || response.request.res.responseUrl,
        transactionId: response.data.transactionId,
        orderId,
      };
    } catch (error) {
      logger.error('Azericard payment creation error:', error);
      throw new Error('Payment gateway error: ' + error.message);
    }
  }

  /**
   * Create preauthorization (TRTYPE=0)
   */
  async createPreauthorization(paymentData) {
    const params = { ...paymentData, TRTYPE: '0' };
    return this.createPayment(params);
  }

  /**
   * Confirm preauthorization (TRTYPE=21)
   */
  async confirmPreauthorization(transactionData) {
    try {
      const { orderId, amount } = transactionData;
      
      const params = {
        AMOUNT: Math.round(amount * 100).toString(),
        ORDER: orderId,
        TERMINAL: this.terminalId,
        TRTYPE: '21',
        TIMESTAMP: new Date().toISOString(),
      };

      const macString = this.prepareMACString(params);
      params.P_SIGN = cryptoService.generateMAC(macString);

      const response = await axios.post(
        this.gatewayUrl,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('Azericard confirmation error:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refundPayment(refundData) {
    try {
      const { orderId, amount, reason } = refundData;

      const params = {
        AMOUNT: Math.round(amount * 100).toString(),
        ORDER: orderId,
        TERMINAL: this.terminalId,
        TRTYPE: '24', // Refund type
        DESC: reason,
        TIMESTAMP: new Date().toISOString(),
      };

      const macString = this.prepareMACString(params);
      params.P_SIGN = cryptoService.generateMAC(macString);

      const response = await axios.post(
        this.gatewayUrl,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        refundId: response.data.refundId,
        data: response.data,
      };
    } catch (error) {
      logger.error('Azericard refund error:', error);
      throw error;
    }
  }

  /**
   * Verify callback/webhook from Azericard
   */
  verifyCallback(callbackData) {
    try {
      const { P_SIGN, ...dataFields } = callbackData;
      
      // Reconstruct MAC string from response
      const macString = this.prepareMACString(dataFields);
      
      // Verify signature
      const isValid = cryptoService.verifyMAC(macString, P_SIGN);
      
      if (!isValid) {
        logger.warn('Invalid MAC signature in callback', { callbackData });
        return { valid: false };
      }

      return {
        valid: true,
        status: callbackData.ACTION,
        orderId: callbackData.ORDER,
        amount: parseInt(callbackData.AMOUNT) / 100,
        transactionId: callbackData.RRN,
        responseCode: callbackData.RC,
        responseMessage: callbackData.RCTEXT,
      };
    } catch (error) {
      logger.error('Callback verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(orderId) {
    try {
      const params = {
        ORDER: orderId,
        TERMINAL: this.terminalId,
        TRTYPE: '90', // Status inquiry
        TIMESTAMP: new Date().toISOString(),
      };

      const macString = this.prepareMACString(params);
      params.P_SIGN = cryptoService.generateMAC(macString);

      const response = await axios.post(
        this.gatewayUrl,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        status: response.data.ACTION,
        data: response.data,
      };
    } catch (error) {
      logger.error('Status inquiry error:', error);
      throw error;
    }
  }
}

module.exports = new AzericardService();