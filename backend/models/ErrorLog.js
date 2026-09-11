const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    // Error details
    message: { type: String, required: true },
    stack: { type: String },
    type: { type: String, default: 'uncaught' }, // 'boundary' | 'api' | 'uncaught' | 'unhandled_rejection'

    // Context
    module: { type: String }, // which part of the app (e.g. 'ErrorBoundary', 'API', 'Chat')
    extra: { type: mongoose.Schema.Types.Mixed }, // any extra data (component stack, endpoint, etc.)

    // Device / session info
    userId: { type: String },
    platform: { type: String },       // 'ios' | 'android' | 'web'
    appVersion: { type: String },
    osVersion: { type: String },
    device: { type: String },

    // Resolution status
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-expire resolved logs after 30 days
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
errorLogSchema.index({ resolved: 1, createdAt: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
