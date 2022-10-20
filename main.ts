import { Observable } from 'rxjs';

// using rxjs
const rx_source = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

console.log('start');
rx_source.subscribe({
  next: console.log,
  complete: () => console.log('rx complete')
});
console.log('end');

interface Observer<T> {
  next: (value: T) => void;
  complete: () => void;
  error: (err: any) => void;
}

// function impl observable
const fn_source = (subscriber: Observer<number>) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
};

fn_source({
  next: console.log,
  complete: () => console.log('fn complete'),
  error: (err: any) => console.log('fn error: ', err)
});

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

// complete safe observable
// - after complete prevent next
class SafeSubscriber<T> {
  private _closed = false;

  constructor(private _destination: Partial<Observer<T>>, private _subscription: Subscription) {
    _subscription.add(() => (this._closed = true));
  }

  next(value: T) {
    if (!this._closed) {
      this._destination.next?.(value);
    }
  }
  complete() {
    if (!this._closed) {
      this._destination.complete?.();
      this._subscription.unsubscribe();
    }
  }
  error(err: any) {
    if (!this._closed) {
      this._destination.error?.(err);
      this._subscription.unsubscribe();
    }
  }
}

class SafeObservable<T> {
  constructor(private _wrappedFunc: (subscriber: Observer<T>) => void) {}

  subscribe(observer: Partial<Observer<T>>) {
    const subscription = new Subscription();
    const safeSubscriber = new SafeSubscriber(observer, subscription);
    this._wrappedFunc(safeSubscriber);
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
});

safe_source.subscribe({
  next: console.log,
  complete: () => console.log('safe complete'),
  error: (err: any) => console.log('safe error: ', err)
});


const helloSocket = new Observable<string>((subscriber) => {
  const socket = new WebSocket('wss://echo.websocket.org');

  socket.onopen = () => {
    socket.send('Hello, World!');
  };

  socket.onmessage = (e) => {
    subscriber.next(e.data);
  };

  socket.onclose = (e) => {
    if (e.wasClean) {
      subscriber.complete();
    } else {
      subscriber.error(new Error('Socket closed dirty!'));
    }
  };

  return () => {
    if (socket.readyState <= WebSocket.OPEN) {
      socket.close();
    }
  };
});

const socketSubscription = helloSocket.subscribe({
  next: console.log,
  complete: () => console.log('server closed'),
  error: console.error
});

socketSubscription.unsubscribe();
