import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // 允许各前端门户从浏览器直连 API（登录、注册等客户端 fetch）
  app.enableCors({
    origin: [
      process.env.ADMIN_APP_URL ?? 'http://localhost:3000',
      process.env.MERCHANT_APP_URL ?? 'http://localhost:3002',
      process.env.STORE_APP_URL ?? 'http://localhost:3003',
      process.env.DISTRIBUTOR_APP_URL ?? 'http://localhost:3005',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = process.env.API_PORT ?? process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
