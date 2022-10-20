import { Observable, of, map, filter } from "rxjs";

const double = (source: Observable<number>): Observable<number> => {
  return new Observable<number>(subscriber => {
    const subscription = source.subscribe({
      next: (value) => subscriber.next(value * 2),
      complete: () => subscriber.complete(),
      error: (err) => subscriber.error(err)
    });
    return () => subscription.unsubscribe();
  });
}

of(1, 2, 3, 4, 5).pipe(double).subscribe(console.log)

// operator (HOC): return function that return Observable
const multiply = (multiple: number) => (source: Observable<number>): Observable<number> => {
    return new Observable<number>(subscriber => {
        const subscription = source.subscribe({
            next: (value) => subscriber.next(multiple * value),
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err)
        })

        return () => subscription.unsubscribe();
    })
}

// operator function
const doubleOperatorFunc = multiply(2);

const ob = of(1, 2, 3);
doubleOperatorFunc(ob).subscribe(console.log);

of(1, 2, 3, 4, 5).pipe(doubleOperatorFunc).subscribe(console.log);

// rxjs operator
console.log('rxjs operator');
const doubleMap = map((n: number) => n * 2);
const eventFilter = filter((n: number) => n % 2 === 0)

of(1, 2, 3, 4).pipe(doubleMap, eventFilter).subscribe(console.log)
of(1, 2, 3, 4).pipe(eventFilter, doubleMap).subscribe(console.log);
