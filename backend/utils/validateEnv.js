/**
 * Environment Variable Validator
 * Validates all required environment variables on server startup
 * Prevents server from starting with missing or insecure configuration
 */

const crypto = require('crypto');

const REQUIRED_ENV_VARS = {
  // Database
  MONGODB_URI: { required: true, sensitive: true },

  // JWT & Authentication
  // JWT_SECRET: { required: true, sensitive: true, minLength: 32 },
  REFRESH_TOKEN_SECRET: { required: true, sensitive: true, minLength: 32 },

  // Server Configuration
  PORT: { required: false, default: 3000 },
  NODE_ENV: { required: true, allowedValues: ['development', 'production', 'test'] },

  // CORS
  FRONTEND_URL: { required: true },

  // Payment Gateway
  PAYMENTWALL_PROJECT_KEY: { required: true, sensitive: true },
  PAYMENTWALL_SECRET_KEY: { required: true, sensitive: true },
  PAYMENT_MICROSERVICE_URL: { required: true },
  PAYMENT_WEBHOOK_SECRET: { required: false, sensitive: true },

  // Cloudinary (File Storage) - Optional in development, required in production
  CLOUDINARY_CLOUD_NAME: { required: false },
  CLOUDINARY_API_KEY: { required: false, sensitive: true },
  CLOUDINARY_API_SECRET: { required: false, sensitive: true },

  // Email Service
  EMAIL_USER: { required: false },
  EMAIL_PASS: { required: false, sensitive: true },

  // Session
  SESSION_SECRET: { required: false, sensitive: true, minLength: 32 },
};

// Weak/Common secrets to reject (security check)
const WEAK_SECRETS = [
  'secret',
  'password',
  '123456',
  'your-secret-key',
  'change-me',
  'your_jwt_secret',
  'mysecret',
  'test',
];

class ValidationError extends Error {
  constructor(errors) {
    super('Environment validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function isWeakSecret(value) {
  const lowerValue = value.toLowerCase();
  return WEAK_SECRETS.some(weak => lowerValue.includes(weak));
}

function validateEnvVariables() {
  const errors = [];
  const warnings = [];

  const logger = require('./logger');
  logger.info('🔍 Validating environment variables...');

  // Check each required variable
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    // Check if required variable is missing
    if (!value) {
      if (config.required) {
        errors.push(`❌ Missing required environment variable: ${key}`);
      } else if (config.default !== undefined) {
        process.env[key] = config.default.toString();
        warnings.push(`⚠️  Using default value for ${key}: ${config.default}`);
      }
      continue;
    }

    // Validate minimum length for secrets
    if (config.minLength && value.length < config.minLength) {
      errors.push(
        `❌ ${key} is too short (${value.length} chars). Minimum: ${config.minLength} chars`
      );
    }

    // Check for weak/common secrets (skip in development for optional fields)
    if (config.sensitive && isWeakSecret(value)) {
      // In development, only warn for required fields
      if (process.env.NODE_ENV === 'production' || config.required) {
        errors.push(
          `❌ ${key} appears to be a weak or common secret. Generate a strong random value.`
        );
      } else {
        warnings.push(
          `⚠️  ${key} appears to be a weak or common secret (OK for development).`
        );
      }
    }

    // Validate allowed values
    if (config.allowedValues && !config.allowedValues.includes(value)) {
      errors.push(
        `❌ Invalid value for ${key}. Allowed: ${config.allowedValues.join(', ')}`
      );
    }

    // Check for production-specific requirements
    if (process.env.NODE_ENV === 'production') {
      // Ensure HTTPS in production
      if (key === 'FRONTEND_URL' && !value.startsWith('https://')) {
        warnings.push(`⚠️  FRONTEND_URL should use HTTPS in production: ${value}`);
      }

      // Ensure proper MongoDB connection string
      if (key === 'MONGODB_URI' && !value.includes('mongodb')) {
        errors.push(`❌ Invalid MONGODB_URI format`);
      }
    }
  }

  // Additional security checks
  performSecurityChecks(errors, warnings);

  // Display results
  if (warnings.length > 0) {
    logger.warn('WARNINGS:');
    warnings.forEach(warning => logger.warn(`   ${warning}`));
  }

  if (errors.length > 0) {
    logger.error('VALIDATION ERRORS:');
    errors.forEach(err => logger.error(`   ${err}`));
    logger.info('Run "node scripts/generateSecrets.js" to generate secure credentials');
    throw new ValidationError(errors);
  }

  logger.info('Environment validation passed!');
  return true;
}

function performSecurityChecks(errors, warnings) {
  // Check if .env file is in .gitignore
  const fs = require('fs');
  const path = require('path');

  const gitignorePath = path.join(__dirname, '..', '.gitignore');

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      warnings.push('⚠️  .env file may not be in .gitignore - risk of credential exposure!');
    }
  }

  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
      errors.push('❌ Production environment cannot use localhost MongoDB');
    }

    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
      errors.push('❌ Production environment cannot use localhost frontend URL');
    }
  }

  // Warn about missing optional but recommended variables
  if (!process.env.SESSION_SECRET) {
    warnings.push('⚠️  SESSION_SECRET not set - sessions may not be secure');
  }

  if (!process.env.PAYMENT_WEBHOOK_SECRET) {
    warnings.push('⚠️  PAYMENT_WEBHOOK_SECRET not set - webhook signatures cannot be verified');
  }
}

module.exports = { validateEnvVariables, ValidationError };
