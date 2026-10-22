const MODES = ['mock', 'test', 'live'];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set when AZERICARD_MODE is not "mock"`);
  return value;
}

const trimSlash = (s) => s.replace(/\/+$/, '');

// Read on every call (cheap) so tests and env changes take effect without reloading the module.
function getConfig() {
  const mode = process.env.AZERICARD_MODE || 'mock';
  if (!MODES.includes(mode)) throw new Error(`AZERICARD_MODE must be one of: ${MODES.join(', ')}`);
  if (mode === 'mock' && process.env.NODE_ENV === 'production') {
    throw new Error('AZERICARD_MODE=mock is not allowed in production');
  }

  const backend = trimSlash(process.env.SERVER_BACKEND || 'http://localhost:8080');
  const frontend = trimSlash(process.env.SERVER_FRONTEND || process.env.FRONTEND_URL || 'http://localhost:5173');
  const mock = mode === 'mock';

  return {
    enabled: process.env.AZERICARD_ENABLED === 'true',
    mode,
    gatewayUrl: mock ? `${backend}/api/payments/mock-azericard/pay` : required('AZERICARD_GATEWAY_URL'),
    // Only the mock answers status checks until we have Azericard's "Operation Status" spec.
    statusUrl: mock ? `${backend}/api/payments/mock-azericard/status` : null,
    terminal: mock ? process.env.AZERICARD_TERMINAL || '17200001' : required('AZERICARD_TERMINAL'),
    merchantName: process.env.AZERICARD_MERCH_NAME || 'SATGO',
    // Server-to-server result; configured on Azericard's side (the mock reads it from here).
    callbackUrl: `${backend}/api/payments/azericard/callback`,
    // BACKREF: documented as where the result is posted; in practice the test gateway delivers the
    // result only to the callback above. Kept so a signed result posted here is still applied.
    returnUrl: (orderId) => `${backend}/api/payments/azericard/return/${orderId}`,
    // Sent as MERCH_URL (signed): the bank's "Cancel" and "back to merchant" buttons go here.
    resultPageUrl: (orderId) => `${frontend}/payment/result/${orderId}`,
    frontendOrigin: new URL(frontend).origin,
    staleAfterMinutes: Number(process.env.AZERICARD_STALE_MINUTES || 20),
  };
}

module.exports = { getConfig };
