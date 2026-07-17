import { Module } from '@nestjs/common';
import { AccountLifecycleController } from './account-lifecycle.controller';
import { AccountLifecycleService } from './account-lifecycle.service';

@Module({
  controllers: [AccountLifecycleController],
  providers: [AccountLifecycleService],
})
export class AccountLifecycleModule {}
