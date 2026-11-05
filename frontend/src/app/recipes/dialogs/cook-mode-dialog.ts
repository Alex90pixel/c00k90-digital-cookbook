import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CookModeData } from '../models/cook-mode.model';
import { durationLabel, formatClock, stepDurations } from '../domain/step-timers';
import { Ingredient } from '../models/recipe.model';

/** A running kitchen timer. */
interface CookTimer {
  id: number;
  /** "3. 10 min": the step it came from and its length. */
  label: string;
  /** Milliseconds since epoch. */
  endsAt: number;
  rang: boolean;
}

/** A short "ding ding ding" (and a buzz on phones) when a timer is done. */
function ring(): void {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    [0, 0.45, 0.9].forEach((start) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.frequency.value = 880;
      volume.gain.setValueAtTime(0.0001, audio.currentTime + start);
      volume.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + 0.35);
      tone.connect(volume).connect(audio.destination);
      tone.start(audio.currentTime + start);
      tone.stop(audio.currentTime + start + 0.4);
    });
    setTimeout(() => void audio.close(), 2000);
  } catch {
    // No sound available: the timer still flashes on screen.
  }
}

/** The parts of the Screen Wake Lock API we use (not in every TypeScript DOM version). */
interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

/**
 * Cook mode: one step at a time in large text, with the ingredients one tap away. The screen
 * stays on while it is open (where the browser supports it), so floury hands don't have to.
 */
