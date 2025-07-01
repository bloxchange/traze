import type { EventType, EventData, EventCallback } from './types';
import { EVENTS } from './types';

export class EventEmitter {
  private events: Map<EventType, Set<EventCallback<EventData>>>;

  constructor() {
    this.events = new Map();
  }

  on<T extends EventData>(event: EventType, callback: EventCallback<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback as EventCallback<EventData>);
  }

  off<T extends EventData>(event: EventType, callback: EventCallback<T>): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback as EventCallback<EventData>);
    }
  }

  emit<T extends EventData>(event: EventType, data: T): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: EventType): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export const globalEventEmitter = new EventEmitter();
export const Events = EVENTS;