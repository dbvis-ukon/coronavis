import { Observable, race, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheOptions {
  ttl: number;
}

export function Cache(options: CacheOptions) {

  let lastCallArguments: any[] = [];

  return (target: any, propertyKey: string, descriptor) => {


    const originalFunction = descriptor.value;


    target[`${propertyKey}_cached`] = new ReplaySubject(1, options.ttl);

    descriptor.value = function(...args) {

      // I'm not able to capture a defaulting that happens at function level
      /*
        ie:
        ```
        @Cache(...)
        public findAll(id: number = 1) { ... }
        ```

        if the function is called like`service.findAll();` then args would be [] but `originalFunction` will actually call the service with [1]

        Is there a way to capture the defaulting mechanism?
       */

      // args changed?
      let argsNotChanged = true;

      for (let i = 0; i < lastCallArguments.length; i++) {
        argsNotChanged = argsNotChanged && lastCallArguments[i] == args[i];
      }


      if (!argsNotChanged) { // args change
        this[`${propertyKey}_cached`] = new ReplaySubject(1, options.ttl);
      }

      lastCallArguments = args;

      const req: Observable<any> = originalFunction.apply(this, args).pipe(
        tap((response) => {
          this[`${propertyKey}_cached`].next(response);
        })
      );

      // despite what the documentation says i can't find that the complete is ever called
      return race(this[`${propertyKey}_cached`], req);

    };

    return descriptor;
  };
}
