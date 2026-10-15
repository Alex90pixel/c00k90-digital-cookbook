import { TestBed } from '@angular/core/testing';
import { ConsentService } from './consent.service';

describe('ConsentService', () => {
  beforeEach(() => localStorage.clear());

  it('shows the banner on the first visit', () => {
    expect(TestBed.inject(ConsentService).bannerOpen()).toBe(true);
  });

  it('remembers the choice for the next visit', () => {
    TestBed.inject(ConsentService).save({ analytics: true, ads: false });

    TestBed.resetTestingModule();
    const nextVisit = TestBed.inject(ConsentService);
    expect(nextVisit.bannerOpen()).toBe(false);
    expect(nextVisit.has('analytics')).toBe(true);
    expect(nextVisit.has('ads')).toBe(false);
  });

  it('asks again when the saved choice is older than 180 days', () => {
    const old = new Date(Date.now() - 181 * 86_400_000).toISOString();
    localStorage.setItem(
      'c00k90-consent',
      JSON.stringify({ version: 1, date: old, analytics: true, ads: true }),
    );
    expect(TestBed.inject(ConsentService).bannerOpen()).toBe(true);
  });
});
