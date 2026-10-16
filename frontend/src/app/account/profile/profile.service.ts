import { Injectable, inject } from '@angular/core';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { ChefService } from '../../chefs/chef.service';
import { AuthService } from '../../core/auth/auth.service';
import { FIREBASE_STORAGE } from '../../core/firebase/firebase-storage.token';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import { cropToSquare } from '../../core/images/image-processing';
import { PhotoChange, ProfileDocument, UserProfile, emptyProfile } from './profile.model';

const PROFILES = 'profiles';
const PROFILE_FIELDS = Object.keys(emptyProfile()) as (keyof UserProfile)[];
const PHOTO_SIZE = 512;
const PHOTO_QUALITY = 0.85;
/** Every upload gets a new file name, so browsers may cache a photo for a year. */
const UPLOAD_METADATA = { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' };

/**
 * The user's profile, stored in Firestore at `profiles/{userId}`, with the photo in Storage at
 * `profiles/{userId}/`. Only the user can read or change them (the security rules must enforce
 * that). Name and photo are also saved on the Firebase account, which drives the avatar.
 *
 * While the user shares recipes, the public part (displayed name, photo, social links) is also
 * published as a chef profile, so other cooks can see and follow them.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly db = inject(FIRESTORE);
  private readonly storage = inject(FIREBASE_STORAGE);
  private readonly auth = inject(AuthService);
  private readonly chefs = inject(ChefService);

  /** The saved profile; for a new profile, starts from the account's name. */
  async load(): Promise<UserProfile> {
    const user = this.auth.requireUser();
    const snapshot = await getDoc(doc(this.db, PROFILES, user.uid));
    const saved = (snapshot.data() ?? {}) as Partial<ProfileDocument>;
    const profile = emptyProfile(user.displayName ?? '');
    for (const field of PROFILE_FIELDS) {
      const value = saved[field];
      if (typeof value === 'string') profile[field] = value;
    }
    return profile;
  }

  /** Squares and shrinks a picked photo (512 × 512), ready for preview and upload. */
  preparePhoto(file: Blob): Promise<Blob> {
    return cropToSquare(file, PHOTO_SIZE, PHOTO_QUALITY);
  }

  async save(profile: UserProfile, photo: PhotoChange): Promise<void> {
    const user = this.auth.requireUser();
    let { photoUrl, photoPath } = profile;
    if (photo.kind === 'replace') {
      ({ photoUrl, photoPath } = await this.upload(user.uid, photo.file));
    } else if (photo.kind === 'remove') {
      [photoUrl, photoPath] = ['', ''];
    }

    const document: ProfileDocument = { ...profile, photoUrl, photoPath, updatedAt: Date.now() };
    await setDoc(doc(this.db, PROFILES, user.uid), document);

    const nameChanged = profile.displayName !== (user.displayName ?? '');
    if (nameChanged || photo.kind !== 'keep') {
      await this.auth.updateAppearance({
        displayName: nameChanged ? profile.displayName : undefined,
        photoUrl: photo.kind === 'keep' ? undefined : photoUrl || null,
      });
    }
    if (profile.photoPath && profile.photoPath !== photoPath) {
      deleteObject(ref(this.storage, profile.photoPath)).catch(() => undefined);
    }
    // Keep the public chef profile in sync, if the user has one.
    try {
      if (await this.chefs.isPublished(user.uid)) await this.publishChefProfile(document);
    } catch (error) {
      console.error('Could not update the public chef profile', error);
    }
  }

  /**
   * Publishes (or refreshes) the public chef profile: displayed name, account photo and social
   * links. First and last name are never published.
   */
  async publishChefProfile(profile?: UserProfile): Promise<void> {
    const user = this.auth.requireUser();
    const source = profile ?? (await this.load().catch(() => emptyProfile(user.displayName ?? '')));
    await this.chefs.publish(user.uid, {
      displayName: source.displayName || user.displayName || '',
      photoUrl: user.photoURL ?? '',
      facebook: source.facebook,
      instagram: source.instagram,
      tiktok: source.tiktok,
      youtube: source.youtube,
    });
  }

  /** Deletes the photo and the profile (used when deleting the account). */
  async delete(userId: string): Promise<void> {
    try {
      const folder = await listAll(ref(this.storage, `${PROFILES}/${userId}`));
      await Promise.all(folder.items.map((item) => deleteObject(item).catch(() => undefined)));
    } catch (error) {
      // A missing photo must not block deleting the account.
      console.error('Could not delete the profile photo', error);
    }
    await deleteDoc(doc(this.db, PROFILES, userId));
  }

  private async upload(
    userId: string,
    photo: Blob,
  ): Promise<{ photoUrl: string; photoPath: string }> {
    const photoPath = `${PROFILES}/${userId}/avatar_${Date.now()}.jpg`;
    const photoRef = ref(this.storage, photoPath);
    await uploadBytes(photoRef, photo, UPLOAD_METADATA);
    return { photoUrl: await getDownloadURL(photoRef), photoPath };
  }
}
