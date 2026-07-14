import { Injectable } from '@nestjs/common';
import {
  NotificationDeliveryStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

type CreateNotificationInput = {
  body: string;
  metadata?: Prisma.InputJsonValue;
  title: string;
  type: NotificationType;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtime: RealtimeService,
  ) {}

  async createForUser(userId: string, input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      },
    });
    this.realtime.publishToMember(userId, 'notification:new', { notification });

    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { notificationsEnabled: true },
    });

    if (settings?.notificationsEnabled === false) {
      return notification;
    }

    const tokens = await this.prisma.devicePushToken.findMany({
      where: { userId, active: true },
      select: { id: true },
    });

    if (tokens.length) {
      await this.prisma.notificationDelivery.createMany({
        data: tokens.map((token) => ({
          notificationId: notification.id,
          devicePushTokenId: token.id,
        })),
      });
    }

    return notification;
  }

  async registerDeviceToken(
    userId: string,
    input: { platform: string; token: string },
  ) {
    return this.prisma.devicePushToken.upsert({
      where: { token: input.token },
      create: {
        userId,
        token: input.token,
        platform: input.platform,
        active: true,
      },
      update: {
        userId,
        platform: input.platform,
        active: true,
      },
    });
  }

  async dispatchPending(limit = 50) {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: { status: NotificationDeliveryStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        notification: true,
        devicePushToken: true,
      },
    });

    const result = { attempted: deliveries.length, failed: 0, sent: 0 };

    for (const delivery of deliveries) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          body: JSON.stringify({
            to: delivery.devicePushToken.token,
            title: delivery.notification.title,
            body: delivery.notification.body,
            data: delivery.notification.metadata ?? undefined,
          }),
          headers: {
            'Content-Type': 'application/json',
            ...(this.configService.get<string>('EXPO_PUSH_ACCESS_TOKEN')
              ? {
                  Authorization: `Bearer ${this.configService.get<string>('EXPO_PUSH_ACCESS_TOKEN')}`,
                }
              : {}),
          },
          method: 'POST',
        });
        const responseBody = await response.text();

        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            attempts: { increment: 1 },
            status: response.ok
              ? NotificationDeliveryStatus.SENT
              : NotificationDeliveryStatus.FAILED,
            sentAt: response.ok ? new Date() : null,
            providerResponse: { body: responseBody.slice(0, 2000) },
          },
        });

        if (response.ok) {
          result.sent += 1;
        } else {
          result.failed += 1;
        }
      } catch (error) {
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            attempts: { increment: 1 },
            status: NotificationDeliveryStatus.FAILED,
            providerResponse: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
        result.failed += 1;
      }
    }

    return result;
  }
}
