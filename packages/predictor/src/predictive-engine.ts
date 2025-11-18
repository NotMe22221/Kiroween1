// Predictive Engine Implementation
import type { PredictedResource, PredictiveConfig, NavigationPattern } from './types';

interface PredictionModel {
  patterns: Map<string, NavigationPattern>;
  transitions: Map<string, Map<string, number>>;
  resourceGraph: Map<string, Set<string>>;
}

interface PrefetchQueueItem {
  url: string;
  priority: number;
  confidence: number;
}

export class PredictiveEngine {
  private config: PredictiveConfig;
  private model: PredictionModel;
  private navigationHistory: string[] = [];
  private prefetchQueue: PrefetchQueueItem[] = [];
  private isPrefetching: boolean = false;
  private idleCallback: number | null = null;
  private lastActivityTime: number = Date.now();

  constructor(config?: Partial<PredictiveConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      learningRate: config?.learningRate ?? 0.1,
      minConfidence: config?.minConfidence ?? 0.5,
      maxPrefetchSize: config?.maxPrefetchSize ?? 10 * 1024 * 1024, // 10MB
      idleThreshold: config?.idleThreshold ?? 2000, // 2 seconds
    };

    this.model = {
      patterns: new Map(),
      transitions: new Map(),
      resourceGraph: new Map(),
    };
  }

  recordNavigation(url: string): void {
    const timestamp = Date.now();
    this.lastActivityTime = timestamp;

    // Add to navigation history
    this.navigationHistory.push(url);

    // Update patterns
    this.updatePatterns(url, timestamp);

    // Update transitions (Markov chain)
    if (this.navigationHistory.length > 1) {
      const previousUrl = this.navigationHistory[this.navigationHistory.length - 2];
      this.updateTransitions(previousUrl, url);
    }

    // Keep history bounded (last 100 navigations)
    if (this.navigationHistory.length > 100) {
      this.navigationHistory.shift();
    }
  }

  private updatePatterns(url: string, timestamp: number): void {
    const existing = this.model.patterns.get(url);
    
    if (existing) {
      existing.frequency += 1;
      existing.lastAccessed = timestamp;
      existing.sequence.push(url);
      
      // Keep sequence bounded
      if (existing.sequence.length > 10) {
        existing.sequence.shift();
      }
    } else {
      this.model.patterns.set(url, {
        sequence: [url],
        frequency: 1,
        lastAccessed: timestamp,
      });
    }
  }

  private updateTransitions(fromUrl: string, toUrl: string): void {
    if (!this.model.transitions.has(fromUrl)) {
      this.model.transitions.set(fromUrl, new Map());
    }

    const transitions = this.model.transitions.get(fromUrl)!;
    const currentCount = transitions.get(toUrl) || 0;
    transitions.set(toUrl, currentCount + 1);
  }

  async analyzePatterns(): Promise<string[]> {
    const frequentUrls: Array<{ url: string; frequency: number }> = [];

    for (const [url, pattern] of this.model.patterns.entries()) {
      frequentUrls.push({ url, frequency: pattern.frequency });
    }

    // Sort by frequency descending
    frequentUrls.sort((a, b) => b.frequency - a.frequency);

    return frequentUrls.map(item => item.url);
  }

  async getPredictions(currentUrl: string): Promise<PredictedResource[]> {
    const predictions: PredictedResource[] = [];

    // Get transitions from current URL
    const transitions = this.model.transitions.get(currentUrl);
    if (!transitions) {
      return predictions;
    }

    // Calculate total transitions from this URL
    let totalTransitions = 0;
    for (const count of transitions.values()) {
      totalTransitions += count;
    }

    // Generate predictions with confidence scores
    for (const [nextUrl, count] of transitions.entries()) {
      const confidence = count / totalTransitions;

      if (confidence >= this.config.minConfidence) {
        // Calculate priority based on confidence and frequency
        const pattern = this.model.patterns.get(nextUrl);
        const frequency = pattern?.frequency || 1;
        const priority = Math.min(10, Math.ceil(confidence * 10 * Math.log10(frequency + 1)));

        predictions.push({
          url: nextUrl,
          confidence,
          priority: Math.max(1, priority),
        });
      }
    }

    // Sort by confidence descending
    predictions.sort((a, b) => b.confidence - a.confidence);

    return predictions;
  }

  startPrefetching(): void {
    if (!this.config.enabled || this.isPrefetching) {
      return;
    }

    this.isPrefetching = true;
    this.scheduleIdleCheck();
  }

  stopPrefetching(): void {
    this.isPrefetching = false;
    
    if (this.idleCallback !== null) {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(this.idleCallback);
      } else {
        clearTimeout(this.idleCallback);
      }
      this.idleCallback = null;
    }

    this.prefetchQueue = [];
  }

  private scheduleIdleCheck(): void {
    if (!this.isPrefetching) {
      return;
    }

    const checkIdle = () => {
      const now = Date.now();
      const idleTime = now - this.lastActivityTime;

      if (idleTime >= this.config.idleThreshold) {
        this.processPrefetchQueue();
      }

      // Schedule next check
      if (this.isPrefetching) {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          this.idleCallback = (window as any).requestIdleCallback(checkIdle);
        } else {
          this.idleCallback = setTimeout(checkIdle, 1000) as any;
        }
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      this.idleCallback = (window as any).requestIdleCallback(checkIdle);
    } else {
      this.idleCallback = setTimeout(checkIdle, 1000) as any;
    }
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchQueue.length === 0) {
      return;
    }

    // Sort queue by priority (highest first)
    this.prefetchQueue.sort((a, b) => b.priority - a.priority);

    // Process items in priority order
    const item = this.prefetchQueue.shift();
    if (item) {
      try {
        // In a real implementation, this would fetch the resource
        // For now, we just simulate the prefetch
        await this.prefetchResource(item.url);
      } catch (error) {
        // Log error but continue processing
        console.error(`Failed to prefetch ${item.url}:`, error);
      }
    }
  }

  private async prefetchResource(_url: string): Promise<void> {
    // Placeholder for actual prefetch implementation
    // This would integrate with the cache/storage system
    return Promise.resolve();
  }

  addToPrefetchQueue(url: string, priority: number, confidence: number): void {
    // Check if already in queue
    const existing = this.prefetchQueue.find(item => item.url === url);
    if (existing) {
      // Update priority if higher
      if (priority > existing.priority) {
        existing.priority = priority;
        existing.confidence = confidence;
      }
    } else {
      this.prefetchQueue.push({ url, priority, confidence });
    }
  }

  getPrefetchQueue(): PrefetchQueueItem[] {
    // Return copy sorted by priority
    return [...this.prefetchQueue].sort((a, b) => b.priority - a.priority);
  }

  recordResourceLink(parentUrl: string, linkedUrl: string): void {
    if (!this.model.resourceGraph.has(parentUrl)) {
      this.model.resourceGraph.set(parentUrl, new Set());
    }
    this.model.resourceGraph.get(parentUrl)!.add(linkedUrl);
  }

  getLinkedResources(url: string): string[] {
    const links = this.model.resourceGraph.get(url);
    return links ? Array.from(links) : [];
  }

  // Expose model for testing
  getModel(): PredictionModel {
    return this.model;
  }

  getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }
}
