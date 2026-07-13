import { BadRequestException } from '@nestjs/common';
import {
  ActivityStatus,
  MembershipStatus,
  NotificationType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
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
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    notifications,
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
  const service = new CommunityService(
    prisma,
    {} as UsersService,
    notifications,
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
