import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'LêBot',
  slug: 'lebot',
  version: '0.2.1',
  orientation: 'portrait',
  scheme: 'lebot',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  android: {
    package: 'com.francisN7.lebot',
    // Cada release sobe 1: o Android recusa `versionCode` menor que o instalado
    // e só enxerga atualização com número maior (0.2.0 = 1, 0.2.1 = 2).
    versionCode: 2,
    // O LêBot não grava áudio nem desenha sobre outros apps. As duas permissões
    // vinham de bibliotecas (image-picker/dev) e apareciam no APK da S12.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    // Dados pessoais vivem só no SQLite do aparelho: backup automático do
    // Android fica desligado de propósito (ADR 0026).
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#FFF6E8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'com.francisN7.lebot',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-image-picker',
      {
        photosPermission:
          'O LêBot usa suas fotos só para colocar a capa dos livros. Nada é enviado para a internet.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF6E8',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#FFF6E8',
          image: './assets/images/splash-icon.png',
        },
      },
    ],
    './plugins/with-release-signing',
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
