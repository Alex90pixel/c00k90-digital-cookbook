import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AllergenDetectService } from '../data/allergen-detect.service';
import { RecipeStore } from '../data/recipe.store';
import { AllergenId } from '../models/recipe.model';

const BATCH_SIZE = 8;
const PAUSE_MS = 5_000;
const RETRY_PAUSE_MS = 30_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adds allergens to all of the user's recipes that don't have them yet (saved before allergens
 * existed), one recipe at a time with the AI. Needed once, so the "Free from" filter can show them.
 */
@Component({
  selector: 'app-allergen-batch-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="allergen-batch-title">
      <h2 id="allergen-batch-title">{{ 'allergenBatch.title' | t }}</h2>

      @if (!running() && !finished()) {
        <p>
          {{
            (pending().length ? 'allergenBatch.intro' : 'allergenBatch.nothing')
              | t: { count: pending().length }
          }}
        </p>
      }

      @if (running() || finished()) {
        <progress [max]="total()" [value]="done()"></progress>
        <p aria-live="polite">
          {{
            (finished() ? 'allergenBatch.finished' : 'allergenBatch.progress')
              | t: { done: done(), total: total() }
          }}
          @if (failed()) {
            <br />{{ 'allergenBatch.failed' | t: { count: failed() } }}
          }
        </p>
      }

      <p class="hint">{{ 'allergenBatch.note' | t }}</p>

      <div class="actions">
        @if (!finished() && pending().length) {
          <button type="button" class="btn-save" [disabled]="running()" (click)="start()">
            {{ (running() ? 'allergenBatch.running' : 'allergenBatch.start') | t }}
          </button>
        }
        <button type="button" class="btn-confirm-cancel" (click)="close()">
          {{ (running() ? 'allergenBatch.stop' : 'allergenBatch.close') | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    progress {
      width: 100%;
      height: 10px;
      accent-color: var(--teal);
    }
    .hint {
      color: var(--text-light);
      font-size: 12px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
  `,
})
export class AllergenBatchDialog {
  private readonly ref = inject(DialogRef);
  private readonly store = inject(RecipeStore);
  private readonly detector = inject(AllergenDetectService);

  /** My recipes without allergens yet that have ingredients to read. */
  protected readonly pending = computed(() =>
    this.store.myRecipes().filter((r) => !r.allergens && r.ingredients?.length),
  );
  protected readonly running = signal(false);
  protected readonly finished = signal(false);
  protected readonly total = signal(0);
  protected readonly done = signal(0);
  protected readonly failed = signal(0);
  private stopped = false;

  protected async start(): Promise<void> {
    const recipes = this.pending();
    this.total.set(recipes.length);
    this.running.set(true);
    // A few recipes per request, with pauses: the free AI tier allows few requests per minute.
    for (let start = 0; start < recipes.length && !this.stopped; start += BATCH_SIZE) {
      const batch = recipes.slice(start, start + BATCH_SIZE);
      const lines = batch.map((r) =>
        (r.ingredients ?? []).map((i) => [i.qty, i.unit, i.name].join(' ').trim()),
      );
      const results = await this.detectWithRetry(lines);
      for (const [i, recipe] of batch.entries()) {
        try {
          if (!results) throw new Error('No answer');
          await this.store.setAllergens(recipe.id, results[i]);
        } catch (error) {
          console.error('Allergen detection failed for', recipe.name, error);
          this.failed.update((n) => n + 1);
        }
        this.done.update((n) => n + 1);
      }
      if (start + BATCH_SIZE < recipes.length) await wait(PAUSE_MS);
    }
    this.running.set(false);
    this.finished.set(true);
  }

  /** One retry after a longer pause, for "too many requests" moments. */
  private async detectWithRetry(lines: string[][]): Promise<AllergenId[][] | null> {
    for (let attempt = 0; attempt < 2 && !this.stopped; attempt++) {
      try {
        return await this.detector.detectMany(lines);
      } catch (error) {
        console.warn('Allergen batch failed, attempt', attempt + 1, error);
        if (attempt === 0) await wait(RETRY_PAUSE_MS);
      }
    }
    return null;
  }

  protected close(): void {
    this.stopped = true;
    this.ref.close();
  }
}
