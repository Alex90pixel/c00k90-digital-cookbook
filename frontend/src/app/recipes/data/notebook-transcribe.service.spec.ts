import { toRegion } from './notebook-transcribe.service';

describe('toRegion', () => {
  it('turns a 0–1000 box [ymin, xmin, ymax, xmax] into fractions', () => {
    expect(toRegion([100, 200, 600, 900])).toEqual({
      top: 0.1,
      left: 0.2,
      bottom: 0.6,
      right: 0.9,
    });
  });

  it('keeps the box inside the image', () => {
    expect(toRegion([-50, 0, 1200, 1000])).toEqual({ top: 0, left: 0, bottom: 1, right: 1 });
  });

  it('ignores missing, malformed or tiny boxes', () => {
    expect(toRegion(undefined)).toBeUndefined();
    expect(toRegion([1, 2, 3])).toBeUndefined();
    expect(toRegion([0, 0, 50, 500])).toBeUndefined();
  });
});
