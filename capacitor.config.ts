import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skcti.app',
  appName: 'SKCTI OS',
  webDir: 'public',
  server: {
    url: 'https://skcti-lyart.vercel.app/', 
    cleartext: true,
    allowNavigation: [
      "*.vercel.app",
      "*.firebaseapp.com",
      "*.googleapis.com",
      "*" 
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '142521151624-cuv2orimqc8jn9gtjcsl9ga5cindv4j8.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;