import { KoaMiddlewareInterface, Middleware } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Middleware({ type: 'before', priority: 2 })
export class RequestLoggerMiddleware implements KoaMiddlewareInterface {
  async use(context: { req: { method: string; url: string } }, next: () => Promise<unknown>) {
    const startedAt = Date.now();
    await next();
    const duration = Date.now() - startedAt;

    console.log(`${context.req.method} ${context.req.url} ${duration}ms`);
  }
}