import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        if (data && typeof data === 'object' && 'meta' in data && 'data' in data) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        if (data && typeof data === 'object' && 'data' in data && !('meta' in data)) {
          return {
            success: true,
            data: data.data,
          };
        }

        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          return {
            success: true,
            data: data.items,
            meta: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            },
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
