import { debounceTime, skip, switchMap, takeUntil } from 'rxjs/operators';


export const safeDebounce = (time: number, selector) => (source$) =>
  source$.pipe(
    debounceTime(time),
    switchMap((...args: any[]) => selector(...args)
        .pipe(
            takeUntil(
                source$
                    .pipe(
                        skip(1)
                    )
            )
        )
    )
  );
