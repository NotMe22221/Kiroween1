// Sync Type Definitions
export interface SyncConfig {
  endpoint: string;
  batchSize: number;
  retryAttempts: number;
  conflictResolution: 'server-wins' | 'client-wins' | 'manual';
}

export interface DeltaPatch {
  id: string;
  timestamp: number;
  operations: Operation[];
}

export interface Operation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: any;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  bytesTransferred: number;
  duration: number;
}

export interface Conflict {
  objectId: string;
  clientVersion: any;
  serverVersion: any;
  timestamp: number;
}
