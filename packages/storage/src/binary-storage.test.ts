import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import type { StorageMetadata } from './types';

describe('Binary Data Storage', () => {
  let manager: StorageManager;

  beforeEach(() => {
    manager = new StorageManager();
  });

  describe('Property 28: Binary data round-trips correctly', () => {
    // Feature: shadow-cache, Property 28: Binary data round-trips correctly
    it('should store and retrieve binary data without transformation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.uint8Array({ minLength: 0, maxLength: 1000 }),
          async (key, binaryData) => {
            const metadata: StorageMetadata = {
              size: binaryData.length,
              timestamp: Date.now(),
            };

            // Store the binary data as ArrayBuffer
            const arrayBuffer = binaryData.buffer.slice(
              binaryData.byteOffset,
              binaryData.byteOffset + binaryData.byteLength
            );

            await manager.set(key, arrayBuffer, metadata);

            // Retrieve and verify
            const result = await manager.get(key);
            expect(result).not.toBeNull();

            // Convert back to Uint8Array for comparison
            const retrievedData = new Uint8Array(result!.value);
            const originalData = new Uint8Array(arrayBuffer);

            // Verify length
            expect(retrievedData.length).toBe(originalData.length);

            // Verify content byte by byte
            for (let i = 0; i < originalData.length; i++) {
              expect(retrievedData[i]).toBe(originalData[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty binary data', async () => {
      const key = 'empty-binary';
      const emptyBuffer = new ArrayBuffer(0);
      const metadata: StorageMetadata = {
        size: 0,
        timestamp: Date.now(),
      };

      await manager.set(key, emptyBuffer, metadata);

      const result = await manager.get(key);
      expect(result).not.toBeNull();
      
      const retrievedBuffer = result!.value;
      expect(retrievedBuffer.byteLength).toBe(0);
    });

    it('should handle various binary data patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 500 }),
          async (key, byteArray) => {
            // Create binary data from byte array
            const uint8Array = new Uint8Array(byteArray);
            const arrayBuffer = uint8Array.buffer;

            const metadata: StorageMetadata = {
              size: arrayBuffer.byteLength,
              timestamp: Date.now(),
            };

            await manager.set(key, arrayBuffer, metadata);

            const result = await manager.get(key);
            expect(result).not.toBeNull();

            const retrieved = new Uint8Array(result!.value);
            expect(retrieved.length).toBe(uint8Array.length);

            // Verify all bytes match
            for (let i = 0; i < uint8Array.length; i++) {
              expect(retrieved[i]).toBe(uint8Array[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve binary data across different storage levels', async () => {
      const key = 'binary-test';
      const testData = new Uint8Array([0, 1, 2, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
      const arrayBuffer = testData.buffer;

      const metadata: StorageMetadata = {
        size: arrayBuffer.byteLength,
        timestamp: Date.now(),
      };

      const level = await manager.set(key, arrayBuffer, metadata);
      expect(['indexeddb', 'localstorage', 'memory']).toContain(level);

      const result = await manager.get(key);
      expect(result).not.toBeNull();

      const retrieved = new Uint8Array(result!.value);
      expect(retrieved.length).toBe(testData.length);

      for (let i = 0; i < testData.length; i++) {
        expect(retrieved[i]).toBe(testData[i]);
      }
    });

    it('should handle large binary data', async () => {
      const key = 'large-binary';
      const size = 10000;
      const largeData = new Uint8Array(size);
      
      // Fill with pattern
      for (let i = 0; i < size; i++) {
        largeData[i] = i % 256;
      }

      const arrayBuffer = largeData.buffer;
      const metadata: StorageMetadata = {
        size: arrayBuffer.byteLength,
        timestamp: Date.now(),
      };

      await manager.set(key, arrayBuffer, metadata);

      const result = await manager.get(key);
      expect(result).not.toBeNull();

      const retrieved = new Uint8Array(result!.value);
      expect(retrieved.length).toBe(largeData.length);

      // Spot check some values
      expect(retrieved[0]).toBe(0);
      expect(retrieved[255]).toBe(255);
      expect(retrieved[256]).toBe(0);
      expect(retrieved[size - 1]).toBe((size - 1) % 256);
    });
  });
});
