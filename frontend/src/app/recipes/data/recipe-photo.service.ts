import { Injectable, inject } from '@angular/core';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { FIREBASE_STORAGE } from '../../core/firebase/firebase-storage.token';
import { resizeImage } from '../../core/images/image-processing';
import { RecipeImage } from '../models/recipe.model';

const PHOTO_MAX_SIZE = 1200;
const PHOTO_QUALITY = 0.82;
const THUMB_MAX_SIZE = 480;
const THUMB_QUALITY = 0.78;
/** Photo file names never change, so browsers may cache them for a year. */
const UPLOAD_METADATA = { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' };

/** Resizes, uploads and deletes recipe photos in Firebase Storage (`recipes/{userId}/...`). */
@Injectable({ providedIn: 'root' })
export class RecipePhotoService {
  private readonly storage = inject(FIREBASE_STORAGE);

  /** Shrinks a picked photo before upload (max 1200 px), so uploads stay small. */
  prepare(file: Blob): Promise<Blob> {
    return resizeImage(file, PHOTO_MAX_SIZE, PHOTO_QUALITY);
  }

  /** Uploads a prepared photo plus a 480 px thumbnail for the recipe cards. */
  async upload(userId: string, photo: Blob): Promise<RecipeImage> {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const path = `recipes/${userId}/${id}.jpg`;
    const thumbPath = `recipes/${userId}/${id}_thumb.jpg`;
    const thumb = await resizeImage(photo, THUMB_MAX_SIZE, THUMB_QUALITY);
    const [photoRef, thumbRef] = [ref(this.storage, path), ref(this.storage, thumbPath)];
    await Promise.all([
      uploadBytes(photoRef, photo, UPLOAD_METADATA),
      uploadBytes(thumbRef, thumb, UPLOAD_METADATA),
    ]);
    const [url, thumbUrl] = await Promise.all([getDownloadURL(photoRef), getDownloadURL(thumbRef)]);
    return { url, path, thumbUrl, thumbPath };
  }

  /** Deletes files in the background; a file that is already gone is not an error. */
  deleteInBackground(paths: readonly string[]): void {
    for (const path of paths) {
      deleteObject(ref(this.storage, path)).catch(() => undefined);
    }
  }

  /** Deletes every photo of a user (used when deleting the account). */
  async deleteAllOf(userId: string): Promise<void> {
    const folder = await listAll(ref(this.storage, `recipes/${userId}`));
    await Promise.all(folder.items.map((item) => deleteObject(item).catch(() => undefined)));
  }
}
