import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { colors } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { SplashScreen } from './src/screens/SplashScreen';

type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'otp'; phone: string }
  | { name: 'home'; phone: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });

  useEffect(() => {
    if (route.name !== 'splash') {
      return;
    }

    const timer = setTimeout(() => setRoute({ name: 'login' }), 900);

    return () => clearTimeout(timer);
  }, [route.name]);

  const screen = (() => {
    switch (route.name) {
      case 'splash':
        return <SplashScreen />;
      case 'login':
        return <LoginScreen onContinue={(phone) => setRoute({ name: 'otp', phone })} />;
      case 'otp':
        return (
          <OtpScreen
            phone={route.phone}
            onBack={() => setRoute({ name: 'login' })}
            onVerified={() => setRoute({ name: 'home', phone: route.phone })}
          />
        );
      case 'home':
        return <HomeScreen phone={route.phone} />;
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>{screen}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  app: {
    flex: 1,
  },
});
