import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CollectionsService } from '../data/collections.service';
import { RecipeStore } from '../data/recipe.store';
import { CATEGORIES, DIETS, SORT_OPTIONS } from '../models/recipe.constants';
import { Category, DietId, RecipeSort } from '../models/recipe.model';

/** Category, diet and sort pickers above the recipe grid, plus the recipe count. */
@Component({
  selector: 'app-recipe-toolbar',
  imports: [TranslatePipe],
  template: `
    <div class="sort-row">
      <div class="filter-selects">
        @if (collections.lists().length) {
          <select [attr.aria-label]="'collections.label' | t" (change)="setCollection($event)">
            <option value="" [selected]="!store.collection()">{{ 'collections.all' | t }}</option>
            @for (list of collections.lists(); track list.id) {
              <option [value]="list.id" [selected]="store.collection() === list.id">
                📁 {{ list.name }}
              </option>
            }
          </select>
        }
        <select [attr.aria-label]="'categories.label' | t" (change)="setCategory($event)">
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

        <select [attr.aria-label]="'sort.label' | t" (change)="setSort($event)">
          @for (s of sortOptions; track s.id) {
            <option [value]="s.id" [selected]="store.sort() === s.id">{{ s.labelKey | t }}</option>
          }
        </select>
      </div>
      <span class="recipe-count" aria-live="polite">{{
        'list.count' | t: { count: count() }
      }}</span>
    </div>
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

  protected setSort(event: Event): void {
    this.store.sort.set(selectValue(event) as RecipeSort);
  }
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}
