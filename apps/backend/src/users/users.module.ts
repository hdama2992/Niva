import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersController } from './users.controller';
import { TrustMaintenanceService } from './trust-maintenance.service';
import { UsersService } from './users.service';

@Module({
  imports: [FirebaseModule],
  controllers: [UsersController],
  providers: [TrustMaintenanceService, UsersService],
  exports: [TrustMaintenanceService, UsersService],
})
export class UsersModule {}
