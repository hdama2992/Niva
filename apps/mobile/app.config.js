const { existsSync } = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const localGoogleServicesPath = path.join(__dirname, 'google-services.json');
  const localGoogleServiceInfoPath = path.join(
    __dirname,
    'GoogleService-Info.plist',
  );
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (existsSync(localGoogleServicesPath)
      ? './google-services.json'
      : undefined);
  const googleServiceInfoFile =
    process.env.GOOGLE_SERVICE_INFO_PLIST ??
    (existsSync(localGoogleServiceInfoPath)
      ? './GoogleService-Info.plist'
      : undefined);
  const easProjectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    '2f2d3081-f1e0-4893-aebd-615bed1bd316';
  const requiredProductionVariables = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_AUTH_MODE',
    'EXPO_PUBLIC_PRIVACY_POLICY_URL',
    'EXPO_PUBLIC_SUPPORT_URL',
    'EXPO_PUBLIC_TERMS_URL',
    'GOOGLE_SERVICES_JSON',
  ];

  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const missingVariables = requiredProductionVariables.filter(
      (name) => !process.env[name],
    );
    if (missingVariables.length) {
      throw new Error(
        `Production build is missing required EAS variables: ${missingVariables.join(', ')}`,
      );
    }

    if (process.env.EXPO_PUBLIC_AUTH_MODE !== 'firebase') {
      throw new Error(
        'Production builds must set EXPO_PUBLIC_AUTH_MODE=firebase.',
      );
    }

    for (const name of ['EXPO_PUBLIC_API_URL']) {
      if (!process.env[name]?.startsWith('https://')) {
        throw new Error(`${name} must use HTTPS in production builds.`);
      }
    }
  }

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
      './plugins/withFirebaseMessagingManifest',
      ...config.plugins,
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
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
