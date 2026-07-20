import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  View,
} from 'react-native';

import { colors } from './src/constants/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SelfDeclarationScreen } from './src/screens/SelfDeclarationScreen';
import { SelfieUploadScreen } from './src/screens/SelfieUploadScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { VerificationPendingScreen } from './src/screens/VerificationPendingScreen';
import {
  acceptSelfDeclaration,
  checkUsernameAvailability,
  ApiUser,
  createSession,
  deleteAccount,
  setUsername,
  submitSelfie,
  updateProfile,
} from './src/services/session';
import { initializeFirebase } from './src/services/firebase';
import {
  assertFirebaseAuthConfigured,
  logoutMobileUser,
  restoreFirebaseIdToken,
  sendPhoneCode,
  verifyPhoneCode,
} from './src/services/mobile-auth';
import {
  uploadProfilePhoto,
  uploadVerificationSelfie,
  type SelectedImage,
} from './src/services/media';
import { NivaUser, ProfileDraft } from './src/types/niva';

type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'otp'; phone: string }
  | { idToken: string; name: 'profile'; phone: string; username: string }
  | {
      idToken: string;
      name: 'declaration';
      phone: string;
      username: string;
      profile: ProfileDraft;
    }
  | {
      idToken: string;
      joiningTitle?: string;
      name: 'selfie';
      returnTab?: 'explore' | 'home' | 'plans' | 'profile';
      user: NivaUser;
    }
  | {
      idToken: string;
      name: 'pending';
      returnTab?: 'explore' | 'home' | 'plans' | 'profile';
      user: NivaUser;
    }
  | { idToken: string; name: 'edit-profile'; user: NivaUser }
  | {
      idToken: string;
      initialTab?: 'explore' | 'home' | 'plans' | 'profile';
      name: 'home';
      user: NivaUser;
    };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  assertFirebaseAuthConfigured();
  initializeFirebase();

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      try {
        const idToken = await restoreFirebaseIdToken();

        if (idToken) {
          const user = await createSession(idToken);

          if (isActive) {
            setRoute(routeForApiUser(idToken, user));
          }

          return;
        }
      } catch (error) {
        console.warn('Unable to restore the Niva session.', error);
      }

      if (isActive) {
        setRoute({ name: 'login' });
      }
    };

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const handleOtpRequested = async (phone: string) => {
    await sendPhoneCode(phone);
    setRoute({ name: 'otp', phone });
  };

  const handleOtpVerified = async (_phone: string, code: string) => {
    const firebaseIdToken = await verifyPhoneCode(code);

    if (firebaseIdToken) {
      const user = await createSession(firebaseIdToken);
      setRoute(routeForApiUser(firebaseIdToken, user));
      return;
    }
    throw new Error('Firebase did not create a signed-in session.');
  };

  const handleProfile = (
    idToken: string,
    phone: string,
    currentUsername: string,
    submittedUsername: string,
    profile: ProfileDraft,
  ) =>
    withApiErrors(async () => {
      let activeIdToken = idToken;
      const refreshedIdToken = await restoreFirebaseIdToken();
      if (!refreshedIdToken) {
        setRoute({ name: 'login' });
        Alert.alert(
          'Sign in again',
          'Your session expired before the photo upload. Sign in again to finish your profile.',
        );
        return;
      }
      activeIdToken = refreshedIdToken;

      let username = currentUsername;
      if (!username) {
        const { user } = await setUsername(activeIdToken, submittedUsername);
        username = user.username ?? submittedUsername;
        setRoute({
          idToken: activeIdToken,
          name: 'profile',
          phone,
          username,
        });
      }

      const { age, profilePhoto, ...profileData } = profile;
      if (!profilePhoto || !age) {
        throw new Error(
          'Complete the required profile fields before continuing.',
        );
      }

      const profilePhotoUrl = await uploadProfilePhoto(profilePhoto);

      await updateProfile(activeIdToken, {
        age,
        ...profileData,
        profilePhotoUrl,
      });
      setRoute({
        idToken: activeIdToken,
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

  const handleProfileUpdate = (
    idToken: string,
    currentUser: NivaUser,
    profile: ProfileDraft,
  ) =>
    withApiErrors(async () => {
      const { age, profilePhoto, ...profileData } = profile;
      if (!age) {
        throw new Error('Enter a valid age before saving your profile.');
      }

      const profilePhotoUrl = profilePhoto
        ? await uploadProfilePhoto(profilePhoto)
        : currentUser.profilePhotoUrl;

      if (!profilePhotoUrl) {
        throw new Error('Add a profile photo before saving your profile.');
      }

      const { user } = await updateProfile(idToken, {
        age,
        ...profileData,
        profilePhotoUrl,
      });

      setRoute({
        idToken,
        initialTab: 'profile',
        name: 'home',
        user: mapApiUser(user),
      });
    });

  const handleSelfie = (
    idToken: string,
    currentUser: NivaUser,
    image: SelectedImage,
    returnTab?: 'explore' | 'home' | 'plans' | 'profile',
  ) =>
    withApiErrors(async () => {
      const selfieStoragePath = await uploadVerificationSelfie(image);
      const { user } = await submitSelfie(idToken, selfieStoragePath);
      setRoute({
        idToken,
        name: 'pending',
        returnTab,
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
        return <LoginScreen onContinue={handleOtpRequested} />;
      case 'otp':
        return (
          <OtpScreen
            phone={route.phone}
            onBack={() => setRoute({ name: 'login' })}
            onResend={() => sendPhoneCode(route.phone)}
            onVerified={(code) => handleOtpVerified(route.phone, code)}
          />
        );
      case 'profile':
        return (
          <ProfileSetupScreen
            onCheckUsernameAvailability={(username) =>
              checkUsernameAvailability(route.idToken, username)
            }
            username={route.username}
            onComplete={(profile, username) =>
              handleProfile(
                route.idToken,
                route.phone,
                route.username,
                username,
                profile,
              )
            }
          />
        );
      case 'declaration':
        return (
          <SelfDeclarationScreen
            displayName={route.profile.displayName}
            onBack={() =>
              setRoute({
                idToken: route.idToken,
                name: 'profile',
                phone: route.phone,
                username: route.username,
              })
            }
            onAccept={() => handleDeclaration(route.idToken)}
          />
        );
      case 'selfie':
        return (
          <SelfieUploadScreen
            displayName={route.user.displayName}
            joiningTitle={route.joiningTitle}
            onBack={() =>
              setRoute({
                idToken: route.idToken,
                initialTab: route.returnTab ?? 'home',
                name: 'home',
                user: route.user,
              })
            }
            onSubmit={(image) =>
              handleSelfie(route.idToken, route.user, image, route.returnTab)
            }
          />
        );
      case 'pending':
        return (
          <VerificationPendingScreen
            displayName={route.user.displayName}
            onBack={() =>
              setRoute({
                idToken: route.idToken,
                initialTab: route.returnTab ?? 'home',
                name: 'home',
                user: route.user,
              })
            }
            onContinue={() =>
              setRoute({
                idToken: route.idToken,
                initialTab: route.returnTab ?? 'home',
                name: 'home',
                user: route.user,
              })
            }
          />
        );
      case 'edit-profile':
        return (
          <ProfileSetupScreen
            initialProfile={profileDraftFromNivaUser(route.user)}
            initialProfilePhotoUrl={route.user.profilePhotoUrl}
            mode="edit"
            onBack={() =>
              setRoute({
                idToken: route.idToken,
                initialTab: 'profile',
                name: 'home',
                user: route.user,
              })
            }
            onComplete={(profile) =>
              handleProfileUpdate(route.idToken, route.user, profile)
            }
            username={route.user.username}
          />
        );
      case 'home':
        return (
          <HomeScreen
            initialTab={route.initialTab}
            onDeleteAccount={async () => {
              await deleteAccount(route.idToken);
              await logoutMobileUser();
              setRoute({ name: 'login' });
            }}
            onLogout={() =>
              withApiErrors(async () => {
                await logoutMobileUser();
                setRoute({ name: 'login' });
              })
            }
            onEditProfile={() =>
              setRoute({
                idToken: route.idToken,
                name: 'edit-profile',
                user: route.user,
              })
            }
            onStartVerification={(joiningTitle, returnTab) =>
              setRoute({
                idToken: route.idToken,
                name: 'selfie',
                returnTab,
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
    console.error('Niva request failed.', error);
    Alert.alert(
      'Something went wrong',
      'Please try again. If the problem continues, contact Niva support.',
    );
  }
}

function routeForApiUser(idToken: string, user: ApiUser): Route {
  const mappedUser = mapApiUser(user);
  const profile = profileDraftFromApiUser(user);

  if (!user.username || !profile) {
    return {
      idToken,
      name: 'profile',
      phone: mappedUser.phone,
      username: user.username ?? '',
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
    age: profile?.age ?? undefined,
    bio: profile?.bio ?? undefined,
    languages: profile?.languages?.length ? profile.languages : ['English'],
    occupation: profile?.occupation ?? undefined,
    profilePhotoUrl: profile?.profilePhotoUrl ?? undefined,
    interests: profile?.interests?.length
      ? profile.interests
      : ['Books', 'Coffee', 'Wellness'],
    selfieUrl: selfie?.selfieUrl ?? undefined,
    selfDeclarationAccepted: user.selfDeclarationAccepted,
    communityGuidelinesAccepted: user.communityGuidelinesAccepted,
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
    age: profile.age ?? undefined,
    bio: profile.bio ?? undefined,
    languages: profile.languages?.length ? profile.languages : ['English'],
    occupation: profile.occupation ?? undefined,
    interests: profile.interests,
  };
}

function profileDraftFromNivaUser(user: NivaUser): ProfileDraft {
  return {
    age: user.age,
    bio: user.bio,
    city: user.city,
    displayName: user.displayName,
    interests: user.interests,
    languages: user.languages,
    occupation: user.occupation,
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
    backgroundColor: colors.background,
    flex: 1,
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
  app: {
    flex: 1,
  },
});
