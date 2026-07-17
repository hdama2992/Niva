import { StatusBar } from 'expo-status-bar';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useEffect, useRef, useState } from 'react';
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
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import {
  acceptSelfDeclaration,
  checkUsernameAvailability,
  completeWelcome,
  ApiUser,
  createBetaSession,
  createSession,
  deleteAccount,
  exchangePnvToken,
  setUsername,
  submitSelfie,
  updateProfile,
} from './src/services/session';
import { firebaseConfig, initializeFirebase } from './src/services/firebase';
import {
  getMobileAuthMode,
  getPhoneNumberVerificationAvailability,
  logoutMobileUser,
  requestPhoneNumberVerification,
  restoreFirebaseIdToken,
  sendPhoneCode,
  signInWithPnvCustomToken,
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
  | { idToken: string; name: 'username'; phone: string }
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
  | { idToken: string; name: 'welcome'; user: NivaUser }
  | {
      idToken: string;
      initialTab?: 'explore' | 'home' | 'plans' | 'profile';
      name: 'home';
      user: NivaUser;
    };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  const [pnvAvailable, setPnvAvailable] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const authMode = getMobileAuthMode();

  if (authMode === 'firebase') {
    initializeFirebase();
  }

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

      const timer = setTimeout(() => {
        if (isActive) {
          setRoute({ name: 'login' });
        }
      }, 900);

      return () => clearTimeout(timer);
    };

    let clearTimer: (() => void) | undefined;
    void restoreSession().then((cleanup) => {
      clearTimer = cleanup;
    });

    return () => {
      isActive = false;
      clearTimer?.();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    void getPhoneNumberVerificationAvailability()
      .then((availability) => {
        if (isActive) {
          setPnvAvailable(availability.available);
        }
      })
      .catch(() => {
        if (isActive) {
          setPnvAvailable(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authMode]);

  const handleOtpRequested = async (phone: string) => {
    await sendPhoneCode(phone, recaptchaVerifier.current);
    setRoute({ name: 'otp', phone });
  };

  const handlePnvRequested = () =>
    withApiErrors(async () => {
      const pnvToken = await requestPhoneNumberVerification();
      const customToken = await exchangePnvToken(pnvToken);
      const firebaseIdToken = await signInWithPnvCustomToken(customToken);
      const user = await createSession(firebaseIdToken);
      setRoute(routeForApiUser(firebaseIdToken, user));
    });

  const handleOtpVerified = (phone: string, code: string) =>
    withApiErrors(async () => {
      const firebaseIdToken = await verifyPhoneCode(code);

      if (firebaseIdToken) {
        const user = await createSession(firebaseIdToken);
        setRoute(routeForApiUser(firebaseIdToken, user));
        return;
      }

      const session = await createBetaSession(phone);
      setRoute(routeForApiUser(session.idToken, session.user));
    });

  const handleUsername = async (idToken: string, username: string) => {
    const { user } = await setUsername(idToken, username);
    setRoute(routeForApiUser(idToken, user));
  };

  const handleProfile = (
    idToken: string,
    phone: string,
    username: string,
    profile: ProfileDraft,
  ) =>
    withApiErrors(async () => {
      const { age, profilePhoto, ...profileData } = profile;
      if (!profilePhoto || !age) {
        throw new Error(
          'Complete the required profile fields before continuing.',
        );
      }

      const profilePhotoUrl = await uploadProfilePhoto(profilePhoto);

      await updateProfile(idToken, { age, ...profileData, profilePhotoUrl });
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

  const handleWelcome = (idToken: string) =>
    withApiErrors(async () => {
      const { user } = await completeWelcome(idToken);
      setRoute({ idToken, name: 'home', user: mapApiUser(user) });
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
        return (
          <LoginScreen
            authMode={authMode}
            onContinue={handleOtpRequested}
            onVerifyPhoneNumber={handlePnvRequested}
            pnvAvailable={pnvAvailable}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            phone={route.phone}
            onBack={() => setRoute({ name: 'login' })}
            authMode={authMode}
            onVerified={(code) => handleOtpVerified(route.phone, code)}
          />
        );
      case 'username':
        return (
          <UsernameScreen
            phone={route.phone}
            onCheckAvailability={(username) =>
              checkUsernameAvailability(route.idToken, username)
            }
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
      case 'welcome':
        return (
          <WelcomeScreen
            displayName={route.user.displayName}
            onContinue={() => handleWelcome(route.idToken)}
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
      {authMode === 'firebase' ? (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
        />
      ) : null}
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

  if (!user.welcomeCompletedAt) {
    return { idToken, name: 'welcome', user: mappedUser };
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
    flex: 1,
    backgroundColor: colors.background,
  },
  app: {
    flex: 1,
  },
});
