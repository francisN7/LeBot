import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'LêBot',
  slug: 'lebot',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'lebot',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  android: {
    package: 'com.francis.lebot',
    adaptiveIcon: {
      backgroundColor: '#FFF6E8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'com.francis.lebot',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF6E8',
        dark: {
          backgroundColor: '#FFF6E8',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
