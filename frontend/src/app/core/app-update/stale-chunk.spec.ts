import { isStaleChunkError } from './stale-chunk';

describe('isStaleChunkError', () => {
  it('recognizes a missing code file from an old version, in every browser', () => {
    expect(
      isStaleChunkError(
        new TypeError('Failed to fetch dynamically imported module: https://x/chunk-A.js'),
      ),
    ).toBe(true);
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module'))).toBe(
      true,
    );
  });

  it('leaves other errors alone', () => {
    expect(isStaleChunkError(new Error('Quota exceeded'))).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });
});
