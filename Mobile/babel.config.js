module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
  ];

  // Strip ALL console.* calls from production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  // ⚠️ reanimated MUST be last!
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};