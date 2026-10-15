import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImportedRecipeInfo {
  title: string;
  author: string;
  thumbnail: string;
  sourceUrl: string;
}

export interface VideoPlatform {
  emoji: string;
  label: string;
  color: string;
}

/** Reads the title and author of a YouTube or TikTok link through our Cloud Function. */
@Injectable({ providedIn: 'root' })
export class RecipeImportService {
  private readonly http = inject(HttpClient);

  fetchInfo(url: string): Promise<ImportedRecipeInfo> {
    const params = new HttpParams().set('url', url);
    return firstValueFrom(
      this.http.get<ImportedRecipeInfo>(environment.importFunctionUrl, { params }),
    );
  }
}

export function isLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function videoPlatform(url: string): VideoPlatform | null {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { emoji: '▶️', label: 'From YouTube', color: '#FF0000' };
  }
  if (url.includes('tiktok.com')) {
    return { emoji: '🎵', label: 'From TikTok', color: '#111111' };
  }
  return null;
}
