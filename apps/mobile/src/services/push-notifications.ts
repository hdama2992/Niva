import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken } from './community';

let handlerConfigured = false;

export function subscribeToPushNotificationResponses(onOpen: () => void) {
  if (Platform.OS === 'web') {
    return () => undefined;
  }

  const openNotification = () => {
    onOpen();
  };
  const subscription =
    Notifications.addNotificationResponseReceivedListener(openNotification);

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) {
      return;
    }

    openNotification();
    void Notifications.clearLastNotificationResponseAsync();
  });

  return () => subscription.remove();
}

export async function registerForPushNotifications(idToken: string) {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return {
      registered: false,
      reason: 'Push notifications require a device.',
    };
  }

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('community-updates', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Community updates',
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  const permission =
    existingPermission.status === 'granted'
      ? existingPermission
      : await Notifications.requestPermissionsAsync();

  if (permission.status !== 'granted') {
    return {
      registered: false,
      reason: 'Notification permission was declined.',
    };
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    return {
      registered: false,
      reason: 'The EAS project ID is not configured for this build.',
    };
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken(idToken, pushToken.data, Platform.OS);

  return { registered: true, token: pushToken.data };
}
