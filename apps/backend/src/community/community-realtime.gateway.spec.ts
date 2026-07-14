import { ChatThreadType } from '@prisma/client';
import { Socket } from 'socket.io';

jest.mock('../firebase/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { RealtimeService } from '../realtime/realtime.service';
import { UsersService } from '../users/users.service';
import { CommunityRealtimeGateway } from './community-realtime.gateway';
import { CommunityService } from './community.service';

describe('CommunityRealtimeGateway', () => {
  const authorizeCohortRealtimeAccess = jest.fn();
  const verifyIdToken = jest.fn();
  const upsertFromFirebase = jest.fn();
  const memberRoom = jest.fn((userId: string) => `member:${userId}`);
  const cohortRoom = jest.fn(
    (type: ChatThreadType, activityId: string) =>
      `cohort:${type}:${activityId}`,
  );
  const gateway = new CommunityRealtimeGateway(
    {
      authorizeCohortRealtimeAccess,
    } as unknown as CommunityService,
    { verifyIdToken } as unknown as FirebaseAdminService,
    { cohortRoom, memberRoom } as unknown as RealtimeService,
    { upsertFromFirebase } as unknown as UsersService,
  );

  const client = {
    data: {},
    disconnect: jest.fn(),
    emit: jest.fn(),
    handshake: { auth: { idToken: 'firebase-token' }, headers: {} },
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket;

  beforeEach(() => {
    jest.clearAllMocks();
    client.data = {};
    client.handshake = { auth: { idToken: 'firebase-token' }, headers: {} };
    verifyIdToken.mockResolvedValue({
      phone_number: '+919999999999',
      uid: 'firebase_1',
    });
    upsertFromFirebase.mockResolvedValue({ id: 'member_1' });
    (client.join as jest.Mock).mockResolvedValue(undefined);
    (client.leave as jest.Mock).mockResolvedValue(undefined);
  });

  it('authenticates a Firebase token and joins only the private member room', async () => {
    await gateway.handleConnection(client);

    expect(upsertFromFirebase).toHaveBeenCalledTimes(1);
    expect(client.join).toHaveBeenCalledWith('member:member_1');
    expect(client.emit).toHaveBeenCalledWith('realtime:ready');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('subscribes to a cohort only after the community authorization succeeds', async () => {
    client.data.userId = 'member_1';
    authorizeCohortRealtimeAccess.mockResolvedValue(undefined);

    await expect(
      gateway.subscribeToCohort(client, {
        activityId: 'event_1',
        type: ChatThreadType.EVENT,
      }),
    ).resolves.toEqual({ ok: true });

    expect(authorizeCohortRealtimeAccess).toHaveBeenCalledWith(
      'member_1',
      ChatThreadType.EVENT,
      'event_1',
    );
    expect(client.join).toHaveBeenCalledWith('cohort:EVENT:event_1');
  });

  it('does not join a cohort room when authorization is denied', async () => {
    client.data.userId = 'member_1';
    authorizeCohortRealtimeAccess.mockRejectedValue(
      new Error('Cohort chat opens after your membership is approved.'),
    );

    await expect(
      gateway.subscribeToCohort(client, {
        activityId: 'event_1',
        type: ChatThreadType.EVENT,
      }),
    ).resolves.toEqual({
      error: 'Cohort chat opens after your membership is approved.',
      ok: false,
    });

    expect(client.join).not.toHaveBeenCalled();
  });
});
