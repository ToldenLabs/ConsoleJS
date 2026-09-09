/// <reference path="interfaces.ts" />

interface Task {
  readonly handler: EntryHandler;
  readonly entry: BaseLogEntry;
}

namespace Logging {
  export namespace scheduler {

    export abstract class BaseScheduler {
      abstract push(handler: EntryHandler, entry: BaseLogEntry): void;

      static isSupported(): boolean {
        return false;
      }
    }


    export class IdleBackgroundScheduler extends BaseScheduler {
      protected readonly queue: Task[] = [];
      protected isHandling = false;
      protected readonly timeout?: number;

      constructor(timeout?: number) {
        super();

        this.timeout = timeout;
        this.handle = this.handle.bind(this);
      }

      push(handler: EntryHandler, entry: BaseLogEntry): void {
        this.queue.push({ handler, entry });

        if (!this.isHandling) {
          this.startIdleProcessing();
        }
      }

      protected startIdleProcessing(): void {
        this.isHandling = true;

        if (this.timeout !== undefined) {
          requestIdleCallback(this.handle, {
            timeout: this.timeout
          });
        } else {
          requestIdleCallback(this.handle);
        }
      }

      protected handle(deadline: IdleDeadline): void {
        while (
          this.queue.length > 0 &&
          (deadline.timeRemaining() > 0 || deadline.didTimeout)
        ) {
          const task = this.queue.shift();

          if (!task) {
            break;
          }

          task.handler.handle(task.entry);
        }

        if (this.queue.length > 0) {
          this.startIdleProcessing();
        } else {
          this.isHandling = false;
        }
      }

      static isSupported(): boolean {
        return typeof requestIdleCallback === "function";
      }
    }


    export class BlockingScheduler extends BaseScheduler {
      protected readonly timeout: number;

      constructor(timeout = 0) {
        super();
        this.timeout = timeout;
      }

      push(handler: EntryHandler, entry: BaseLogEntry): void {
        if (this.timeout > 0) {
          setTimeout(() => {
            handler.handle(entry);
          }, this.timeout);
        } else {
          handler.handle(entry);
        }
      }

      static isSupported(): boolean {
        return true;
      }
    }


    export class PrioritizedTaskScheduler extends BaseScheduler {
      protected priority: TaskPriority;
      public readonly controller: TaskController;

      constructor(priority: TaskPriority = "background") {
        super();

        this.priority = priority;
        this.controller = new TaskController({
          priority
        });
      }

      push(handler: EntryHandler, entry: BaseLogEntry): void {
        scheduler.postTask(
          () => {
            handler.handle(entry);
          },
          {
            signal: this.controller.signal
          }
        );
      }

      abort(): void {
        this.controller.abort();
      }

      setPriority(priority: TaskPriority): void {
        this.priority = priority;
        this.controller.setPriority(priority);
      }

      static isSupported(): boolean {
        return (
          typeof scheduler !== "undefined" &&
          typeof TaskController !== "undefined"
        );
      }
    }

  }
}
