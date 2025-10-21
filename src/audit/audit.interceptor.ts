import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const SENSITIVE_KEYS = ['password', 'otp', 'token', 'access_token'];

function sanitize(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.includes(k.toLowerCase()) ? '[redacted]' : v;
  }
  return out;
}

/**
 * Records every state-changing admin request (POST/PATCH/DELETE) to the audit log.
 * Read-only GETs are ignored. Logging never blocks the response.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    if (req.method === 'GET') return next.handle();

    return next.handle().pipe(
      tap(() => {
        const user = req.user as { sub?: string; phoneNumber?: string } | undefined;
        this.audit
          .record({
            actorId: user?.sub,
            actorPhone: user?.phoneNumber,
            method: req.method,
            path: req.originalUrl ?? req.url,
            action: `${req.method} ${req.route?.path ?? req.url}`,
            meta: { params: req.params ?? {}, body: sanitize(req.body) },
          })
          .catch(() => undefined);
      }),
    );
  }
}
