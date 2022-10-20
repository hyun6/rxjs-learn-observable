//import { Observable } from "rxjs";

interface Observer<T> {
  next: (value: T) => void;
  complete: () => void;
  error: (err: any) => void;
}

const fn_source = (subscriber: Observer<number>) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
};
fn_source({
  next: console.log,
  complete: () => console.log('fn complete'),
  error: console.log
});

// class Subscription {
//   private _descriptors: (() => void)[] = [];
// }

class SafeSubscriber<T> {
  private _closed = false;

  constructor(private _subscriber: Observer<T>, private _subscription: Subscription) {
    // 기본 소멸자로 closed = true 만들도록 설정
    _subscription.add(() => (this._closed = true));
  }

  next(value: T): void {
    if (this._closed) {
      return;
    }
    this._subscriber.next(value);
  }
  complete(): void {
    if (this._closed) {
      return;
    }
    this._subscriber.complete();
    this._subscription.unsubscribe();
  }
  error(err: any): void {
    if (this._closed) {
      return;
    }
    this._subscriber.error(err);
    this._subscription.unsubscribe();
  }
}

class Subscription {
  private _destructors: (() => void)[] = [];
  add(destructor: () => void) {
    this._destructors.push(destructor);
  }
  unsubscribe() {
    this._destructors.forEach((destructor) => destructor());
    this._destructors = [];
  }
}

class SafeObservable<T> {
  constructor(private _wrappedObserver: (subscriber: Observer<T>) => () => void) {}

  subscribe(observer: Observer<T>) {
    const subscription = new Subscription();
    const safeSubscriber = new SafeSubscriber(observer, subscription);
    subscription.add(this._wrappedObserver(safeSubscriber));

    return subscription;
  }
}

const safe_source = new SafeObservable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.error('gg');
  subscriber.complete();
  subscriber.next(4);

  return () => {
    console.log('unsubscribed');
  };
});

const subscription = safe_source.subscribe({
  next: console.log,
  complete: () => console.log('safe complete'),
  error: (err: any) => console.log('safe error: ', err)
});

// safeObservable(return () => {})에 명시한 소멸자 호출
subscription.unsubscribe();
