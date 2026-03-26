const { validateEnvVariables, ValidationError } = require('../utils/validateEnv');

describe('validateEnvVariables', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  test('throws ValidationError when production is missing required vars', () => {
    process.env = { NODE_ENV: 'production' };
    expect(() => validateEnvVariables()).toThrow(ValidationError);
  });

  test('passes in development with reasonable defaults and required vars', () => {
    process.env = {
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost:27017/proddb',
      // JWT_SECRET: 'a'.repeat(32),
      REFRESH_TOKEN_SECRET: 'b'.repeat(32),
      FRONTEND_URL: 'http://localhost:5173',
      PAYMENTWALL_PROJECT_KEY: 'project_key',
      PAYMENTWALL_SECRET_KEY: 'c'.repeat(40),
      PAYMENT_MICROSERVICE_URL: 'http://payments.local'
    };

    expect(validateEnvVariables()).toBe(true);
  });
});
