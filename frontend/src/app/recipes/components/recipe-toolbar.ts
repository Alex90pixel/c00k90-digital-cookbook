import { Component, computed, inject, signal } from '@angular/core';
import { RecipeStore } from '../data/recipe.store';
import { CATEGORIES, DIETS, SORT_OPTIONS } from '../models/recipe.constants';
import { Category, DietId, RecipeSort } from '../models/recipe.model';

/** Category, diet and sort pickers above the recipe grid, plus the recipe count. */
@Component({
  selector: 'app-recipe-toolbar',
  template: `
    <div class="sort-row">
      <div class="filter-selects">
        <select aria-label="Category" (change)="setCategory($event)">
          <option value="all" [selected]="store.category() === 'all'">All categories</option>
          @for (c of categories; track c.id) {
            <option [value]="c.id" [selected]="store.category() === c.id">
              {{ c.emoji }} {{ c.id }}
            </option>
          }
        </select>
        <select aria-label="Diet" (change)="setDiet($event)">
          <option value="" [selected]="!store.diet()">All diets</option>
          @for (d of diets; track d.id) {
            <option [value]="d.id" [selected]="store.diet() === d.id">{{ d.label }}</option>
          }
        </select>
        <button
          type="button"
          class="info-btn"
          aria-label="What do the diet labels mean?"
          [attr.aria-expanded]="legendOpen()"
          aria-controls="diet-legend"
          (click)="legendOpen.update((open) => !open)"
        >
          ℹ️
        </button>
        <select aria-label="Sort" (change)="setSort($event)">
          @for (s of sortOptions; track s.id) {
            <option [value]="s.id" [selected]="store.sort() === s.id">{{ s.label }}</option>
          }
        </select>
      </div>
      <span class="recipe-count" aria-live="polite"
        >{{ count() }} recipe{{ count() === 1 ? '' : 's' }}</span
      >
    </div>
    @if (legendOpen()) {
      <p class="diet-legend" id="diet-legend">
        💪 High protein ≥20g protein · 🥦 Low carb ≤20g carbs · 🫒 Low fat ≤10g fat · 🥑 Keto ≤10g
        carbs — per serving, estimated from recognized ingredients. ⚡ Quick = under 30 min total.
        Other labels are set by the recipe's author.
      </p>
    }
  `,
  styles: `
    .sort-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 14px;
    }
    .filter-selects {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    select {
      padding: 6px 12px;
      border: 1.5px solid var(--border);
      border-radius: 50px;
      outline: none;
      background: var(--card);
      color: var(--text-mid);
      font-size: 13px;
      cursor: pointer;

      &:focus-visible {
        border-color: var(--teal);
      }
    }
    .info-btn {
      width: 28px;
      height: 28px;
      border: 1.5px solid var(--border);
      border-radius: 50%;
      background: transparent;
      color: var(--text-light);
      font-size: 14px;
      cursor: pointer;
    }
    .recipe-count {
      color: var(--text-light);
      font-size: 13px;
    }
    .diet-legend {
      margin: 6px 0 0;
      color: var(--text-light);
      font-size: 11px;
      line-height: 1.5;
    }
  `,
})
export class RecipeToolbar {
  protected readonly store = inject(RecipeStore);
  protected readonly categories = CATEGORIES;
  protected readonly diets = DIETS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly legendOpen = signal(false);
  protected readonly count = computed(() => this.store.visible().length);

  protected setCategory(event: Event): void {
    this.store.category.set(selectValue(event) as Category | 'all');
  }

  protected setDiet(event: Event): void {
    this.store.diet.set((selectValue(event) as DietId) || null);
  }

  protected setSort(event: Event): void {
    this.store.sort.set(selectValue(event) as RecipeSort);
  }
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}
