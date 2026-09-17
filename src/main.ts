import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers + response compression.
  // crossOriginResourcePolicy disabled so the cross-origin frontend (port 3001) can load
  // uploaded files served from /uploads on this origin. Add stricter CSP and HSTS in production.
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"].concat(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
              frameAncestors: ["'none'"],
            },
          }
        : false,
    }),
  );
  app.use(compression());

  // Serve uploaded files (verification documents, etc.) from /uploads.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Development: allow any browser origin so local frontends on any port can
  // call the API. Set CORS_ORIGINS as a comma-separated allow-list in
  // production (for example, the deployed Vercel domain).
  const corsOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Consistent, sanitized error responses (no stack-trace leaks).
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Interactive API docs at /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Microbusiness Marketplace API')
    .setDescription('Local microbusiness services marketplace backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application running on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`API docs at http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
