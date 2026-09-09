```ts
interface DataCollector<T = unknown> {
  collect(): T;
}

interface Timestamp {
  readonly value: Date;
  readonly offset: number;
  readonly timestamp: number;
}

interface LogEntryMetadata<T = unknown> {
  readonly timestamp: Timestamp;
  readonly type: string;
  readonly environment: string;
  readonly data: T;
}

interface BaseLogEntry<T = unknown> {
  readonly type: string;
  readonly metadata: LogEntryMetadata<T>;

  getMessage(): string;
  toJSON(): unknown;
}

interface LogEntry<T = unknown> extends BaseLogEntry<T> {
  readonly arguments: readonly unknown[];
}

interface LogEventEntry<T = unknown> extends BaseLogEntry<T> {
  readonly event: ErrorEvent;
}

interface EntryHandler {
  handle(entry: BaseLogEntry): boolean;
}

interface EventLogger {
  handle(event: Event): boolean;
}
```
