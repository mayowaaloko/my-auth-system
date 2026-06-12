import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filter/global-exception';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('API_URL'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(
    cookieParser(
      configService.get<string>('COOKIE_SECRET') ?? 'fallback-cookie-secret',
    ),
  );

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Production Grade uth System')
    .setDescription('A production grade authentication system project')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // if (configService.get<string>('NODE_ENV') !== 'production') {
  //   SwaggerModule.setup('api/docs', app, document);
  // }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}/api/v1`);
  console.log(`Swagger is running on: ${await app.getUrl()}/api/v1/docs`);
}
bootstrap().catch((error) => {
  console.error('❌ Application falied to start:', error);
  process.exit(1);
});
