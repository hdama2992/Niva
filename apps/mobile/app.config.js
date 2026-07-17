const { existsSync } = require('node:fs');
const path = require('node:path');

const app = require('./app.json');

module.exports = () => {
  const config = app.expo;
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  const googleServiceInfoPath = path.join(
    __dirname,
    'GoogleService-Info.plist',
  );
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  return {
    ...config,
    android: {
      ...config.android,
      ...(existsSync(googleServicesPath)
        ? { googleServicesFile: './google-services.json' }
        : {}),
    },
    ios: {
      ...config.ios,
      ...(existsSync(googleServiceInfoPath)
        ? { googleServicesFile: './GoogleService-Info.plist' }
        : {}),
    },
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
    },
  };
};
