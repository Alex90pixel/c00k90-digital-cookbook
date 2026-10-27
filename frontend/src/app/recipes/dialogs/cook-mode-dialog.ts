import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CookModeData } from '../models/cook-mode.model';
import { Ingredient } from '../models/recipe.model';

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
        @if (isLast()) {
          <p class="cook-done">{{ 'cookMode.done' | t }}</p>
        }
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
          <button type="button" class="btn-save" (click)="ref.close()">
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

  private wakeLock: WakeLockSentinelLike | null = null;

  constructor() {
    void this.keepScreenOn();
    // The browser drops the lock when the tab is hidden; take it again when the cook comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void this.keepScreenOn();
    };
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisible);
      void this.wakeLock?.release().catch(() => undefined);
    });
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
