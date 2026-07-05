import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';

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
import {
  acceptSelfDeclaration,
  ApiUser,
  createBetaSession,
  setUsername,
  submitSelfie,
  updateProfile,
} from './src/services/session';
import { NivaUser, ProfileDraft } from './src/types/niva';

type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'otp'; phone: string }
  | { idToken: string; name: 'username'; phone: string }
  | { idToken: string; name: 'profile'; phone: string; username: string }
  | {
      idToken: string;
      name: 'declaration';
      phone: string;
      username: string;
      profile: ProfileDraft;
    }
  | { idToken: string; name: 'selfie'; user: NivaUser; joiningTitle?: string }
  | { idToken: string; name: 'pending'; user: NivaUser }
  | { idToken: string; name: 'home'; user: NivaUser };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });

  useEffect(() => {
    if (route.name !== 'splash') {
      return;
    }

    const timer = setTimeout(() => setRoute({ name: 'login' }), 900);

    return () => clearTimeout(timer);
  }, [route.name]);

  const handleOtpVerified = (phone: string) =>
    withApiErrors(async () => {
      const session = await createBetaSession(phone);
      setRoute(routeForApiUser(session.idToken, session.user));
    });

  const handleUsername = (idToken: string, username: string) =>
    withApiErrors(async () => {
      const { user } = await setUsername(idToken, username);
      setRoute(routeForApiUser(idToken, user));
    });

  const handleProfile = (
    idToken: string,
    phone: string,
    username: string,
    profile: ProfileDraft,
  ) =>
    withApiErrors(async () => {
      await updateProfile(idToken, profile);
      setRoute({
        idToken,
        name: 'declaration',
        phone,
        profile,
        username,
      });
    });

  const handleDeclaration = (idToken: string) =>
    withApiErrors(async () => {
      const { user } = await acceptSelfDeclaration(idToken);
      setRoute(routeForApiUser(idToken, user));
    });

  const handleSelfie = (
    idToken: string,
    currentUser: NivaUser,
    selfieUrl: string,
  ) =>
    withApiErrors(async () => {
      const { user } = await submitSelfie(idToken, selfieUrl);
      setRoute({
        idToken,
        name: 'pending',
        user: {
          ...currentUser,
          ...mapApiUser(user),
        },
      });
    });

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
            onVerified={() => handleOtpVerified(route.phone)}
          />
        );
      case 'username':
        return (
          <UsernameScreen
            phone={route.phone}
            onComplete={(username) => handleUsername(route.idToken, username)}
          />
        );
      case 'profile':
        return (
          <ProfileSetupScreen
            username={route.username}
            onComplete={(profile) =>
              handleProfile(route.idToken, route.phone, route.username, profile)
            }
          />
        );
      case 'declaration':
        return (
          <SelfDeclarationScreen
            displayName={route.profile.displayName}
            onAccept={() => handleDeclaration(route.idToken)}
          />
        );
      case 'selfie':
        return (
          <SelfieUploadScreen
            displayName={route.user.displayName}
            joiningTitle={route.joiningTitle}
            onSubmit={(selfieUrl) =>
              handleSelfie(route.idToken, route.user, selfieUrl)
            }
          />
        );
      case 'pending':
        return (
          <VerificationPendingScreen
            displayName={route.user.displayName}
            onContinue={() =>
              setRoute({
                idToken: route.idToken,
                name: 'home',
                user: route.user,
              })
            }
          />
        );
      case 'home':
        return (
          <HomeScreen
            onLogout={() => setRoute({ name: 'login' })}
            onStartVerification={(joiningTitle) =>
              setRoute({
                idToken: route.idToken,
                name: 'selfie',
                user: route.user,
                joiningTitle,
              })
            }
            idToken={route.idToken}
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

async function withApiErrors(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong connecting to Niva.';
    Alert.alert('Niva backend', message);
  }
}

function routeForApiUser(idToken: string, user: ApiUser): Route {
  const mappedUser = mapApiUser(user);
  const profile = profileDraftFromApiUser(user);

  if (!user.username) {
    return {
      idToken,
      name: 'username',
      phone: mappedUser.phone,
    };
  }

  if (!profile) {
    return {
      idToken,
      name: 'profile',
      phone: mappedUser.phone,
      username: user.username,
    };
  }

  if (!user.selfDeclarationAccepted) {
    return {
      idToken,
      name: 'declaration',
      phone: mappedUser.phone,
      profile,
      username: user.username,
    };
  }

  return { idToken, name: 'home', user: mappedUser };
}

function mapApiUser(user: ApiUser): NivaUser {
  const profile = user.profile;
  const trust = user.trust;
  const selfie = user.selfieVerification;

  return {
    id: user.id,
    phone: user.phone ?? '',
    username: user.username ?? '',
    displayName: user.displayName ?? profile?.displayName ?? 'Niva member',
    city: profile?.city ?? 'Bangalore',
    ageRange: profile?.ageRange ?? undefined,
    bio: profile?.bio ?? undefined,
    languages: profile?.languages?.length ? profile.languages : ['English'],
    occupation: profile?.occupation ?? undefined,
    interests: profile?.interests?.length
      ? profile.interests
      : ['Books', 'Coffee', 'Wellness'],
    selfieUrl: selfie?.selfieUrl ?? undefined,
    selfDeclarationAccepted: user.selfDeclarationAccepted,
    verificationStatus: mapVerificationStatus(
      trust?.verificationStatus,
      selfie?.status,
    ),
    trustScore: trust?.score ?? 0,
    trustTier: mapTrustTier(trust?.tier),
  };
}

function profileDraftFromApiUser(user: ApiUser): ProfileDraft | undefined {
  const profile = user.profile;

  if (!profile?.displayName || !profile.city || !profile.interests?.length) {
    return undefined;
  }

  return {
    displayName: profile.displayName,
    city: profile.city,
    ageRange: profile.ageRange ?? undefined,
    bio: profile.bio ?? undefined,
    languages: profile.languages?.length ? profile.languages : ['English'],
    occupation: profile.occupation ?? undefined,
    interests: profile.interests,
  };
}

function mapVerificationStatus(
  trustStatus?: string,
  selfieStatus?: string,
): NivaUser['verificationStatus'] {
  if (trustStatus === 'VERIFIED' || selfieStatus === 'APPROVED') {
    return 'approved';
  }

  if (trustStatus === 'PENDING' || selfieStatus === 'PENDING') {
    return 'pending';
  }

  if (selfieStatus === 'NEEDS_REVIEW') {
    return 'needs_review';
  }

  if (trustStatus === 'RESTRICTED' || selfieStatus === 'REJECTED') {
    return 'rejected';
  }

  return 'not_started';
}

function mapTrustTier(tier?: string): NivaUser['trustTier'] {
  switch (tier) {
    case 'BASIC_VERIFIED':
      return 'basic_verified';
    case 'HOST':
      return 'host';
    case 'HOST_ELIGIBLE':
      return 'host_eligible';
    case 'TRUSTED':
      return 'trusted';
    default:
      return 'new';
  }
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
