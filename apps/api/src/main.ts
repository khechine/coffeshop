import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import * as p2r from 'path-to-regexp';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('--- DIAGNOSTIC path-to-regexp ---');
  console.log('Type of path-to-regexp:', typeof p2r);
  console.log('Contents of path-to-regexp object:', p2r);
  console.log('--- END DIAGNOSTIC ---');
  
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Autoriser les requêtes depuis l'application mobile

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
