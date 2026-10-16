import { TranslationKey } from '../../core/i18n/i18n.types';
import { SocialPlatform } from './profile.model';

export interface SocialPlatformInfo {
  id: SocialPlatform;
  label: string;
  icon: string;
  placeholderKey: TranslationKey;
  /** Sites accepted for this platform (subdomains like www. or m. are fine too). */
  hosts: readonly string[];
  /** Profile URL for a plain username. */
  profileUrl: (username: string) => string;
}

export const SOCIAL_PLATFORMS: readonly SocialPlatformInfo[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '📘',
    placeholderKey: 'profile.placeholders.facebook',
    hosts: ['facebook.com', 'fb.com'],
    profileUrl: (username) => `https://www.facebook.com/${username}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    placeholderKey: 'profile.placeholders.instagram',
    hosts: ['instagram.com'],
    profileUrl: (username) => `https://www.instagram.com/${username}`,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    placeholderKey: 'profile.placeholders.tiktok',
    hosts: ['tiktok.com'],
    profileUrl: (username) => `https://www.tiktok.com/@${username}`,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: '▶️',
    placeholderKey: 'profile.placeholders.youtube',
    hosts: ['youtube.com', 'youtu.be'],
    profileUrl: (username) => `https://www.youtube.com/@${username}`,
  },
];

const USERNAME = /^@?([A-Za-z0-9._-]{1,100})$/;

/**
 * Turns what the user typed into a profile URL:
 * - empty → empty (the field is optional)
 * - "yourname" or "@yourname" → the platform's profile URL
 * - a link to the right site, with or without "https://" → that link, as https
 * - anything else (another site, spaces, a bare domain) → `null`, meaning invalid
 */
export function normalizeSocialLink(platform: SocialPlatform, input: string): string | null {
  const value = input.trim();
  if (!value) return '';
  const info = SOCIAL_PLATFORMS.find((p) => p.id === platform)!;
  const lower = value.toLowerCase();
  // "jane.doe" is a username, but "youtube.com" or "instagram.com/jane" is a link.
  const looksLikeLink =
    value.includes('/') || info.hosts.some((h) => lower === h || lower.endsWith(`.${h}`));

  const username = looksLikeLink ? null : value.match(USERNAME);
  if (username) return info.profileUrl(username[1]);

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const onPlatform = info.hosts.some((h) => host === h || host.endsWith(`.${h}`));
  if (!onPlatform || url.pathname.length <= 1) return null;
  url.protocol = 'https:';
  return url.toString();
}
