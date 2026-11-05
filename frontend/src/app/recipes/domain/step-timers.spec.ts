import { durationLabel, formatClock, stepDurations } from './step-timers';

describe('stepDurations', () => {
  it('finds minutes, hours and seconds in several languages', () => {
    expect(stepDurations('Bake for 25 minutes until golden.')).toEqual([1500]);
    expect(stepDurations('Simmer 1 hour, then rest 10 min.')).toEqual([3600, 600]);
    expect(stepDurations('Fierbe 1 oră și 30 de minute')).toEqual([3600, 1800]);
    expect(stepDurations('Lasă 2 ore la frigider')).toEqual([7200]);
    expect(stepDurations('Cuire 45 minutes')).toEqual([2700]);
    expect(stepDurations('Backen 20 Minuten')).toEqual([1200]);
    expect(stepDurations('Mix for 30 seconds')).toEqual([30]);
  });

  it('uses the longer time of a range', () => {
    expect(stepDurations('Cook 10-15 minutes')).toEqual([900]);
    expect(stepDurations('Coace 20 - 25 min')).toEqual([1500]);
  });

  it('understands halves', () => {
    expect(stepDurations('Rest 1.5 hours')).toEqual([5400]);
    expect(stepDurations('Rest 1½ hours')).toEqual([5400]);
  });

  it('ignores steps without a time', () => {
    expect(stepDurations('Mix 200 g flour with 2 eggs')).toEqual([]);
  });
});

describe('timer labels', () => {
  it('formats the countdown and the button label', () => {
    expect(formatClock(725)).toBe('12:05');
    expect(formatClock(5400)).toBe('1:30:00');
    expect(durationLabel(5400)).toBe('1 h 30 min');
    expect(durationLabel(45)).toBe('45 s');
  });
});
