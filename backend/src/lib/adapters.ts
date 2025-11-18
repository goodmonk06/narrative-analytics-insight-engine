/**
 * Adapter interfaces for extensibility
 * These allow swapping implementations without changing core logic
 */

import { AnalysisResult } from '../services/aiAnalyzer';

/**
 * AI Analyzer adapter - allows pluggable LLM providers
 */
export interface IAnalyzerAdapter {
  analyzeNarrative(title: string, bodyMarkdown: string): Promise<AnalysisResult>;
  getModelInfo(): Record<string, any>;
}

/**
 * Notification adapter - for sending alerts/notifications
 */
export interface INotificationAdapter {
  send(params: NotificationParams): Promise<void>;
}

export interface NotificationParams {
  to: string;
  subject?: string;
  message: string;
  channel: 'email' | 'slack' | 'webhook' | 'sms';
  metadata?: Record<string, any>;
}

/**
 * Storage adapter - for alternative storage backends
 */
export interface IStorageAdapter {
  store(key: string, data: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

/**
 * Metrics adapter - for external metrics systems
 */
export interface IMetricsAdapter {
  counter(name: string, value: number, labels?: Record<string, string | number>): void;
  gauge(name: string, value: number, labels?: Record<string, string | number>): void;
  histogram(name: string, value: number, labels?: Record<string, string | number>): void;
}

/**
 * Cache adapter - for caching layer
 */
export interface ICacheAdapter {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Stub implementations

export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(params: NotificationParams): Promise<void> {
    console.log(`[NOTIFICATION:${params.channel}] To: ${params.to}`);
    console.log(`Subject: ${params.subject || 'N/A'}`);
    console.log(`Message: ${params.message}`);
  }
}

export class InMemoryStorageAdapter implements IStorageAdapter {
  private storage: Map<string, any> = new Map();

  async store(key: string, data: any): Promise<void> {
    this.storage.set(key, data);
  }

  async retrieve(key: string): Promise<any> {
    return this.storage.get(key);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.storage.keys());
    return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
  }
}

export class InMemoryCacheAdapter implements ICacheAdapter {
  private cache: Map<string, { value: any; expires?: number }> = new Map();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expires = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Adapter registry for dependency injection
 */
export class AdapterRegistry {
  private adapters: Map<string, any> = new Map();

  register<T>(name: string, adapter: T): void {
    this.adapters.set(name, adapter);
  }

  get<T>(name: string): T {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Adapter '${name}' not registered`);
    }
    return adapter as T;
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }
}

export const adapters = new AdapterRegistry();

// Register default adapters
adapters.register('notification', new ConsoleNotificationAdapter());
adapters.register('storage', new InMemoryStorageAdapter());
adapters.register('cache', new InMemoryCacheAdapter());
