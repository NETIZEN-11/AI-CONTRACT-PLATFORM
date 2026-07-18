import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('port', 3001);
  const environment = configService.get('environment', 'development');

  // Enable CORS
  app.enableCors({
    origin: configService.get('cors.origin', ['http://localhost:3000']),
    credentials: true,
  });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Contract AI API')
      .setDescription('AI Contract Review Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .addTag('contracts')
      .addTag('reviews')
      .addTag('analytics')
      .addTag('auth')
      .addTag('users')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Contract AI API running on port ${port} (${environment})`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
