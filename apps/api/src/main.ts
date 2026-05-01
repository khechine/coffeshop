import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors(); // Autoriser les requêtes depuis l'application mobile

  // Serve static files (uploads) — use UPLOAD_DIR env or cwd-relative path
  const publicDir = process.env.UPLOAD_DIR 
    ? join(process.env.UPLOAD_DIR, '..') 
    : join(process.cwd(), 'apps', 'api', 'public');
  app.useStaticAssets(publicDir);

  // Increase payload limit for image uploads (10MB)
  app.use(json({ limit: '10mb' }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('CoffeeShop B2B API')
    .setDescription('The CoffeeShop B2B API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
