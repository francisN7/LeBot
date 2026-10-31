const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite importar as migrações do Drizzle (`drizzle/*.sql`) no bundle.
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });
