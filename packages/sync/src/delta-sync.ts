// Delta Sync Implementation
import type { DeltaPatch, SyncResult, Conflict, SyncConfig, Operation } from './types';

interface SyncState {
  pendingPatches: Map<string, DeltaPatch>;
  conflicts: Conflict[];
  lastSyncTime: number;
  syncInProgress: boolean;
}

type EventHandler = (event: any) => void;

export class DeltaSync {
  private config: SyncConfig;
  private state: SyncState;
  private eventHandlers: Map<string, Set<EventHandler>>;

  constructor(config: SyncConfig) {
    this.config = config;
    this.state = {
      pendingPatches: new Map(),
      conflicts: [],
      lastSyncTime: 0,
      syncInProgress: false,
    };
    this.eventHandlers = new Map();
  }

  /**
   * Records changes between two versions of an object as a delta patch
   * Following RFC 6902 JSON Patch format
   */
  recordChange(objectId: string, before: any, after: any): void {
    const operations = this.generateOperations(before, after, '');
    
    if (operations.length === 0) {
      return; // No changes to record
    }

    const patch: DeltaPatch = {
      id: objectId,
      timestamp: Date.now(),
      operations,
    };

    this.state.pendingPatches.set(objectId, patch);
  }

  /**
   * Generates JSON Patch operations by comparing before and after states
   */
  private generateOperations(before: any, after: any, path: string): Operation[] {
    const operations: Operation[] = [];

    // Handle null/undefined cases
    if (before === null || before === undefined) {
      if (after !== null && after !== undefined) {
        operations.push({ op: 'add', path: path || '/', value: after });
      }
      return operations;
    }

    if (after === null || after === undefined) {
      operations.push({ op: 'remove', path: path || '/' });
      return operations;
    }

    // Handle primitive types
    if (typeof before !== 'object' || typeof after !== 'object') {
      if (before !== after) {
        operations.push({ op: 'replace', path: path || '/', value: after });
      }
      return operations;
    }

    // Handle arrays
    if (Array.isArray(before) && Array.isArray(after)) {
      // Simple array comparison - replace if different
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        operations.push({ op: 'replace', path: path || '/', value: after });
      }
      return operations;
    }

    // Handle objects
    if (!Array.isArray(before) && !Array.isArray(after)) {
      const beforeKeys = new Set(Object.keys(before));
      const afterKeys = new Set(Object.keys(after));

      // Check for removed keys
      for (const key of beforeKeys) {
        if (!afterKeys.has(key)) {
          operations.push({ op: 'remove', path: `${path}/${key}` });
        }
      }

      // Check for added or modified keys
      for (const key of afterKeys) {
        const newPath = `${path}/${key}`;
        if (!beforeKeys.has(key)) {
          operations.push({ op: 'add', path: newPath, value: after[key] });
        } else {
          // Recursively check for changes
          const nestedOps = this.generateOperations(before[key], after[key], newPath);
          operations.push(...nestedOps);
        }
      }
    }

