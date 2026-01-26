// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add JSX to the default source extensions (don't replace, extend)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx'];

module.exports = config;
