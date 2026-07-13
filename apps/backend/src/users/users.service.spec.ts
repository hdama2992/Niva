import { BadRequestException } from '@nestjs/common';
import { assertSelfieStoragePathOwnership } from './users.service';

describe('verification selfie storage ownership', () => {
  it('accepts a selfie path owned by the authenticated Firebase user', () => {
    expect(() =>
      assertSelfieStoragePathOwnership(
        'firebase_user_1',
        'verification-selfies/firebase_user_1/1720000000000.jpg',
      ),
    ).not.toThrow();
  });

  it('rejects a selfie path owned by a different Firebase user', () => {
    expect(() =>
      assertSelfieStoragePathOwnership(
        'firebase_user_1',
        'verification-selfies/firebase_user_2/1720000000000.jpg',
      ),
    ).toThrow(BadRequestException);
  });
});
