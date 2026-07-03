import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @HttpCode(HttpStatus.OK)
  async createSession(@Body() body: CreateSessionDto) {
    return { user: await this.authService.createSession(body.idToken) };
  }
}
