// Analytics Hooks Implementation
import type { AnalyticsProvider, AnalyticsEvent } from './types';

export class AnalyticsHooks {
  private providers: Map<string, AnalyticsProvider> = new Map();
  private sampleRate: number = 1.0;

  constructor(sampleRate: number = 1.0) {
    this.sampleRate = Math.max(0, Math.min(1, sampleRate));
  }

  registerProvider(provider: AnalyticsProvider): void {
    if (!provider || !provider.name) {
      throw new Error('Provider must have a name');
    }
    if (typeof provider.track !== 'function') {
      throw new Error('Provider must implement track method');
    }
    this.providers.set(provider.name, provider);
  }

  unregisterProvider(name: string): void {
    this.providers.delete(name);
  }

  track(event: AnalyticsEvent): void {
    // Apply sampling
    if (this.sampleRate < 1.0 && Math.random() > this.sampleRate) {
      return;
    }

    // Validate event
    if (!event || !event.type || typeof event.timestamp !== 'number') {
      return;
    }

    // Dispatch to all registered providers
    for (const provider of this.providers.values()) {
      try {
        const result = provider.track(event);
        // Handle async providers
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Analytics provider ${provider.name} failed:`, error);
          });
        }
      } catch (error) {
        console.error(`Analytics provider ${provider.name} failed:`, error);
      }
    }
  }

  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }
}
