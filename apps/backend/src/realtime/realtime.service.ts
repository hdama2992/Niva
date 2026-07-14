import { Injectable } from '@nestjs/common';
import { ChatThreadType } from '@prisma/client';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server?: Server;

  attach(server: Server) {
    this.server = server;
  }

  memberRoom(userId: string) {
    return `member:${userId}`;
  }

  cohortRoom(type: ChatThreadType, activityId: string) {
    return `cohort:${type}:${activityId}`;
  }

  publishToMember(userId: string, event: string, payload: unknown) {
    this.server?.to(this.memberRoom(userId)).emit(event, payload);
  }

  publishToCohort(
    type: ChatThreadType,
    activityId: string,
    event: string,
    payload: unknown,
  ) {
    this.server?.to(this.cohortRoom(type, activityId)).emit(event, payload);
  }
}
