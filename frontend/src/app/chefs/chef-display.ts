import { letterAvatar } from '../core/images/letter-avatar';
import { ChefProfile } from './chef.model';

/**
 * Chef profiles are written by their owners, so their photo URLs are untrusted: only photos from
 * Google accounts or our own Firebase Storage are shown, anything else becomes a letter avatar.
 */
const PHOTO_HOSTS = ['firebasestorage.googleapis.com', 'googleusercontent.com'];

export function chefAvatarUrl(chef: ChefProfile | null | undefined, fallbackName: string): string {
  const photo = chef?.photoUrl;
  if (photo && isAllowedPhoto(photo)) return photo;
  return letterAvatar(chef?.displayName || fallbackName);
}

function isAllowedPhoto(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === 'https:' && PHOTO_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}
