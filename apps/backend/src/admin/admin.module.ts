import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminKeyGuard } from './admin-key.guard';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [AdminKeyGuard],
})
export class AdminModule {}
