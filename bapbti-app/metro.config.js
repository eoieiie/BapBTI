// Sentry는 v1에 없다. 붙일 때 gwc-app/metro.config.js 처럼 getSentryExpoConfig로 교체.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
