import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminKeyGuard } from './admin-key.guard';

@Module({
  imports: [FirebaseModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminKeyGuard],
})
export class AdminModule {}
