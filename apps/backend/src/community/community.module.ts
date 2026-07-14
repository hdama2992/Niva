import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { CommunityController } from './community.controller';
import { CommunityRealtimeGateway } from './community-realtime.gateway';
import { CommunityService } from './community.service';

@Module({
  imports: [FirebaseModule, NotificationsModule, RealtimeModule, UsersModule],
  controllers: [CommunityController],
  providers: [CommunityRealtimeGateway, CommunityService],
})
export class CommunityModule {}
