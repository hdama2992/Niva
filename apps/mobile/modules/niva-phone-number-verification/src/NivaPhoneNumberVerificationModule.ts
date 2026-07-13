import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class NivaPhoneNumberVerificationModule extends NativeModule<{}> {
  enableTestSessionAsync(testToken: string): Promise<void>;
  getSupportInfoAsync(): Promise<{ supported: boolean }>;
  requestVerificationAsync(): Promise<{ pnvToken: string }>;
}

export default requireOptionalNativeModule<NivaPhoneNumberVerificationModule>(
  'NivaPhoneNumberVerification',
);
