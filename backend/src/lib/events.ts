/**
 * Domain events system for narrative analytics
 * Allows decoupled event handling and integration with external systems
 */

export type DomainEventType =
  | 'content.created'
  | 'content.updated'
  | 'content.deleted'
  | 'analysis.completed'
  | 'analysis.failed'
  | 'engagement.recorded'
  | 'theme.detected'
  | 'insight.generated';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

export interface ContentCreatedEvent {
  contentId: string;
  communityId: string;
  sourceType: string;
  title: string;
}

export interface AnalysisCompletedEvent {
  analysisId: string;
  contentId: string;
  themes: string[];
  toneLabels: string[];
  archetypeLabels: string[];
}

export interface EngagementRecordedEvent {
  engagementId: string;
  contentId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to specific event type
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler) {
    this.globalHandlers.push(handler);
  }

  /**
   * Emit an event
   */
  async emit<T = any>(type: DomainEventType, data: T, metadata?: Record<string, any>) {
    const event: DomainEvent<T> = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      data,
      metadata,
    };

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(type) || [];
    for (const handler of typeHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${type}:`, error);
      }
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in global event handler:`, error);
      }
    }
  }

  /**
   * Remove all handlers for a specific event type
   */
  off(eventType: DomainEventType) {
    this.handlers.delete(eventType);
  }

  /**
   * Remove all handlers
   */
  clear() {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const eventBus = new EventBus();

// Setup default event handlers
eventBus.onAny((event) => {
  if (process.env.LOG_EVENTS === 'true') {
    console.log(`[EVENT] ${event.type}:`, event.data);
  }
});
