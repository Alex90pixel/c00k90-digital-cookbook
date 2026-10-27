import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { MealPlanService } from '../data/meal-plan.service';
import { addDays, isoDate } from '../domain/meal-plan';

/** "Add to plan" from a recipe: pick one or more of the next 7 days. */
@Component({
  selector: 'app-add-to-plan-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="add-plan-title">
      <h2 id="add-plan-title">{{ 'mealPlan.addButton' | t }}</h2>
      <p>{{ 'mealPlan.addHint' | t }}</p>
      <div class="days">
        @for (day of days(); track day.date) {
          <button
            type="button"
            class="day"
            [class.on]="day.planned"
            [attr.aria-pressed]="day.planned"
            (click)="toggle(day.date, day.planned)"
          >
            <b>{{ day.weekday }}</b>
            <span>{{ day.label }}</span>
          </button>
        }
      </div>
      <div class="confirm-btns">
        <button type="button" class="btn-save" (click)="ref.close()">
          {{ 'common.done' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .days {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 8px;
      margin-bottom: 18px;
    }
    .day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 10px 6px;
      border: 1.5px solid var(--border);
      border-radius: 14px;
      background: none;
      color: var(--text-dark);
      font-size: 14px;
      cursor: pointer;
    }
    .day span {
      color: var(--text-light);
      font-size: 12px;
    }
    .day.on {
      border-color: var(--teal);
      background: var(--teal-pale);
    }
    .day.on b::before {
      content: '✓ ';
      color: var(--teal);
    }
  `,
})
export class AddToPlanDialog {
  private readonly recipeId = inject<string>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly plan = inject(MealPlanService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly days = computed(() => {
    this.plan.days();
    const weekday = new Intl.DateTimeFormat(this.i18n.language(), { weekday: 'short' });
    const label = new Intl.DateTimeFormat(this.i18n.language(), { day: 'numeric', month: 'short' });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), i);
      const iso = isoDate(date);
      return {
        date: iso,
        weekday: i === 0 ? this.i18n.t('mealPlan.today') : weekday.format(date),
        label: label.format(date),
        planned: this.plan.recipesOn(iso).includes(this.recipeId),
      };
    });
  });

  protected async toggle(date: string, planned: boolean): Promise<void> {
    try {
      if (planned) {
        await this.plan.remove(date, this.plan.recipesOn(date).indexOf(this.recipeId));
      } else {
        await this.plan.add(date, this.recipeId);
      }
    } catch (error) {
      console.error('Meal plan update failed', error);
      this.toast.show(this.i18n.t('mealPlan.failed'));
    }
  }
}
