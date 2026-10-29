import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CollectionsService } from '../data/collections.service';
import { RecipeStore } from '../data/recipe.store';
import { TIME_LIMITS, TimeLimit } from '../domain/filters';
import { CATEGORIES, DIETS, SORT_OPTIONS } from '../models/recipe.constants';
import { Category, DietId, RecipeSort } from '../models/recipe.model';

/**
 * Collection, category, diet and sort pickers above the recipe grid, the recipe count, and
 * "More filters" (ingredients to include or leave out, time limit).
 */
@Component({
  selector: 'app-recipe-toolbar',
  imports: [TranslatePipe],
  template: `
    <div class="sort-row">
      <div class="filter-selects">
        @if (collections.lists().length) {
          <select
            name="collection"
            [attr.aria-label]="'collections.label' | t"
            (change)="setCollection($event)"
          >
            <option value="" [selected]="!store.collection()">{{ 'collections.all' | t }}</option>
            @for (list of collections.lists(); track list.id) {
              <option [value]="list.id" [selected]="store.collection() === list.id">
                📁 {{ list.name }}
              </option>
            }
          </select>
        }
        <select
          name="category"
          [attr.aria-label]="'categories.label' | t"
          (change)="setCategory($event)"
        >
          <option value="all" [selected]="store.category() === 'all'">
            {{ 'categories.all' | t }}
          </option>
          @for (c of categories; track c.id) {
            <option [value]="c.id" [selected]="store.category() === c.id">
              {{ c.emoji }} {{ i18n.label('categories', c.id) }}
            </option>
          }
        </select>
        <!-- The tooltip explains how the automatic diet labels are estimated. -->
        <select
          name="diet"
          [attr.aria-label]="'diets.label' | t"
          [title]="'diets.legend' | t"
          (change)="setDiet($event)"
        >
          <option value="" [selected]="!store.diet()">{{ 'diets.all' | t }}</option>
          @for (d of diets; track d.id) {
            <option [value]="d.id" [selected]="store.diet() === d.id">
              {{ i18n.label('diets', d.id) }}
            </option>
          }
        </select>

        <select name="sort" [attr.aria-label]="'sort.label' | t" (change)="setSort($event)">
          @for (s of sortOptions; track s.id) {
            <option [value]="s.id" [selected]="store.sort() === s.id">{{ s.labelKey | t }}</option>
          }
        </select>
        <button
          type="button"
          class="more-btn"
          [class.on]="moreOpen() || store.moreFiltersCount()"
          [attr.aria-expanded]="moreOpen()"
          aria-controls="more-filters"
          (click)="toggleMore()"
        >
          {{ 'filters.more' | t }}
          @if (store.moreFiltersCount()) {
            <span class="badge">{{ store.moreFiltersCount() }}</span>
          }
        </button>
      </div>
      <span class="recipe-count" aria-live="polite">{{
        'list.count' | t: { count: count() }
      }}</span>
    </div>
    @if (moreOpen()) {
      <div class="more-filters" id="more-filters">
        <label>
          <span>{{ 'filters.with' | t }}</span>
          <input
            name="with-ingredients"
            type="search"
            [placeholder]="'filters.withPlaceholder' | t"
            [value]="store.withIngredients()"
            (input)="store.withIngredients.set(inputValue($event))"
          />
        </label>
        <label>
          <span>{{ 'filters.without' | t }}</span>
          <input
            name="without-ingredients"
            type="search"
            [placeholder]="'filters.withoutPlaceholder' | t"
            [value]="store.withoutIngredients()"
            (input)="store.withoutIngredients.set(inputValue($event))"
          />
        </label>
        <label>
          <span>{{ 'filters.time' | t }}</span>
          <select name="time-limit" (change)="setTimeLimit($event)">
            <option value="" [selected]="!store.timeLimit()">{{ 'filters.anyTime' | t }}</option>
            @for (limit of timeLimits; track limit) {
              <option [value]="limit" [selected]="store.timeLimit() === limit">
                {{ 'filters.upTo' | t: { count: limit } }}
              </option>
            }
          </select>
        </label>
        @if (store.moreFiltersCount()) {
          <button type="button" class="clear-btn" (click)="store.clearMoreFilters()">
            {{ 'filters.clear' | t }}
          </button>
        }
      </div>
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
    .more-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1.5px dashed var(--border);
      border-radius: 50px;
      background: transparent;
      color: var(--text-mid);
      font-size: 13px;
      cursor: pointer;

      &.on {
        border-style: solid;
        border-color: var(--teal);
        color: var(--teal);
      }
    }
    .badge {
      min-width: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: var(--teal);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 18px;
      text-align: center;
    }
    .more-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px 14px;
      margin-top: 12px;
      padding: 12px 14px;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      background: var(--card);

      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--text-light);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      input {
        width: 190px;
        max-width: 100%;
        padding: 6px 12px;
        border: 1.5px solid var(--border);
        border-radius: 50px;
        outline: none;
        background: var(--card);
        color: var(--text-dark);
        font-size: 13px;

        &:focus-visible {
          border-color: var(--teal);
        }
      }
    }
    .clear-btn {
      padding: 6px 10px;
      border: 0;
      background: none;
      color: var(--teal);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    @media (max-width: 520px) {
      .more-filters label,
      .more-filters input {
        width: 100%;
      }
    }
    .recipe-count {
      color: var(--text-light);
      font-size: 13px;
    }
  `,
})
export class RecipeToolbar {
  protected readonly store = inject(RecipeStore);
  protected readonly collections = inject(CollectionsService);
  protected readonly i18n = inject(I18nService);
  protected readonly categories = CATEGORIES;
  protected readonly diets = DIETS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly timeLimits = TIME_LIMITS;
  /** Opens by itself when filters are already in use (e.g. after leaving the page). */
  protected readonly moreOpen = signal(this.store.moreFiltersCount() > 0);
  protected readonly count = computed(() => this.store.visible().length);

  protected setCategory(event: Event): void {
    this.store.category.set(selectValue(event) as Category | 'all');
  }

  protected setDiet(event: Event): void {
    this.store.diet.set((selectValue(event) as DietId) || null);
  }

  protected setCollection(event: Event): void {
    this.store.collection.set(selectValue(event) || null);
  }

  /** Opens "More filters"; closing it also clears them, so the list is back to how it was. */
  protected toggleMore(): void {
    if (this.moreOpen()) this.store.clearMoreFilters();
    this.moreOpen.set(!this.moreOpen());
  }

  protected setTimeLimit(event: Event): void {
    this.store.timeLimit.set((Number(selectValue(event)) as TimeLimit) || null);
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected setSort(event: Event): void {
    this.store.sort.set(selectValue(event) as RecipeSort);
  }
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}
