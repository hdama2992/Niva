const { existsSync } = require('node:fs');
const path = require('node:path');

const app = require('./app.json');

module.exports = () => {
  const config = app.expo;
  const localGoogleServicesPath = path.join(__dirname, 'google-services.json');
  const localGoogleServiceInfoPath = path.join(
    __dirname,
    'GoogleService-Info.plist',
  );
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (existsSync(localGoogleServicesPath) ? './google-services.json' : undefined);
  const googleServiceInfoFile =
    process.env.GOOGLE_SERVICE_INFO_PLIST ??
    (existsSync(localGoogleServiceInfoPath)
      ? './GoogleService-Info.plist'
      : undefined);
  const easProjectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    '2f2d3081-f1e0-4893-aebd-615bed1bd316';

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    ios: {
      ...config.ios,
      ...(googleServiceInfoFile
        ? { googleServicesFile: googleServiceInfoFile }
        : {}),
    },
    plugins: [
      ...config.plugins,
      '@react-native-firebase/app',
      ...(googleServiceInfoFile ? ['@react-native-firebase/auth'] : []),
    ],
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId: easProjectId,
      },
    },
  };
};
