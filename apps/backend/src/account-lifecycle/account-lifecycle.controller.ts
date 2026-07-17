import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AccountLifecycleService } from './account-lifecycle.service';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';

@Controller('account-deletion-requests')
export class AccountLifecycleController {
  constructor(private readonly accountLifecycle: AccountLifecycleService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  requestDeletion(@Body() body: RequestAccountDeletionDto) {
    return this.accountLifecycle.requestDeletion(body);
  }
}
