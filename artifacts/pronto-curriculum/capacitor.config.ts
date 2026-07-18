import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.prontocurriculum.app',
  appName: 'ProntoCurriculum',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
