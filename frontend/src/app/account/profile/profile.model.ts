export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube';

/** The profile the user edits in "Profile". Empty strings mean "not filled in". */
export interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  /** Social links are stored as full profile URLs (see `normalizeSocialLink`). */
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  /** Chosen profile photo in Firebase Storage (`profiles/{userId}/...`); empty when none. */
  photoUrl: string;
  photoPath: string;
}

/** What happens to the profile photo when saving. */
export type PhotoChange = { kind: 'keep' } | { kind: 'replace'; file: Blob } | { kind: 'remove' };

/** A document in the Firestore `profiles` collection; the document id is the user id. */
export interface ProfileDocument extends UserProfile {
  /** Milliseconds since epoch. */
  updatedAt: number;
}

export const PROFILE_LIMITS = {
  displayName: 40,
  name: 50,
} as const;

export function emptyProfile(displayName = ''): UserProfile {
  return {
    displayName,
    firstName: '',
    lastName: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    photoUrl: '',
    photoPath: '',
  };
}
