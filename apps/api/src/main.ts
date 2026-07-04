import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      process.env.ADMIN_APP_URL ?? 'http://localhost:3000',
      process.env.MERCHANT_APP_URL ?? 'http://localhost:3002',
      process.env.STORE_APP_URL ?? 'http://localhost:3003',
      process.env.DISTRIBUTOR_APP_URL ?? 'http://localhost:3005',
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.API_PORT ?? process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start API server', err);
  process.exit(1);
});
