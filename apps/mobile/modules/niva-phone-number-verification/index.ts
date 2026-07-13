// Re-export the native module. On web, it will be resolved to NivaPhoneNumberVerificationModule.web.ts
// and on native platforms to NivaPhoneNumberVerificationModule.ts
export { default } from './src/NivaPhoneNumberVerificationModule';
export * from './src/NivaPhoneNumberVerification.types';
