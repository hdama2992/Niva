import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = [
    process.env.ADMIN_ORIGIN ?? 'http://localhost:3000',
    process.env.MOBILE_ORIGIN ?? 'http://localhost:8081',
    process.env.DOCS_ORIGIN ?? 'http://localhost:3002',
    process.env.WEBSITE_ORIGIN ?? 'http://localhost:3003',
  ];

  app.enableCors({
    origin: allowedOrigins.filter(Boolean),
    credentials: true,
  });
  app.set('trust proxy', 1);
  app.use(helmet());
  app.useBodyParser('json', {
    limit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
  });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
