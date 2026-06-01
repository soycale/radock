/** @type {import('expo/config').ExpoConfig} */
export default {
  name: 'Radock',
  slug: 'radock',
  owner: 'soycale',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'radock',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.soycale.radock',
    // Local: file exists at ./GoogleService-Info.plist (gitignored)
    // EAS build: GOOGLE_SERVICE_INFO_PLIST env var is set to the secret file path
    googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#25F4EE',
    },
    package: 'com.soycale.radock',
    // Local: file exists at ./google-services.json (gitignored)
    // EAS build: GOOGLE_SERVICES_JSON env var is set to the secret file path
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
  web: { bundler: 'metro' },
  plugins: ['expo-router', 'expo-font', 'expo-secure-store', 'expo-notifications'],
  experiments: { typedRoutes: true },
  extra: {
    router: {},
    eas: { projectId: '0b7d7ce4-d0be-4f60-a59a-0b39d8e93651' },
  },
}
