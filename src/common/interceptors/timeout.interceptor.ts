import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
	RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ROUTE_TIMEOUT } from '../constants';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			timeout(ROUTE_TIMEOUT),
			catchError((err) => {
				if (err instanceof TimeoutError) {
					return throwError(() => new RequestTimeoutException());
				}

				return throwError(() => err);
			}),
		);
	}
}
