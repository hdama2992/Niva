const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const DEFAULT_NOTIFICATION_COLOR =
  'com.google.firebase.messaging.default_notification_color';

module.exports = function withFirebaseMessagingManifest(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';

    const application =
      AndroidConfig.Manifest.getMainApplicationOrThrow(
        androidConfig.modResults,
      );
    const notificationColor = application['meta-data']?.find(
      (entry) => entry.$?.['android:name'] === DEFAULT_NOTIFICATION_COLOR,
    );

    if (notificationColor) {
      notificationColor.$['tools:replace'] = 'android:resource';
    }

    return androidConfig;
  });
};
