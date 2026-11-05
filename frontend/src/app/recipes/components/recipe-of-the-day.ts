import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { safeLocalStorage } from '../../core/storage/local-storage';
import { RecipeStore } from '../data/recipe.store';
import { totalMinutes } from '../domain/diets';
import { localDay, recipeOfTheDay } from '../domain/recipe-of-the-day';
import { cardImageUrl } from '../domain/recipe-images';
import { RecipeDialogs } from '../recipe-dialogs.service';

const HIDDEN_KEY = 'c00k90-recipe-of-day-hidden';

/** "Recipe of the day": one recipe from the user's cookbook, highlighted above the grid. */
@Component({
  selector: 'app-recipe-of-the-day',
  imports: [TranslatePipe],
  template: `
    @if (recipe(); as r) {
      <article class="rotd">
        <button type="button" class="open" (click)="dialogs.openDetail(r.id)">
          <span class="photo">
            @if (photo(); as url) {
              <img [src]="url" alt="" />
            } @else {
              <span class="placeholder" aria-hidden="true">{{ r.imageEmoji || '🍽️' }}</span>
            }
          </span>
          <span class="text">
            <span class="kicker">🌟 {{ 'recipeOfDay.kicker' | t }}</span>
            <span class="name">{{ r.name }}</span>
            @if (r.description) {
              <span class="desc">{{ r.description }}</span>
            }
            <span class="meta">
              <span class="category">{{ i18n.label('categories', r.category) }}</span>
              @if (minutes()) {
                <span>{{ 'card.minutes' | t: { count: minutes() } }}</span>
              }
              <span class="go">{{ 'recipeOfDay.open' | t }} →</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          class="hide"
          [attr.aria-label]="'recipeOfDay.hide' | t"
          [title]="'recipeOfDay.hide' | t"
          (click)="hideToday()"
        >
          ✕
        </button>
      </article>
    }
  `,
  styles: `
    .rotd {
      position: relative;
      margin-top: 20px;
    }
    .open {
      display: flex;
      align-items: stretch;
      width: 100%;
      padding: 0;
      overflow: hidden;
      border: 1.5px solid var(--border);
      border-radius: 20px;
      background: var(--card);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        border-color 0.15s,
        transform 0.15s;

      &:hover,
      &:focus-visible {
        border-color: var(--teal);
        transform: translateY(-2px);
        outline: none;
      }
    }
    .photo {
      flex: none;
      width: 200px;
      min-height: 150px;
      background: var(--teal-pale);
    }
    .photo img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder {
      display: grid;
      place-items: center;
      height: 100%;
      font-size: 54px;
    }
    .text {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      min-width: 0;
      padding: 18px 48px 18px 22px;
    }
    .kicker {
      color: var(--magenta-deep);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .name {
      color: var(--text-dark);
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }
    .desc {
      display: -webkit-box;
      overflow: hidden;
      color: var(--text-mid);
      font-size: 14px;
      line-height: 1.5;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 14px;
      margin-top: 4px;
      color: var(--text-mid);
      font-size: 13px;
    }
    .category {
      padding: 3px 10px;
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font-weight: 600;
    }
    .go {
      margin-left: auto;
      color: var(--teal);
      font-weight: 700;
    }
    .hide {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--text-light);
      cursor: pointer;

      &:hover {
        background: var(--teal-pale);
        color: var(--text-dark);
      }
    }
    @media (max-width: 560px) {
      .open {
        flex-direction: column;
      }
      .photo {
        width: 100%;
        height: 160px;
      }
      .text {
        padding: 14px 16px 16px;
      }
    }
  `,
})
export class RecipeOfTheDay {
  private readonly store = inject(RecipeStore);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly dialogs = inject(RecipeDialogs);

  private readonly today = localDay();
  /** "✕" hides it until tomorrow (only on this device). */
  private readonly hidden = signal(safeLocalStorage.get(HIDDEN_KEY) === this.today);

  protected readonly recipe = computed(() =>
    this.hidden()
      ? null
      : recipeOfTheDay(this.store.myRecipes(), this.today, this.auth.user()?.uid ?? ''),
  );
  protected readonly photo = computed(() => {
    const recipe = this.recipe();
    return recipe ? cardImageUrl(recipe) : null;
  });
  protected readonly minutes = computed(() => totalMinutes(this.recipe() ?? {}));

  protected hideToday(): void {
    safeLocalStorage.set(HIDDEN_KEY, this.today);
    this.hidden.set(true);
  }
}
