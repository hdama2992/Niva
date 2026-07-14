import { BadRequestException } from '@nestjs/common';
import {
  ActivityStatus,
  MembershipStatus,
  NotificationType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { RealtimeService } from '../realtime/realtime.service';
import { UsersService } from '../users/users.service';
import { CommunityService } from './community.service';

describe('CommunityService join capacity', () => {
  type TransactionCallback = (client: unknown) => Promise<unknown>;

  const eventFindUnique = jest.fn();
  const eventMemberFindUnique = jest.fn();
  const eventMemberCount = jest.fn();
  const eventMemberUpsert = jest.fn();
  const notificationCreate = jest.fn();
  const transaction = jest.fn<Promise<unknown>, [TransactionCallback]>();
  const prisma = {
    $transaction: transaction,
    event: { findUnique: eventFindUnique },
  } as unknown as PrismaService;
  const notifications = {
    createForUser: notificationCreate,
  } as unknown as NotificationService;
  const realtime = {
    publishToCohort: jest.fn(),
    publishToMember: jest.fn(),
  } as unknown as RealtimeService;
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    notifications,
    realtime,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    eventFindUnique.mockResolvedValue({ requiresVerification: false });
    const transactionClient = {
      event: {
        findUnique: jest.fn().mockResolvedValue({
          capacity: 6,
          id: 'event_1',
          status: 'PUBLISHED',
          title: 'Coffee and Books',
        }),
      },
      eventMember: {
        count: eventMemberCount,
        findUnique: eventMemberFindUnique,
        upsert: eventMemberUpsert,
      },
    };
    transaction.mockImplementation((callback) => callback(transactionClient));
  });

  it('rejects a new join request when the event is full', async () => {
    eventMemberFindUnique.mockResolvedValue(null);
    eventMemberCount.mockResolvedValue(6);

    await expect(service.joinEvent('user_1', 'event_1')).rejects.toThrow(
      BadRequestException,
    );
    expect(eventMemberUpsert).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it('allows an existing active member to repeat a join request without consuming another seat', async () => {
    eventMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.REQUESTED,
    });
    eventMemberUpsert.mockResolvedValue({
      event: { title: 'Coffee and Books' },
      status: MembershipStatus.REQUESTED,
    });

    await expect(service.joinEvent('user_1', 'event_1')).resolves.toMatchObject(
      {
        status: MembershipStatus.REQUESTED,
      },
    );
    expect(eventMemberCount).not.toHaveBeenCalled();
    expect(notificationCreate).toHaveBeenCalledWith('user_1', {
      body: 'Your request for Coffee and Books is ready for host review.',
      metadata: { eventId: 'event_1' },
      title: 'Join request received',
      type: NotificationType.JOIN_REQUEST_ACCEPTED,
    });
  });
});

describe('CommunityService activity lifecycle', () => {
  const eventFindUnique = jest.fn();
  const eventUpdate = jest.fn();
  const eventMemberCount = jest.fn();
  const eventMemberFindMany = jest.fn();
  const notificationCreate = jest.fn();
  const prisma = {
    event: { findUnique: eventFindUnique, update: eventUpdate },
    eventMember: {
      count: eventMemberCount,
      findMany: eventMemberFindMany,
    },
  } as unknown as PrismaService;
  const notifications = {
    createForUser: notificationCreate,
  } as unknown as NotificationService;
  const realtime = {
    publishToCohort: jest.fn(),
    publishToMember: jest.fn(),
  } as unknown as RealtimeService;
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    notifications,
    realtime,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    eventFindUnique.mockResolvedValue({
      hostId: 'host_1',
      status: ActivityStatus.PUBLISHED,
      title: 'Coffee and Books',
    });
  });

  it('prevents a host from reducing capacity below active memberships', async () => {
    eventMemberCount.mockResolvedValue(4);

    await expect(
      service.updateEvent('host_1', 'event_1', { capacity: 3 }),
    ).rejects.toThrow(BadRequestException);
    expect(eventUpdate).not.toHaveBeenCalled();
  });

  it('cancels a published event and notifies pending and approved members', async () => {
    eventUpdate.mockResolvedValue({ title: 'Coffee and Books' });
    eventMemberFindMany.mockResolvedValue([
      { userId: 'member_1' },
      { userId: 'member_2' },
    ]);

    await service.cancelEvent('host_1', 'event_1', 'Venue closed early');

    expect(eventUpdate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(2);
    expect(notificationCreate).toHaveBeenCalledWith('member_1', {
      body: 'Coffee and Books was cancelled. Venue closed early',
      metadata: { eventId: 'event_1', reason: 'Venue closed early' },
      title: 'Event cancelled',
      type: NotificationType.ACTIVITY_CANCELLED,
    });
  });
});

