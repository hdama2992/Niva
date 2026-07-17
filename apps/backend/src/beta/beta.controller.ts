import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BetaService } from './beta.service';
import { RequestBetaAccessDto } from './dto/request-beta-access.dto';

@Controller('beta')
export class BetaController {
  constructor(private readonly betaService: BetaService) {}

  @Post('access-requests')
  @HttpCode(HttpStatus.OK)
  requestAccess(@Body() body: RequestBetaAccessDto) {
    return this.betaService.requestAccess(body);
  }
}
