import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CallSendBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend and mobile devices
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 CallSend Core Engine running on: http://localhost:${port}`);
  logger.log(`📡 WebSocket Real-Time Gateway connected`);
  logger.log(`====================================================`);
}
bootstrap();
