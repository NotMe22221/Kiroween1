import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DeltaSync } from './delta-sync';
import type { SyncConfig, Conflict, SyncResult } from './types';

// Default config for testing
const defaultConfig: SyncConfig = {
  endpoint: 'http://localhost:3000/sync',
  batchSize: 10,
  retryAttempts: 3,
  conflictResolution: 'server-wins',
};

// Arbitraries for generating test data
const simpleObjectArbitrary = fc.record({
  name: fc.string(),
  age: fc.integer({ min: 0, max: 120 }),
  active: fc.boolean(),
});

const nestedObjectArbitrary = fc.record({
  user: fc.record({
    name: fc.string(),
    email: fc.string(),
  }),
  settings: fc.record({
    theme: fc.constantFrom('light', 'dark'),
    notifications: fc.boolean(),
  }),
  count: fc.integer(),
});

describe('Delta Sync - Property Tests', () => {
  let deltaSync: DeltaSync;

  beforeEach(() => {
    deltaSync = new DeltaSync(defaultConfig);
  });

  describe('Property 17: Delta recording captures only changes', () => {
    // Feature: shadow-cache, Property 17: Delta recording captures only changes
    // Validates: Requirements 6.1, 6.2

    it('should not record changes when objects are identical', () => {
      fc.assert(
        fc.property(simpleObjectArbitrary, (obj) => {
          const before = JSON.parse(JSON.stringify(obj));
          const after = JSON.parse(JSON.stringify(obj));
          
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          expect(pending.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should record only changed fields in simple objects', () => {
      fc.assert(
        fc.property(
          simpleObjectArbitrary,
          fc.string(),
          (obj, newName) => {
            const before = JSON.parse(JSON.stringify(obj));
            const after = { ...before, name: newName };
            
            // Only test if name actually changed
            if (before.name === newName) {
              return true;
            }
            
            deltaSync.recordChange('test-id', before, after);
            const pending = deltaSync.getPendingChanges();
            
            expect(pending.length).toBe(1);
            const patch = pending[0];
            expect(patch.id).toBe('test-id');
            expect(patch.operations.length).toBeGreaterThan(0);
            
            // Should only have operations for the 'name' field
            const nameOps = patch.operations.filter(op => op.path.includes('name'));
            expect(nameOps.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record changes in nested objects', () => {
      fc.assert(
        fc.property(
          nestedObjectArbitrary,
          fc.string(),
          (obj, newEmail) => {
            const before = JSON.parse(JSON.stringify(obj));
            const after = JSON.parse(JSON.stringify(obj));
            after.user.email = newEmail;
            
            // Only test if email actually changed
            if (before.user.email === newEmail) {
              return true;
            }
            
            deltaSync.recordChange('test-id', before, after);
            const pending = deltaSync.getPendingChanges();
            
            expect(pending.length).toBe(1);
            const patch = pending[0];
            expect(patch.operations.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record field additions', () => {
      fc.assert(
        fc.property(
          simpleObjectArbitrary,
          fc.string(),
          (obj, newField) => {
            const before = JSON.parse(JSON.stringify(obj));
            const after = { ...before, newProp: newField };
            
            deltaSync.recordChange('test-id', before, after);
            const pending = deltaSync.getPendingChanges();
            
            expect(pending.length).toBe(1);
            const patch = pending[0];
            
            const addOps = patch.operations.filter(op => op.op === 'add' && op.path.includes('newProp'));
            expect(addOps.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record field removals', () => {
      fc.assert(
        fc.property(simpleObjectArbitrary, (obj) => {
          const before = JSON.parse(JSON.stringify(obj));
          const after = JSON.parse(JSON.stringify(obj));
          delete after.name;
          
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          expect(pending.length).toBe(1);
          const patch = pending[0];
          
          const removeOps = patch.operations.filter(op => op.op === 'remove' && op.path.includes('name'));
          expect(removeOps.length).toBeGreaterThan(0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should update existing patch for same object ID', () => {
      fc.assert(
        fc.property(
          simpleObjectArbitrary,
          fc.string(),
          fc.string(),
          (obj, newName1, newName2) => {
            const before = JSON.parse(JSON.stringify(obj));
            const intermediate = { ...before, name: newName1 };
            const after = { ...intermediate, name: newName2 };
            
            deltaSync.recordChange('test-id', before, intermediate);
            deltaSync.recordChange('test-id', intermediate, after);
            
            const pending = deltaSync.getPendingChanges();
            
            // Should only have one patch for the same ID
            expect(pending.length).toBe(1);
            expect(pending[0].id).toBe('test-id');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Patch application produces correct results', () => {
    // Feature: shadow-cache, Property 18: Patch application produces correct results
    // Validates: Requirements 6.3

    it('should apply patches to produce the expected result', () => {
      fc.assert(
        fc.property(simpleObjectArbitrary, simpleObjectArbitrary, (before, after) => {
          // Record the change to generate a patch
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          if (pending.length === 0) {
            // No changes, objects were identical
            expect(JSON.stringify(before)).toBe(JSON.stringify(after));
            return true;
          }
          
          const patch = pending[0];
          const result = deltaSync.applyPatch(before, patch);
          
          // Result should match the 'after' state
          expect(JSON.stringify(result)).toBe(JSON.stringify(after));
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should apply patches to nested objects correctly', () => {
      fc.assert(
        fc.property(nestedObjectArbitrary, nestedObjectArbitrary, (before, after) => {
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          if (pending.length === 0) {
            expect(JSON.stringify(before)).toBe(JSON.stringify(after));
            return true;
          }
          
          const patch = pending[0];
          const result = deltaSync.applyPatch(before, patch);
          
          expect(JSON.stringify(result)).toBe(JSON.stringify(after));
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle field additions via patch', () => {
      fc.assert(
        fc.property(
          simpleObjectArbitrary,
          fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !s.includes('/')),
          fc.string(),
          (obj, key, value) => {
            // Skip if key already exists in object
            if (key in obj) {
              return true;
            }
            
            const before = JSON.parse(JSON.stringify(obj));
            const after = { ...before, [key]: value };
            
            deltaSync.recordChange('test-id', before, after);
            const pending = deltaSync.getPendingChanges();
            
            if (pending.length === 0) {
              return true;
            }
            
            const patch = pending[0];
            const result = deltaSync.applyPatch(before, patch);
            
            expect(result[key]).toBe(value);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle field removals via patch', () => {
      fc.assert(
        fc.property(simpleObjectArbitrary, (obj) => {
          const before = JSON.parse(JSON.stringify(obj));
          const after = JSON.parse(JSON.stringify(obj));
          delete after.name;
          
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          const patch = pending[0];
          const result = deltaSync.applyPatch(before, patch);
          
          expect(result.name).toBeUndefined();
          expect(result.age).toBe(after.age);
          expect(result.active).toBe(after.active);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle field replacements via patch', () => {
      fc.assert(
        fc.property(
          simpleObjectArbitrary,
          fc.string(),
          (obj, newName) => {
            const before = JSON.parse(JSON.stringify(obj));
            const after = { ...before, name: newName };
            
            if (before.name === newName) {
              return true;
            }
            
            deltaSync.recordChange('test-id', before, after);
            const pending = deltaSync.getPendingChanges();
            
            const patch = pending[0];
            const result = deltaSync.applyPatch(before, patch);
            
            expect(result.name).toBe(newName);
            expect(result.age).toBe(before.age);
            expect(result.active).toBe(before.active);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce idempotent results when applying same patch multiple times', () => {
      fc.assert(
        fc.property(simpleObjectArbitrary, simpleObjectArbitrary, (before, after) => {
          deltaSync.recordChange('test-id', before, after);
          const pending = deltaSync.getPendingChanges();
          
          if (pending.length === 0) {
            return true;
          }
          
          const patch = pending[0];
          const result1 = deltaSync.applyPatch(before, patch);
          const result2 = deltaSync.applyPatch(before, patch);
          
          expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
 
 describe('Property 19: Conflicts invoke resolution strategy', () => {
    // Feature: shadow-cache, Property 19: Conflicts invoke resolution strategy
    // Validates: Requirements 6.4

    it('should invoke server-wins strategy for conflicts', async () => {
      const serverWinsSync = new DeltaSync({
        ...defaultConfig,
        conflictResolution: 'server-wins',
      });

      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const conflict: Conflict = {
            objectId: 'test-id',
            clientVersion: obj,
            serverVersion: { ...obj, name: 'server-version' },
            timestamp: Date.now(),
          };

          // Record a change to create a pending patch
          serverWinsSync.recordChange('test-id', obj, { ...obj, name: 'client-version' });
          const pendingBefore = serverWinsSync.getPendingChanges();
          expect(pendingBefore.length).toBe(1);

          // Handle the conflict
          await serverWinsSync['handleConflict'](conflict);

          // Server-wins should remove the client patch
          const pendingAfter = serverWinsSync.getPendingChanges();
          expect(pendingAfter.length).toBe(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should invoke client-wins strategy for conflicts', async () => {
      const clientWinsSync = new DeltaSync({
        ...defaultConfig,
        conflictResolution: 'client-wins',
      });

      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const conflict: Conflict = {
            objectId: 'test-id',
            clientVersion: obj,
            serverVersion: { ...obj, name: 'server-version' },
            timestamp: Date.now(),
          };

          // Record a change to create a pending patch
          clientWinsSync.recordChange('test-id', obj, { ...obj, name: 'client-version' });
          const pendingBefore = clientWinsSync.getPendingChanges();
          expect(pendingBefore.length).toBe(1);

          // Handle the conflict
          await clientWinsSync['handleConflict'](conflict);

          // Client-wins should keep the client patch
          const pendingAfter = clientWinsSync.getPendingChanges();
          expect(pendingAfter.length).toBe(1);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should emit conflict event for manual resolution strategy', async () => {
      const manualSync = new DeltaSync({
        ...defaultConfig,
        conflictResolution: 'manual',
      });

      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const conflict: Conflict = {
            objectId: 'test-id',
            clientVersion: obj,
            serverVersion: { ...obj, name: 'server-version' },
            timestamp: Date.now(),
          };

          let conflictEmitted = false;
          manualSync.on('conflict', (emittedConflict: Conflict) => {
            conflictEmitted = true;
            expect(emittedConflict.objectId).toBe(conflict.objectId);
          });

          // Handle the conflict
          await manualSync['handleConflict'](conflict);

          // Manual resolution should emit a conflict event
          expect(conflictEmitted).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow manual conflict resolution', async () => {
      const manualSync = new DeltaSync({
        ...defaultConfig,
        conflictResolution: 'manual',
      });

      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const conflict: Conflict = {
            objectId: 'test-id',
            clientVersion: obj,
            serverVersion: { ...obj, name: 'server-version' },
            timestamp: Date.now(),
          };

          // Add conflict to state
          await manualSync['handleConflict'](conflict);
          const conflictsBefore = manualSync.getConflicts();
          expect(conflictsBefore.length).toBeGreaterThan(0);

          // Manually resolve the conflict
          await manualSync.resolveConflict(conflict);

          // Conflict should be removed
          const conflictsAfter = manualSync.getConflicts();
          expect(conflictsAfter.length).toBe(conflictsBefore.length - 1);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 20: Successful sync emits complete event', () => {
    // Feature: shadow-cache, Property 20: Successful sync emits complete event
    // Validates: Requirements 6.5

    it('should emit sync-complete event with statistics on successful sync', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.array(simpleObjectArbitrary, { minLength: 1, maxLength: 5 }),
          async (objects) => {
            const syncInstance = new DeltaSync(defaultConfig);
            let eventEmitted = false;
            let emittedResult: SyncResult | null = null;

            syncInstance.on('sync-complete', (result: SyncResult) => {
              eventEmitted = true;
              emittedResult = result;
            });

            // Record some changes
            objects.forEach((obj, index) => {
              syncInstance.recordChange(`obj-${index}`, obj, { ...obj, name: `modified-${index}` });
            });

            // Perform sync
            const result = await syncInstance.sync();

            // Verify event was emitted
            expect(eventEmitted).toBe(true);
            expect(emittedResult).not.toBeNull();

            // Verify result structure
            expect(result.success).toBeDefined();
            expect(typeof result.success).toBe('boolean');
            expect(typeof result.synced).toBe('number');
            expect(typeof result.conflicts).toBe('number');
            expect(typeof result.bytesTransferred).toBe('number');
            expect(typeof result.duration).toBe('number');

            // Verify emitted result matches returned result
            expect(emittedResult).toEqual(result);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit sync-complete event even when no changes pending', async () => {
      fc.assert(
        await fc.asyncProperty(fc.constant(null), async () => {
          const syncInstance = new DeltaSync(defaultConfig);
          let eventEmitted = false;
          let emittedResult: SyncResult | null = null;

          syncInstance.on('sync-complete', (result: SyncResult) => {
            eventEmitted = true;
            emittedResult = result;
          });

          // Perform sync with no pending changes
          const result = await syncInstance.sync();

          // Verify event was emitted
          expect(eventEmitted).toBe(true);
          expect(emittedResult).not.toBeNull();

          // Verify result indicates no changes
          expect(result.success).toBe(true);
          expect(result.synced).toBe(0);
          expect(result.conflicts).toBe(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should include correct statistics in sync-complete event', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (numChanges) => {
            const syncInstance = new DeltaSync(defaultConfig);
            let emittedResult: SyncResult | null = null;

            syncInstance.on('sync-complete', (result: SyncResult) => {
              emittedResult = result;
            });

            // Record specific number of changes
            for (let i = 0; i < numChanges; i++) {
              syncInstance.recordChange(`obj-${i}`, { value: i }, { value: i + 1 });
            }

            // Perform sync
            await syncInstance.sync();

            // Verify statistics
            expect(emittedResult).not.toBeNull();
            expect(emittedResult!.synced).toBe(numChanges);
            expect(emittedResult!.bytesTransferred).toBeGreaterThan(0);
            expect(emittedResult!.duration).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow multiple event handlers for sync-complete', async () => {
      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const syncInstance = new DeltaSync(defaultConfig);
          let handler1Called = false;
          let handler2Called = false;

          syncInstance.on('sync-complete', () => {
            handler1Called = true;
          });

          syncInstance.on('sync-complete', () => {
            handler2Called = true;
          });

          // Record a change and sync
          syncInstance.recordChange('test-id', obj, { ...obj, name: 'modified' });
          await syncInstance.sync();

          // Both handlers should be called
          expect(handler1Called).toBe(true);
          expect(handler2Called).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow removing event handlers', async () => {
      fc.assert(
        await fc.asyncProperty(simpleObjectArbitrary, async (obj) => {
          const syncInstance = new DeltaSync(defaultConfig);
          let handlerCalled = false;

          const handler = () => {
            handlerCalled = true;
          };

          syncInstance.on('sync-complete', handler);
          syncInstance.off('sync-complete', handler);

          // Record a change and sync
          syncInstance.recordChange('test-id', obj, { ...obj, name: 'modified' });
          await syncInstance.sync();

          // Handler should not be called
          expect(handlerCalled).toBe(false);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
