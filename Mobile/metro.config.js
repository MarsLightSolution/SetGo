// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure JSX files are properly resolved
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'wasm', 'svg'];

module.exports = config;
