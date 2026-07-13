import { registerWebModule, NativeModule } from 'expo';

import {
  PhoneNumberVerificationResult,
  PhoneNumberVerificationSupport,
} from './NivaPhoneNumberVerification.types';

// NivaPhoneNumberVerificationModule is not available on the web platform.
class NivaPhoneNumberVerificationModule extends NativeModule<{}> {
  async enableTestSessionAsync(): Promise<void> {
    throw new Error('Firebase Phone Number Verification is only available on Android.');
  }

  async getSupportInfoAsync(): Promise<PhoneNumberVerificationSupport> {
    return { supported: false };
  }

  async requestVerificationAsync(): Promise<PhoneNumberVerificationResult> {
    throw new Error('Firebase Phone Number Verification is only available on Android.');
  }
}

export default registerWebModule(
  NivaPhoneNumberVerificationModule,
  'NivaPhoneNumberVerification',
);
