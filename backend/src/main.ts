import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CONFIG } from './shared/config';
import { ProblemDetailsFilter } from './shared/errors/problem-details.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // RFC 7807 problem details exception filter
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Brightloop Subscription Management API')
    .setDescription('Modular Monolith Subscription Management System for Brightloop')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(CONFIG.port);
  console.log(`[Brightloop Backend] Running on http://localhost:${CONFIG.port}/api/v1`);
  console.log(`[Brightloop Swagger] Docs at http://localhost:${CONFIG.port}/api/docs`);
}

bootstrap();
