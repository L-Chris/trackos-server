import 'reflect-metadata';
import bodyParser from 'koa-bodyparser';
import { createKoaServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { env } from './config/env';
import { HealthController } from './controllers/health.controller';
import { LocationController } from './controllers/location.controller';
import { ErrorHandlerMiddleware } from './middlewares/error-handler';
import { RequestLoggerMiddleware } from './middlewares/request-logger';

useContainer(Container);

export function createApp() {
  const app = createKoaServer({
    routePrefix: '/api',
    cors: true,
    defaultErrorHandler: false,
    classTransformer: true,
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
    },
    controllers: [HealthController, LocationController],
    middlewares: [ErrorHandlerMiddleware, RequestLoggerMiddleware],
  });

  app.use(bodyParser());

  app.on('error', (error: Error) => {
    console.error('Unhandled Koa error', error);
  });

  return {
    app,
    port: env.port,
  };
}