export interface DomainEvent<T = unknown> {
  name: string;
  occurredAt: Date;
  payload: T;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(eventName) || [];
    list.push(handler as EventHandler);
    this.handlers.set(eventName, list);
  }

  async publish<T>(eventName: string, payload: T): Promise<void> {
    const event: DomainEvent<T> = {
      name: eventName,
      occurredAt: new Date(),
      payload,
    };

    const listeners = this.handlers.get(eventName) || [];
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`[EventBus] Error in event listener for ${eventName}:`, err);
      }
    }
  }
}

export const eventBus = new EventBus();