describe('CommunityService icebreaker access', () => {
  const eventMemberFindUnique = jest.fn();
  const circleMemberFindUnique = jest.fn();
  const prisma = {
    circleMember: { findUnique: circleMemberFindUnique },
    eventMember: { findUnique: eventMemberFindUnique },
  } as unknown as PrismaService;
  const realtime = {
    publishToCohort: jest.fn(),
    publishToMember: jest.fn(),
  } as unknown as RealtimeService;
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    {} as NotificationService,
    realtime,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a requested member from icebreakers', async () => {
    eventMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.REQUESTED,
    });

    await expect(
      (
        service as unknown as {
          assertIcebreakerAccess: (
            userId: string,
            type: 'EVENT',
            activityId: string,
          ) => Promise<void>;
        }
      ).assertIcebreakerAccess('member_1', 'EVENT', 'event_1'),
    ).rejects.toThrow(
      'Icebreakers are available only to approved activity members.',
    );
  });

  it('allows an approved member into icebreakers', async () => {
    circleMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.APPROVED,
    });

    await expect(
      (
        service as unknown as {
          assertIcebreakerAccess: (
            userId: string,
            type: 'CIRCLE',
            activityId: string,
          ) => Promise<void>;
        }
      ).assertIcebreakerAccess('member_1', 'CIRCLE', 'circle_1'),
    ).resolves.toBeUndefined();
  });
});

describe('CommunityService realtime chat delivery', () => {
  const chatThreadFindFirst = jest.fn();
  const eventMemberFindUnique = jest.fn();
  const chatMessageCreate = jest.fn();
  const publishToCohort = jest.fn();
  const prisma = {
    chatMessage: { create: chatMessageCreate },
    chatThread: { findFirst: chatThreadFindFirst },
    eventMember: { findUnique: eventMemberFindUnique },
  } as unknown as PrismaService;
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    {} as NotificationService,
    {
      publishToCohort,
      publishToMember: jest.fn(),
    } as unknown as RealtimeService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    chatThreadFindFirst.mockResolvedValue({
      event: { hostId: 'host_1' },
      id: 'thread_1',
    });
    eventMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.APPROVED,
    });
    chatMessageCreate.mockResolvedValue({
      body: 'Hello everyone',
      id: 'message_1',
      sender: { displayName: 'Maya', id: 'member_1', username: 'maya' },
      senderId: 'member_1',
    });
  });

  it('persists a message before broadcasting it to its authorized cohort room', async () => {
    await service.sendChatMessage(
      'member_1',
      'EVENT',
      'event_1',
      'Hello everyone',
    );

    expect(chatMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          body: 'Hello everyone',
          senderId: 'member_1',
          threadId: 'thread_1',
        },
      }),
    );
    expect(publishToCohort).toHaveBeenCalledWith(
      'EVENT',
      'event_1',
      'cohort:message',
      expect.objectContaining({
        message: expect.objectContaining({ id: 'message_1' }),
      }),
    );
  });
});

describe('CommunityService feedback trust policy', () => {
  const eventMemberFindUnique = jest.fn();
  const eventFeedbackFindUnique = jest.fn();
  const eventFeedbackUpsert = jest.fn();
  const analyticsCreate = jest.fn();
  const recordFeedbackSubmitted = jest.fn();
  const prisma = {
    eventFeedback: {
      findUnique: eventFeedbackFindUnique,
      upsert: eventFeedbackUpsert,
    },
    eventMember: { findUnique: eventMemberFindUnique },
    productAnalyticsEvent: { create: analyticsCreate },
  } as unknown as PrismaService;
  const service = new CommunityService(
    prisma,
    { recordFeedbackSubmitted } as unknown as UsersService,
    {} as NotificationService,
    {} as RealtimeService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires recorded attendance before accepting feedback', async () => {
    eventMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.APPROVED,
    });

    await expect(
      service.submitFeedback('member_1', 'event_1', { rating: 5 }),
    ).rejects.toThrow('Feedback opens after the host records your attendance.');
    expect(eventFeedbackUpsert).not.toHaveBeenCalled();
    expect(recordFeedbackSubmitted).not.toHaveBeenCalled();
  });

  it('records one feedback trust event for a first attended-event response', async () => {
    eventMemberFindUnique.mockResolvedValue({
      status: MembershipStatus.ATTENDED,
    });
    eventFeedbackFindUnique.mockResolvedValue(null);
    eventFeedbackUpsert.mockResolvedValue({ id: 'feedback_1', rating: 5 });

    await service.submitFeedback('member_1', 'event_1', { rating: 5 });

    expect(recordFeedbackSubmitted).toHaveBeenCalledWith('member_1', 'event_1');
    expect(analyticsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'event_1',
          userId: 'member_1',
        }),
      }),
    );
  });
});
