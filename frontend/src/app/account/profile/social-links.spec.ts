import { normalizeSocialLink } from './social-links';

describe('normalizeSocialLink', () => {
  it('keeps empty fields empty', () => {
    expect(normalizeSocialLink('instagram', '   ')).toBe('');
  });

  it('turns a username into the profile URL of each platform', () => {
    expect(normalizeSocialLink('facebook', 'jane.doe')).toBe('https://www.facebook.com/jane.doe');
    expect(normalizeSocialLink('instagram', '@jane_cooks')).toBe(
      'https://www.instagram.com/jane_cooks',
    );
    expect(normalizeSocialLink('tiktok', 'janecooks')).toBe('https://www.tiktok.com/@janecooks');
    expect(normalizeSocialLink('youtube', '@JaneCooks')).toBe('https://www.youtube.com/@JaneCooks');
  });

  it('accepts links to the right site, with or without https://', () => {
    expect(normalizeSocialLink('tiktok', 'https://www.tiktok.com/@janecooks')).toBe(
      'https://www.tiktok.com/@janecooks',
    );
    expect(normalizeSocialLink('instagram', 'instagram.com/jane_cooks/')).toBe(
      'https://instagram.com/jane_cooks/',
    );
    expect(normalizeSocialLink('facebook', 'http://m.facebook.com/jane')).toBe(
      'https://m.facebook.com/jane',
    );
  });

  it('rejects other sites, look-alike domains and bare domains', () => {
    expect(normalizeSocialLink('instagram', 'https://evil.com/jane')).toBeNull();
    expect(normalizeSocialLink('instagram', 'https://instagram.com.evil.com/jane')).toBeNull();
    expect(normalizeSocialLink('youtube', 'youtube.com')).toBeNull();
    expect(normalizeSocialLink('facebook', 'jane doe')).toBeNull();
  });
});
