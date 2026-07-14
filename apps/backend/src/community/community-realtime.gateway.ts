import { UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatThreadType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import {
  firebaseTokenToSessionInput,
  UsersService,
} from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CommunityService } from './community.service';

type CohortSubscription = {
  activityId?: unknown;
  type?: unknown;
};

type GatewayResponse = { error?: string; ok: boolean };

const realtimeOrigins = [
  process.env.ADMIN_ORIGIN ?? 'http://localhost:3000',
  process.env.MOBILE_ORIGIN ?? 'http://localhost:8081',
  process.env.DOCS_ORIGIN ?? 'http://localhost:3002',
];

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: realtimeOrigins,
  },
})
export class CommunityRealtimeGateway
  implements OnGatewayConnection, OnGatewayInit
{
  constructor(
    private readonly communityService: CommunityService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly realtime: RealtimeService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.handshakeToken(client);
      if (!token) {
        throw new UnauthorizedException('A Firebase token is required.');
      }

      const firebaseUser = await this.firebaseAdminService.verifyIdToken(token);
      if (!firebaseUser.phone_number) {
        throw new UnauthorizedException(
          'A phone-authenticated account is required.',
        );
      }

      const user = await this.usersService.upsertFromFirebase(
        firebaseTokenToSessionInput(firebaseUser),
      );
      client.data.userId = user.id;
      await client.join(this.realtime.memberRoom(user.id));
      client.emit('realtime:ready');
    } catch {
      client.emit('realtime:error', {
        message: 'Unable to establish a secure realtime connection.',
      });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('cohort:subscribe')
  async subscribeToCohort(
    @ConnectedSocket() client: Socket,
    @MessageBody() input: CohortSubscription,
  ): Promise<GatewayResponse> {
    try {
      const { activityId, type } = this.parseSubscription(input);
      await this.communityService.authorizeCohortRealtimeAccess(
        this.currentUserId(client),
        type,
        activityId,
      );
      await client.join(this.realtime.cohortRoom(type, activityId));
      return { ok: true };
    } catch (error) {
      return { error: this.messageFor(error), ok: false };
    }
  }

  @SubscribeMessage('cohort:unsubscribe')
  async unsubscribeFromCohort(
    @ConnectedSocket() client: Socket,
    @MessageBody() input: CohortSubscription,
  ): Promise<GatewayResponse> {
    try {
      const { activityId, type } = this.parseSubscription(input);
      await client.leave(this.realtime.cohortRoom(type, activityId));
      return { ok: true };
    } catch (error) {
      return { error: this.messageFor(error), ok: false };
    }
  }

  private currentUserId(client: Socket) {
    if (typeof client.data.userId !== 'string') {
      throw new UnauthorizedException(
        'Realtime connection is not authenticated.',
      );
    }

    return client.data.userId;
  }

  private handshakeToken(client: Socket) {
    const authToken = client.handshake.auth?.idToken;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    return scheme === 'Bearer' && token ? token : undefined;
  }

  private messageFor(error: unknown) {
    return error instanceof Error
      ? error.message
      : 'Unable to update your realtime subscription.';
  }

  private parseSubscription(input?: CohortSubscription) {
    if (
      !input ||
      (input.type !== ChatThreadType.EVENT &&
        input.type !== ChatThreadType.CIRCLE) ||
      typeof input.activityId !== 'string' ||
      !input.activityId.trim() ||
      input.activityId.length > 128
    ) {
      throw new UnauthorizedException('Invalid cohort subscription.');
    }

    return { activityId: input.activityId, type: input.type };
  }
}
