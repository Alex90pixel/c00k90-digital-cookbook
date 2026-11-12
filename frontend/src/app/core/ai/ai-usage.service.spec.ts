import { AI_LIMITS, aiLimitHit } from './ai-usage.service';

describe('aiLimitHit', () => {
  const now = Date.UTC(2026, 10, 12, 12);

  it('lets normal use through', () => {
    expect(aiLimitHit([], now)).toBeNull();
    expect(aiLimitHit([now - 10_000, now - 20_000], now)).toBeNull();
  });

  it('stops too many requests in a minute, then lets them go again', () => {
    const burst = Array.from({ length: AI_LIMITS.perMinute }, (_, i) => now - i * 1000);
    expect(aiLimitHit(burst, now)).toBe('minute');
    expect(aiLimitHit(burst, now + 61_000)).toBeNull();
  });

  it('stops too many requests in a day', () => {
    const day = Array.from({ length: AI_LIMITS.perDay }, (_, i) => now - (i + 1) * 5 * 60_000);
    expect(aiLimitHit(day.slice(0, AI_LIMITS.perDay), now + 1)).toBe('day');
  });
});