    return operations;
  }

  /**
   * Applies a delta patch to a base object
   */
  applyPatch(base: any, patch: DeltaPatch): any {
    let result = JSON.parse(JSON.stringify(base)); // Deep clone

    for (const operation of patch.operations) {
      result = this.applyOperation(result, operation);
    }

    return result;
  }

  /**
   * Applies a single operation to an object
   */
  private applyOperation(obj: any, operation: Operation): any {
    const pathParts = operation.path.split('/').filter(p => p !== '');

    if (operation.op === 'add' || operation.op === 'replace') {
      if (pathParts.length === 0) {
        return operation.value;
      }
      return this.setValueAtPath(obj, pathParts, operation.value);
    } else if (operation.op === 'remove') {
      if (pathParts.length === 0) {
        return undefined;
      }
      return this.removeValueAtPath(obj, pathParts);
    }

    return obj;
  }

  /**
   * Sets a value at a specific path in an object
   */
  private setValueAtPath(obj: any, pathParts: string[], value: any): any {
    if (pathParts.length === 0) {
      return value;
    }

    const result = JSON.parse(JSON.stringify(obj));
    let current = result;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[pathParts[pathParts.length - 1]] = value;
    return result;
  }

  /**
   * Removes a value at a specific path in an object
   */
  private removeValueAtPath(obj: any, pathParts: string[]): any {
    if (pathParts.length === 0) {
      return undefined;
    }

    const result = JSON.parse(JSON.stringify(obj));
    let current = result;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        return result; // Path doesn't exist, nothing to remove
      }
      current = current[part];
    }

    delete current[pathParts[pathParts.length - 1]];
    return result;
  }

  /**
   * Synchronizes pending changes with the server
   */
  async sync(): Promise<SyncResult> {
    if (this.state.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.state.syncInProgress = true;
    const startTime = Date.now();
    let synced = 0;
    let conflicts = 0;
    let bytesTransferred = 0;

    try {
      const patches = Array.from(this.state.pendingPatches.values());
      
      if (patches.length === 0) {
        const result: SyncResult = {
          success: true,
          synced: 0,
          conflicts: 0,
          bytesTransferred: 0,
          duration: Date.now() - startTime,
        };
        this.emit('sync-complete', result);
        return result;
      }

      // Process patches in batches
      for (let i = 0; i < patches.length; i += this.config.batchSize) {
        const batch = patches.slice(i, i + this.config.batchSize);
        const batchResult = await this.syncBatch(batch);
        
        synced += batchResult.synced;
        conflicts += batchResult.conflicts;
        bytesTransferred += batchResult.bytesTransferred;
      }

      this.state.lastSyncTime = Date.now();

      const result: SyncResult = {
        success: true,
        synced,
        conflicts,
        bytesTransferred,
        duration: Date.now() - startTime,
      };

      this.emit('sync-complete', result);
      return result;
    } catch (error) {
      const result: SyncResult = {
        success: false,
        synced,
        conflicts,
        bytesTransferred,
        duration: Date.now() - startTime,
      };
      return result;
    } finally {
      this.state.syncInProgress = false;
    }
  }

  /**
   * Synchronizes a batch of patches with retry logic
   */
  private async syncBatch(patches: DeltaPatch[]): Promise<{ synced: number; conflicts: number; bytesTransferred: number }> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.config.retryAttempts) {
      try {
        const response = await this.sendToServer(patches);
        
        // Handle conflicts
        if (response.conflicts && response.conflicts.length > 0) {
          for (const conflict of response.conflicts) {
            await this.handleConflict(conflict);
          }
        }

        // Remove successfully synced patches
        for (const patch of patches) {
          if (!response.conflicts?.some((c: Conflict) => c.objectId === patch.id)) {
            this.state.pendingPatches.delete(patch.id);
          }
        }

        return {
          synced: patches.length - (response.conflicts?.length || 0),
          conflicts: response.conflicts?.length || 0,
          bytesTransferred: response.bytesTransferred || 0,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Sync failed after retries');
  }

  /**
   * Sends patches to the server (mock implementation)
   */
  private async sendToServer(patches: DeltaPatch[]): Promise<{ conflicts?: Conflict[]; bytesTransferred: number }> {
    // Mock implementation - in real scenario, this would make an HTTP request
    const payload = JSON.stringify(patches);
    const bytesTransferred = new Blob([payload]).size;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));

    return {
      conflicts: [],
      bytesTransferred,
    };
  }

  /**
   * Handles a synchronization conflict
   */
  private async handleConflict(conflict: Conflict): Promise<void> {
    this.state.conflicts.push(conflict);

    switch (this.config.conflictResolution) {
      case 'server-wins':
        // Remove client patch, accept server version
        this.state.pendingPatches.delete(conflict.objectId);
        break;

      case 'client-wins':
        // Keep client patch, will retry sync
        break;

      case 'manual':
        // Emit event for manual resolution
        this.emit('conflict', conflict);
        break;
    }
  }

  /**
   * Manually resolves a conflict
   */
  async resolveConflict(conflict: Conflict): Promise<void> {
    const index = this.state.conflicts.findIndex(c => 
      c.objectId === conflict.objectId && c.timestamp === conflict.timestamp
    );

    if (index !== -1) {
      this.state.conflicts.splice(index, 1);
    }

    // Remove the pending patch for this object
    this.state.pendingPatches.delete(conflict.objectId);
  }

  /**
   * Returns all pending changes
   */
  getPendingChanges(): DeltaPatch[] {
    return Array.from(this.state.pendingPatches.values());
  }

  /**
   * Returns all unresolved conflicts
   */
  getConflicts(): Conflict[] {
    return [...this.state.conflicts];
  }

  /**
   * Registers an event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregisters an event handler
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emits an event to all registered handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
