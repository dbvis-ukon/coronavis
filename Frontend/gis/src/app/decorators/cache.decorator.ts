import { ReplaySubject, race } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheOptions {
  ttl: number;
}

export function Cache(options: CacheOptions) {

  return (target: any, propertyKey: string, descriptor) => {

    const originalFunction = descriptor.value;

    target[`${propertyKey}_cached`] = new ReplaySubject(1, options.ttl);

    descriptor.value = function (...args) {

      const req = originalFunction.apply(this, args).pipe(
        tap((response) => {
          console.log('cache', `${propertyKey}_cached`);
          this[`${propertyKey}_cached`].next(response);
        })
      );

      return race(this[`${propertyKey}_cached`], req);

    };

    return descriptor;
  };
}
