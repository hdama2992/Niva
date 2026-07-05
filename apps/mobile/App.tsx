import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { colors } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SelfDeclarationScreen } from './src/screens/SelfDeclarationScreen';
import { SelfieUploadScreen } from './src/screens/SelfieUploadScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { UsernameScreen } from './src/screens/UsernameScreen';
import { VerificationPendingScreen } from './src/screens/VerificationPendingScreen';
import { NivaUser, ProfileDraft } from './src/types/niva';

type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'otp'; phone: string }
  | { name: 'username'; phone: string }
  | { name: 'profile'; phone: string; username: string }
  | {
      name: 'declaration';
      phone: string;
      username: string;
      profile: ProfileDraft;
    }
  | { name: 'selfie'; user: NivaUser; joiningTitle?: string }
  | { name: 'pending'; user: NivaUser }
  | { name: 'home'; user: NivaUser };

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
        return (
          <LoginScreen
            onContinue={(phone) => setRoute({ name: 'otp', phone })}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            phone={route.phone}
            onBack={() => setRoute({ name: 'login' })}
            onVerified={() =>
              setRoute({ name: 'username', phone: route.phone })
            }
          />
        );
      case 'username':
        return (
          <UsernameScreen
            phone={route.phone}
            onComplete={(username) =>
              setRoute({ name: 'profile', phone: route.phone, username })
            }
          />
        );
      case 'profile':
        return (
          <ProfileSetupScreen
            username={route.username}
            onComplete={(profile) =>
              setRoute({
                name: 'declaration',
                phone: route.phone,
                profile,
                username: route.username,
              })
            }
          />
        );
      case 'declaration':
        return (
          <SelfDeclarationScreen
            displayName={route.profile.displayName}
            onAccept={() =>
              setRoute({
                name: 'home',
                user: {
                  phone: route.phone,
                  username: route.username,
                  displayName: route.profile.displayName,
                  city: route.profile.city,
                  ageRange: route.profile.ageRange,
                  bio: route.profile.bio,
                  languages: route.profile.languages,
                  occupation: route.profile.occupation,
                  interests: route.profile.interests,
                  selfDeclarationAccepted: true,
                  verificationStatus: 'not_started',
                  trustScore: 40,
                  trustTier: 'new',
                },
              })
            }
          />
        );
      case 'selfie':
        return (
          <SelfieUploadScreen
            displayName={route.user.displayName}
            joiningTitle={route.joiningTitle}
            onSubmit={(selfieUrl) =>
              setRoute({
                name: 'pending',
                user: {
                  ...route.user,
                  selfieUrl,
                  verificationStatus: 'pending',
                },
              })
            }
          />
        );
      case 'pending':
        return (
          <VerificationPendingScreen
            displayName={route.user.displayName}
            onContinue={() => setRoute({ name: 'home', user: route.user })}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onLogout={() => setRoute({ name: 'login' })}
            onStartVerification={(joiningTitle) =>
              setRoute({ name: 'selfie', user: route.user, joiningTitle })
            }
            user={route.user}
          />
        );
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
