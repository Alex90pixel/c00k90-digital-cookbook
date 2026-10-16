import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { youtubeEmbedUrl, youtubeWatchUrl } from '../domain/video';

/**
 * A YouTube player that loads nothing from YouTube until the viewer presses play: first a cover
 * (the recipe's own photo) with a play button, then the privacy-enhanced YouTube player.
 */
@Component({
  selector: 'app-video-player',
  imports: [TranslatePipe],
  template: `
    <div class="player">
      @if (playing()) {
        <iframe
          [src]="embedUrl()"
          [title]="'detail.videoTitle' | t: { name: title() }"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      } @else {
        <button
          type="button"
          class="cover"
          [style.background-image]="posterUrl() ? 'url(' + posterUrl() + ')' : null"
          (click)="playing.set(true)"
        >
          <span class="play-icon" aria-hidden="true">▶</span>
          <span class="play-label">{{ 'detail.playVideo' | t }}</span>
        </button>
      }
    </div>
    <p class="video-note">
      {{ 'detail.videoNote' | t }}
      <a [href]="watchUrl()" target="_blank" rel="noopener noreferrer">{{
        'detail.watchOnYoutube' | t
      }}</a>
    </p>
  `,
  styles: `
    :host {
      display: block;
    }
    .player {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #000;
    }
    iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }
    .cover {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      border: 0;
      background: linear-gradient(135deg, var(--magenta-pale), var(--teal-pale)) center / cover;
      color: #fff;
      cursor: pointer;

      // Darkens the photo a little so the button stands out.
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        transition: background 0.2s;
      }
      &:hover::before,
      &:focus-visible::before {
        background: rgba(0, 0, 0, 0.2);
      }
      &:focus-visible {
        outline: 3px solid var(--teal);
        outline-offset: -3px;
      }
    }
    .play-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      padding-left: 6px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--magenta), var(--teal));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      font-size: 28px;
      transition: transform 0.2s;
    }
    .cover:hover .play-icon {
      transform: scale(1.08);
    }
    .play-label {
      position: relative;
      font-size: 15px;
      font-weight: 700;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }
    .video-note {
      margin: 8px 0 0;
      color: var(--text-light);
      font-size: 12px;

      a {
        color: var(--teal);
      }
    }
  `,
})
export class VideoPlayer {
  private readonly sanitizer = inject(DomSanitizer);

  /** Must be a validated 11-character YouTube id (see `youtubeVideoId`). */
  readonly videoId = input.required<string>();
  readonly title = input('');
  /** The recipe's own cover photo; nothing is loaded from YouTube before play. */
  readonly posterUrl = input<string | null>(null);

  protected readonly playing = signal(false);
  // Safe to trust: the address is built only from a validated video id.
  protected readonly embedUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl(this.videoId())),
  );
  protected readonly watchUrl = computed(() => youtubeWatchUrl(this.videoId()));
}
