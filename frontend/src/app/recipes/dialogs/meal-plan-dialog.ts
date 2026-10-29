import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { MealPlanService } from '../data/meal-plan.service';
import { RecipeStore } from '../data/recipe.store';
import {
  addDays,
  combineIngredients,
  fromIsoDate,
  isoDate,
  weekDates,
  weekStart,
} from '../domain/meal-plan';
import { Recipe } from '../models/recipe.model';
import { RecipeDialogs } from '../recipe-dialogs.service';

/**
 * The weekly meal planner: one row per day with the recipes planned for it, week by week, and
 * the shopping list for the whole week.
 */
@Component({
  selector: 'app-meal-plan-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="plan-title">
      <h2 id="plan-title">{{ 'mealPlan.title' | t }}</h2>

      <div class="week-nav">
        <button
          type="button"
          class="nav"
          [attr.aria-label]="'mealPlan.previousWeek' | t"
          (click)="moveWeek(-1)"
        >
          ‹
        </button>
        <span class="range">{{ range() }}</span>
        <button
          type="button"
          class="nav"
          [attr.aria-label]="'mealPlan.nextWeek' | t"
          (click)="moveWeek(1)"
        >
          ›
        </button>
        @if (!isThisWeek()) {
          <button type="button" class="link" (click)="monday.set(thisMonday)">
            {{ 'mealPlan.thisWeek' | t }}
          </button>
        }
      </div>

      @if (showList()) {
        <h3 class="section-heading">{{ 'mealPlan.shoppingTitle' | t }}</h3>
        @if (shoppingList().length) {
          <ul class="shopping">
            @for (line of shoppingList(); track $index) {
              <li>{{ line }}</li>
            }
          </ul>
          <div class="row-btns">
            <button type="button" class="btn-confirm-cancel" (click)="copyList()">
              {{ 'mealPlan.copy' | t }}
            </button>
            @if (canShare) {
              <button type="button" class="btn-confirm-cancel" (click)="shareList()">
                {{ 'mealPlan.share' | t }}
              </button>
            }
          </div>
        } @else {
          <p>{{ 'mealPlan.shoppingEmpty' | t }}</p>
        }
      } @else {
        <ul class="days">
          @for (day of days(); track day.date) {
            <li class="day" [class.today]="day.isToday">
              <div class="day-name">
                <b>{{ day.weekday }}</b>
                <span>{{ day.label }}</span>
              </div>
              <div class="day-recipes">
                @for (item of day.recipes; track $index) {
                  <span class="chip">
                    <button type="button" class="chip-open" (click)="open(item.id)">
                      {{ item.name }}
                    </button>
                    <button
                      type="button"
                      class="chip-remove"
                      [attr.aria-label]="'mealPlan.remove' | t: { name: item.name }"
                      (click)="remove(day.date, $index)"
                    >
                      ✕
                    </button>
                  </span>
                }
                <select
                  name="add-recipe"
                  class="add"
                  [attr.aria-label]="'mealPlan.addTo' | t: { day: day.weekday }"
                  (change)="add(day.date, $event)"
                >
                  <option value="" selected>{{ 'mealPlan.add' | t }}</option>
                  <optgroup [label]="'mealPlan.myRecipes' | t">
                    @for (recipe of myRecipes(); track recipe.id) {
                      <option [value]="recipe.id">{{ recipe.name }}</option>
                    }
                  </optgroup>
                  @if (favoriteRecipes().length) {
                    <optgroup [label]="'mealPlan.favorites' | t">
                      @for (recipe of favoriteRecipes(); track recipe.id) {
                        <option [value]="recipe.id">{{ recipe.name }}</option>
                      }
                    </optgroup>
                  }
                </select>
              </div>
            </li>
          }
        </ul>
      }

      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="showList.set(!showList())">
          {{ (showList() ? 'mealPlan.backToWeek' : 'mealPlan.shoppingButton') | t }}
        </button>
        <button type="button" class="btn-save" (click)="ref.close()">
          {{ 'common.done' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .week-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .nav {
      width: 34px;
      height: 34px;
      border: 1.5px solid var(--border);
      border-radius: 50%;
      background: none;
      color: var(--text-dark);
      font-size: 18px;
      cursor: pointer;
    }
    .range {
      min-width: 150px;
      color: var(--text-dark);
      font-weight: 700;
      text-align: center;
    }
    .link {
      border: 0;
      background: none;
      color: var(--teal);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .days {
      max-height: 55vh;
      margin: 0 0 16px;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .day {
      display: grid;
      grid-template-columns: 92px 1fr;
      gap: 10px;
      align-items: start;
      padding: 10px 4px;
      border-bottom: 1px solid var(--border);
    }
    .day.today {
      border-radius: 10px;
      background: var(--teal-pale);
    }
    .day-name {
      display: flex;
      flex-direction: column;
      color: var(--text-dark);
      font-size: 14px;
    }
    .day-name span {
      color: var(--text-light);
      font-size: 12px;
    }
    .day-recipes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 4px 3px 10px;
      border-radius: 50px;
      background: var(--magenta-pale);
    }
    .chip-open {
      padding: 0;
      border: 0;
      background: none;
      color: var(--magenta-deep);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .chip-remove {
      padding: 0 4px;
      border: 0;
      background: none;
      color: var(--magenta-deep);
      font-size: 11px;
      opacity: 0.7;
      cursor: pointer;
    }
    .add {
      max-width: 150px;
      padding: 4px 10px;
      border: 1.5px dashed var(--border);
      border-radius: 50px;
      background: transparent;
      color: var(--text-mid);
      font-size: 12px;
      cursor: pointer;
    }
    .shopping {
      max-height: 45vh;
      margin: 0 0 12px;
      padding-left: 20px;
      overflow-y: auto;
      color: var(--text-dark);
      line-height: 1.8;
    }
    .row-btns {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) {
      .day {
        grid-template-columns: 1fr;
        gap: 6px;
      }
      .day-name {
        flex-direction: row;
        gap: 8px;
        align-items: baseline;
      }
    }
  `,
})
export class MealPlanDialog {
  protected readonly ref = inject(DialogRef);
  private readonly plan = inject(MealPlanService);
  private readonly store = inject(RecipeStore);
  private readonly recipeDialogs = inject(RecipeDialogs);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly thisMonday = weekStart(new Date());
  protected readonly monday = signal(this.thisMonday);
  protected readonly showList = signal(false);
  protected readonly canShare = typeof navigator !== 'undefined' && !!navigator.share;

  protected readonly isThisWeek = computed(
    () => isoDate(this.monday()) === isoDate(this.thisMonday),
  );
  private readonly dates = computed(() => weekDates(this.monday()));

  protected readonly range = computed(() => {
    const format = new Intl.DateTimeFormat(this.i18n.language(), {
      day: 'numeric',
      month: 'short',
    });
    return `${format.format(this.monday())} – ${format.format(addDays(this.monday(), 6))}`;
  });

  protected readonly days = computed(() => {
    const today = isoDate(new Date());
    const weekday = new Intl.DateTimeFormat(this.i18n.language(), { weekday: 'long' });
    const label = new Intl.DateTimeFormat(this.i18n.language(), { day: 'numeric', month: 'short' });
    return this.dates().map((date) => ({
      date,
      isToday: date === today,
      weekday: capitalize(weekday.format(fromIsoDate(date))),
      label: label.format(fromIsoDate(date)),
      recipes: this.recipesOn(date).map((recipe, i) => ({
        id: recipe?.id ?? this.plan.recipesOn(date)[i],
        name: recipe?.name ?? this.i18n.t('mealPlan.unavailable'),
      })),
    }));
  });

  protected readonly myRecipes = computed(() =>
    [...this.store.myRecipes()].sort((a, b) => a.name.localeCompare(b.name)),
  );
  protected readonly favoriteRecipes = computed(() =>
    this.store
      .sharedRecipes()
      .filter((recipe) => this.store.isFavorite(recipe))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly shoppingList = computed(() =>
    combineIngredients(
      this.dates()
        .flatMap((date) => this.recipesOn(date))
        .map((recipe) => recipe?.ingredients ?? []),
    ),
  );

  constructor() {
    // Favorites are other cooks' recipes, loaded with "Get Inspired".
    if (!this.store.sharedRecipes().length) void this.store.loadShared();
  }

  protected moveWeek(weeks: number): void {
    this.monday.set(addDays(this.monday(), weeks * 7));
  }

  protected open(recipeId: string): void {
    if (this.store.findById(recipeId)) void this.recipeDialogs.openDetail(recipeId);
  }

  protected async add(date: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const recipeId = select.value;
    select.value = '';
    if (recipeId) await this.run(() => this.plan.add(date, recipeId));
  }

  protected async remove(date: string, index: number): Promise<void> {
    await this.run(() => this.plan.remove(date, index));
  }

  protected async copyList(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.listText());
      this.toast.show(this.i18n.t('mealPlan.copied'));
    } catch {
      this.toast.show(this.i18n.t('mealPlan.copyFailed'));
    }
  }

  protected async shareList(): Promise<void> {
    try {
      await navigator.share({
        title: this.i18n.t('mealPlan.shoppingTitle'),
        text: this.listText(),
      });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  private recipesOn(date: string): (Recipe | undefined)[] {
    return this.plan.recipesOn(date).map((id) => this.store.findById(id));
  }

  private listText(): string {
    return `${this.i18n.t('mealPlan.shoppingTitle')} (${this.range()})\n${this.shoppingList()
      .map((line) => `• ${line}`)
      .join('\n')}`;
  }

  private async run(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      console.error('Meal plan update failed', error);
      this.toast.show(this.i18n.t('mealPlan.failed'));
    }
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
