// Predictor Type Definitions
export interface PredictiveConfig {
  enabled: boolean;
  learningRate: number;
  minConfidence: number;
  maxPrefetchSize: number;
  idleThreshold: number;
}

export interface NavigationPattern {
  sequence: string[];
  frequency: number;
  lastAccessed: number;
}

export interface PredictedResource {
  url: string;
  confidence: number;
  priority: number;
}