@Component({
  selector: 'app-cook-mode-dialog',
  imports: [TranslatePipe],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <div class="cook-mode" role="dialog" aria-labelledby="cook-title">
      <header>
        <h2 id="cook-title">👩‍🍳 {{ data.recipeName }}</h2>
        <button
          type="button"
          class="detail-close"
          [attr.aria-label]="'common.close' | t"
          (click)="ref.close()"
        >
          ✕
        </button>
      </header>

      @if (showIngredients()) {
        <ul class="cook-ingredients">
          @for (ingredient of data.ingredients; track $index) {
            <li>{{ line(ingredient) }}</li>
          }
        </ul>
      } @else {
        <p class="cook-progress">
          {{ 'cookMode.progress' | t: { current: index() + 1, total: total } }}
        </p>
        <p class="cook-step" aria-live="polite">{{ data.steps[index()] }}</p>
        @if (stepTimes().length) {
          <div class="timer-starts">
            @for (seconds of stepTimes(); track seconds) {
              <button type="button" class="timer-start" (click)="startTimer(seconds)">
                ⏲️ {{ 'cookMode.startTimer' | t: { time: label(seconds) } }}
              </button>
            }
          </div>
        }
        @if (isLast()) {
          <p class="cook-done">{{ 'cookMode.done' | t }}</p>
        }
      }

      @if (timers().length) {
        <ul class="timers" [attr.aria-label]="'cookMode.timers' | t">
          @for (timer of timers(); track timer.id) {
            @let left = remaining(timer);
            <li [class.ringing]="left <= 0">
              <span class="timer-name">⏲️ {{ timer.label }}</span>
              <span class="timer-clock" role="timer">
                {{ left > 0 ? clock(left) : ('cookMode.timeUp' | t) }}
              </span>
              <button
                type="button"
                class="timer-stop"
                [attr.aria-label]="'cookMode.stopTimer' | t"
                (click)="stopTimer(timer.id)"
              >
                ✕
              </button>
            </li>
          }
        </ul>
      }

      <div class="cook-bar">
        <button type="button" class="btn-action" (click)="showIngredients.set(!showIngredients())">
          {{ (showIngredients() ? 'cookMode.backToSteps' : 'cookMode.ingredients') | t }}
        </button>
        <span class="spacer"></span>
        <button type="button" class="btn-action" [disabled]="isFirst()" (click)="go(-1)">
          ← {{ 'cookMode.previous' | t }}
        </button>
        @if (isLast()) {
          <button type="button" class="btn-save" (click)="ref.close('cooked')">
            {{ 'cookMode.finish' | t }}
          </button>
        } @else {
          <button type="button" class="btn-save" (click)="go(1)">
            {{ 'cookMode.next' | t }} →
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .cook-mode {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: min(70vh, 640px);
      padding: 28px;
      border-radius: 20px;
      background: var(--card);
      box-shadow: var(--panel-shadow);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    h2 {
      margin: 0;
      color: var(--magenta-deep);
      font-family: 'Playfair Display', serif;
      font-size: 20px;
    }
    .cook-progress {
      margin: 0;
      color: var(--teal);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .cook-step {
      flex: 1;
      margin: 0;
      color: var(--text-dark);
      font-size: clamp(22px, 4vw, 32px);
      line-height: 1.45;
    }
    .cook-done {
      margin: 0;
      color: var(--teal);
      font-weight: 700;
    }
    .cook-ingredients {
      flex: 1;
      margin: 0;
      padding-left: 20px;
      color: var(--text-dark);
      font-size: 20px;
      line-height: 1.8;
    }
    .cook-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
    .spacer {
      flex: 1;
    }
    .timer-starts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .timer-start {
      padding: 8px 16px;
      border: 1.5px solid var(--teal);
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .timers {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .timers li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 6px 6px 14px;
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font-weight: 600;
    }
    .timers li.ringing {
      background: var(--magenta);
      color: #fff;
      animation: ring 0.8s ease-in-out infinite alternate;
    }
    .timer-clock {
      font-size: 18px;
      font-variant-numeric: tabular-nums;
    }
    .timer-stop {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
    @keyframes ring {
      to {
        transform: scale(1.05);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .timers li.ringing {
        animation: none;
      }
    }
  `,
})
export class CookModeDialog {
  protected readonly data = inject<CookModeData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);

  protected readonly total = this.data.steps.length;
  protected readonly index = signal(0);
  protected readonly showIngredients = signal(false);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() >= this.total - 1);
  protected readonly line = (ingredient: Ingredient) =>
    [ingredient.qty, ingredient.unit, ingredient.name].filter((part) => part?.trim()).join(' ');

  // Timers: started from the times found in the steps; they keep running between steps.
  protected readonly stepTimes = computed(() => stepDurations(this.data.steps[this.index()] ?? ''));
  protected readonly timers = signal<CookTimer[]>([]);
  private readonly now = signal(Date.now());
  private nextTimerId = 0;
  protected readonly label = durationLabel;
  protected readonly clock = formatClock;

  private wakeLock: WakeLockSentinelLike | null = null;

  constructor() {
    void this.keepScreenOn();
    // The browser drops the lock when the tab is hidden; take it again when the cook comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void this.keepScreenOn();
    };
    document.addEventListener('visibilitychange', onVisible);
    // One tick a second for the countdowns; it rings when a timer reaches zero.
    const tick = setInterval(() => {
      this.now.set(Date.now());
      for (const timer of this.timers()) {
        if (!timer.rang && this.remaining(timer) <= 0) {
          timer.rang = true;
          ring();
        }
      }
    }, 1000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      void this.wakeLock?.release().catch(() => undefined);
    });
  }

  protected startTimer(seconds: number): void {
    this.timers.update((list) => [
      ...list,
      {
        id: this.nextTimerId++,
        label: `${this.index() + 1}. ${durationLabel(seconds)}`,
        endsAt: Date.now() + seconds * 1000,
        rang: false,
      },
    ]);
    this.now.set(Date.now());
  }

  protected stopTimer(id: number): void {
    this.timers.update((list) => list.filter((t) => t.id !== id));
  }

  /** Seconds left (0 or less once it has rung). */
  protected remaining(timer: CookTimer): number {
    return (timer.endsAt - this.now()) / 1000;
  }

  protected go(step: number): void {
    this.showIngredients.set(false);
    this.index.update((i) => Math.min(this.total - 1, Math.max(0, i + step)));
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.go(1);
    if (event.key === 'ArrowLeft') this.go(-1);
  }

  private async keepScreenOn(): Promise<void> {
    try {
      this.wakeLock = (await (navigator as WakeLockNavigator).wakeLock?.request('screen')) ?? null;
    } catch {
      // Not supported or not allowed (e.g. battery saver): cook mode still works.
    }
  }
}
