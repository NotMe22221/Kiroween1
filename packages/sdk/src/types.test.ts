import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property-based testing setup', () => {
  it('should verify fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify priority range validation', () => {
    const priorityArbitrary = fc.integer({ min: 1, max: 10 });
    
    fc.assert(
      fc.property(priorityArbitrary, (priority) => {
        return priority >= 1 && priority <= 10;
      }),
      { numRuns: 100 }
    );
  });
});
