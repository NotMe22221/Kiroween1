// Analytics Type Definitions
export interface AnalyticsConfig {
  providers: AnalyticsProvider[];
  sampleRate: number;
}

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): void | Promise<void>;
}

export interface AnalyticsEvent {
  type: 'cache-hit' | 'cache-miss' | 'sync-complete' | 'offline' | 'online';
  timestamp: number;
  data: Record<string, any>;
}
