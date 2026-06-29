import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { resolve, isAbsolute } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

import { AppModule } from './app.module.js';
import { config } from './config.js';
import { generateEnvExample } from './config.helpers.js';

async function bootstrap() {
  const adapter = new FastifyAdapter({
    logger: config.NODE_ENV === 'development',
    bodyLimit: 12 * 1024 * 1024, // 12 MB — covers avatar uploads
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter
  );

  await app.register(helmet as Parameters<typeof app.register>[0]);
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const corsOrigins = config.CORS_ORIGINS.split(',').map(o => o.trim());
  const allowAll = corsOrigins.includes('*');
  app.enableCors({
    origin: allowAll ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Serve uploaded files (avatars) from /uploads/
  const uploadsDir = config.UPLOADS_DIR ?? './uploads';
  const absoluteUploadsDir = isAbsolute(uploadsDir)
    ? uploadsDir
    : resolve(process.cwd(), uploadsDir);
  if (!existsSync(absoluteUploadsDir)) {
    mkdirSync(absoluteUploadsDir, { recursive: true });
  }
  await app.register(fastifyStatic, {
    root: absoluteUploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  if (config.NODE_ENV === 'development') {
    await generateEnvExample();
  }

  const port = Number.parseInt(config.PORT, 10);
  await app.listen(port, '0.0.0.0');

  console.log(`\nrsnra auth API running at http://localhost:${port}/v1`);
}

bootstrap();
