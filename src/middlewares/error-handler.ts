import { KoaMiddlewareInterface, Middleware } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Middleware({ type: 'before', priority: 1 })
export class ErrorHandlerMiddleware implements KoaMiddlewareInterface {
  async use(
    context: { req: { method: string; url: string }; status?: number; body?: unknown },
    next: () => Promise<unknown>,
  ) {
    try {
      await next();
    } catch (error) {
      const normalizedError = error as Error & { httpCode?: number; message?: string };
      context.status = normalizedError.httpCode ?? 500;
      context.body = {
        success: false,
        error: {
          message: normalizedError.message ?? 'Internal server error',
        },
      };
    }
  }
}