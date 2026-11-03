import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeStore } from '../../recipes/data/recipe.store';
import { RecipeDialogs } from '../../recipes/recipe-dialogs.service';
import { AppDialog } from '../../shared/dialog/app-dialog.service';
import { Spotlight } from '../../shared/ui/spotlight.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ChefHat } from './chef-hat';

interface GuideCard {
  id: string;
  emoji: string;
  /** Icons of the tiles (their labels are `guide.<id>.t1`, `t2`…); none for a text card. */
  tiles?: readonly string[];
}

const CARDS: readonly GuideCard[] = [
  { id: 'welcome', emoji: '👋' },
  { id: 'start', emoji: '✍️', tiles: ['🍳', '📷', '🔗', '🔎', '🌾', '🎲'] },
  { id: 'cook', emoji: '👩‍🍳', tiles: ['🍽️', '📱', '🛒', '🗓️', '📁', '🥕'] },
  { id: 'yours', emoji: '💛', tiles: ['🌍', '❤️', '👨‍🍳', '📄', '⚠️', '🎨'] },
  { id: 'again', emoji: '' },
];

/** Where the arrow points after a tile opens its place (CSS selectors). */
const SPOTLIGHT: Record<string, string> = {
  'start.0': '#ingredients-paste',
  'start.1': '.notebook-import',
  'start.2': '#recipe-source',
  'start.3': '.search-bar',
  'start.4': '.free-from',
  'start.5': '.shuffle',
  'cook.0': '.detail-meta-item.servings',
  'cook.1': '.cook-mode-btn',
  'cook.2': '.shopping-btn:not(.metric-btn)',
  'yours.0': '.nav-btn.active',
  'yours.1': '.nav-btn.active',
  'yours.2': '.nav-btn.active',
  'yours.5': '.settings-row',
};

/** A short tip shown under the highlighted place (`guide.tips.<name>`). */
const TIPS: Record<string, string> = {
  'start.0': 'paste',
  'start.2': 'link',
  'cook.0': 'servings',
  'yours.0': 'inspired',
  'yours.1': 'favorites',
  'yours.2': 'chefs',
};

/** The card to reopen at after a tile took the user somewhere ("back to the guide"). */
let resumeAt = 0;

/**
 * "How to use C00K90": a short illustrated tour, one card at a time. It opens by itself the
 * first time, and again from the chef's hat on the avatar.
 */
@Component({
  selector: 'app-guide-dialog',
  imports: [TranslatePipe, ChefHat],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    @let card = current();
    <div class="guide" role="dialog" aria-labelledby="guide-title" aria-live="polite">
      <button type="button" class="skip" (click)="finish()">
        {{ (isLast() ? 'common.close' : 'guide.skip') | t }}
      </button>

      <div class="picture" aria-hidden="true">
        @if (card.id === 'again') {
          <span class="mini-avatar">🙂<app-chef-hat class="mini-hat" /></span>
        } @else {
          {{ card.emoji }}
        }
      </div>

      <p class="step">{{ 'guide.step' | t: { current: index() + 1, total: total } }}</p>
      <h2 id="guide-title">{{ key(card, 'title') | t }}</h2>
      @if (card.tiles; as tiles) {
        <ul class="tiles">
          @for (icon of tiles; track $index) {
            <li>
              <button type="button" (click)="goTo(card.id, $index)">
                <span class="tile-icon" aria-hidden="true">{{ icon }}</span>
                <span class="tile-label">{{ key(card, 't' + ($index + 1)) | t }}</span>
                <span class="tile-go" aria-hidden="true">→</span>
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="text">{{ key(card, 'text') | t }}</p>
      }

      <div class="dots" aria-hidden="true">
        @for (c of cards; track c.id; let i = $index) {
          <button
            type="button"
            tabindex="-1"
            [class.on]="i === index()"
            (click)="index.set(i)"
          ></button>
        }
      </div>

      <div class="nav">
        <button
          type="button"
          class="btn-confirm-cancel"
          [disabled]="index() === 0"
          (click)="go(-1)"
        >
          {{ 'guide.back' | t }}
        </button>
        @if (isLast()) {
          <button type="button" class="btn-save" (click)="finish()">
            {{ 'guide.done' | t }}
          </button>
        } @else {
          <button type="button" class="btn-save" (click)="go(1)">{{ 'guide.next' | t }}</button>
        }
      </div>
    </div>
  `,
  styles: `
    /* Its own card, so the text never sits on top of the page behind. */
    .guide {
      position: relative;
      padding: 28px 24px 22px;
      border-radius: 20px;
      background: var(--card);
      box-shadow: var(--panel-shadow);
      text-align: center;
    }
    .skip {
      position: absolute;
      top: 14px;
      right: 16px;
      border: 0;
      background: none;
      color: var(--text-mid);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .picture {
      display: grid;
      place-items: center;
      width: 112px;
      height: 112px;
      margin: 6px auto 14px;
      border-radius: 50%;
      background: var(--teal-pale);
      font-size: 54px;
      animation: pop 0.35s ease-out;
    }
    .mini-avatar {
      position: relative;
      font-size: 54px;
    }
    .mini-hat {
      position: absolute;
      top: -26px;
      left: -14px;
      width: 46px;
      height: 46px;
      transform: rotate(-18deg);
    }
    @keyframes pop {
      from {
        transform: scale(0.85);
        opacity: 0;
      }
    }
    .step {
      margin: 0 0 4px;
      color: var(--text-mid);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    h2 {
      margin: 0 0 14px;
      color: var(--text-dark);
      font-family: 'Playfair Display', serif;
      font-size: 22px;
    }
    .text {
      max-width: 360px;
      margin: 0 auto 22px;
      color: var(--text-dark);
      font-size: 17px;
      font-weight: 500;
      line-height: 1.6;
    }
    .tiles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      max-width: 420px;
      margin: 0 auto 22px;
      padding: 0;
      list-style: none;
    }
    /* Every tile has the same size, whatever its label; tapping one opens that place. */
    .tiles button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 96px;
      padding: 12px 8px;
      border: 2px solid transparent;
      border-radius: 18px;
      background: var(--teal-pale);
      font: inherit;
      text-align: center;
      cursor: pointer;
      animation: pop 0.35s ease-out both;
      transition:
        transform 0.15s,
        border-color 0.15s;

      &:hover,
      &:focus-visible {
        border-color: var(--teal);
        transform: translateY(-2px);
        outline: none;
      }
      &:hover .tile-go,
      &:focus-visible .tile-go {
        opacity: 1;
      }
    }
    .tile-go {
      position: absolute;
      right: 10px;
      bottom: 8px;
      color: var(--teal);
      font-weight: 700;
      opacity: 0.45;
      transition: opacity 0.15s;
    }
    .tiles li:nth-child(2) button {
      animation-delay: 0.08s;
    }
    .tiles li:nth-child(3) button {
      animation-delay: 0.16s;
    }
    .tile-icon {
      font-size: 30px;
      line-height: 1;
    }
    .tile-label {
      color: var(--teal-deep);
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }
    .dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 16px;
    }
    .dots button {
      width: 8px;
      height: 8px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: var(--border);
      cursor: pointer;
    }
    .dots button.on {
      width: 22px;
      border-radius: 4px;
      background: var(--teal);
    }
    .nav {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .nav button:disabled {
      visibility: hidden;
    }
  `,
})
export class GuideDialog {
  protected readonly ref = inject(DialogRef);
  protected readonly cards = CARDS;
  protected readonly total = CARDS.length;
  protected readonly index = signal(resumeAt);
  protected readonly current = computed(() => CARDS[this.index()]);
  protected readonly isLast = computed(() => this.index() === this.total - 1);

  protected key(card: GuideCard, part: string): TranslationKey {
    return `guide.${card.id}.${part}` as TranslationKey;
  }

  private readonly router = inject(Router);
  private readonly dialog = inject(AppDialog);
  private readonly recipeDialogs = inject(RecipeDialogs);
  private readonly store = inject(RecipeStore);
  private readonly spotlight = inject(Spotlight);
  private readonly i18n = inject(I18nService);

  /** Closes the guide, opens the place a tile talks about and points at it. */
  protected async goTo(card: string, tile: number): Promise<void> {
    resumeAt = this.index();
    this.ref.close();
    const action = `${card}.${tile}`;
    await this.open(action);
    const target = SPOTLIGHT[action];
    const tip = TIPS[action];
    if (target) {
      void this.spotlight.show(
        target,
        tip ? this.i18n.t(`guide.tips.${tip}` as TranslationKey) : undefined,
      );
    }
  }

  private async open(action: string): Promise<void> {
    switch (action) {
      case 'start.0':
      case 'start.1':
      case 'start.2':
        return this.recipeDialogs.openForm();
      case 'start.3':
        await this.router.navigateByUrl('/');
        document.querySelector<HTMLInputElement>('input[name="search"]')?.focus();
        return;
      case 'start.4':
        await this.router.navigateByUrl('/');
        this.store.openMoreFilters.set(true);
        return;
      case 'start.5':
        await this.router.navigateByUrl('/');
        this.store.shuffle();
        this.store.sort.set('random');
        return;
      case 'cook.0':
      case 'cook.1':
      case 'cook.2': {
        // Cooking tips are best seen on a real recipe: open one of the user's own.
        const recipe = this.store.myRecipes()[0];
        return recipe ? this.recipeDialogs.openDetail(recipe.id) : this.recipeDialogs.openForm();
      }
      case 'cook.3': {
        const { MealPlanDialog } = await import('../../recipes/dialogs/meal-plan-dialog');
        this.dialog.open(MealPlanDialog, { width: 'wide' });
        return;
      }
      case 'cook.4': {
        const { CollectionsDialog } = await import('../dialogs/collections-dialog');
        this.dialog.open(CollectionsDialog, { width: 'medium' });
        return;
      }
      case 'cook.5': {
        const { RecipeIdeasDialog } = await import('../../recipes/dialogs/recipe-ideas-dialog');
        this.dialog.open(RecipeIdeasDialog, { width: 'wide' });
        return;
      }
      case 'yours.0':
        await this.router.navigateByUrl('/inspired');
        return;
      case 'yours.1':
        await this.router.navigateByUrl('/favorites');
        return;
      case 'yours.2':
        await this.router.navigateByUrl('/chefs');
        return;
      case 'yours.3': {
        const { CookbookExportDialog } =
          await import('../../recipes/dialogs/cookbook-export-dialog');
        this.dialog.open(CookbookExportDialog, { width: 'wide' });
        return;
      }
      case 'yours.4': {
        const { MyAllergiesDialog } = await import('../allergies/my-allergies-dialog');
        this.dialog.open(MyAllergiesDialog, { width: 'medium' });
        return;
      }
      case 'yours.5': {
        const { SettingsDialog } = await import('../settings/settings-dialog');
        this.dialog.open(SettingsDialog, { width: 'wide' });
        return;
      }
    }
  }

  /** Skip, Close or "Let's cook": the next time the guide starts from the beginning. */
  protected finish(): void {
    resumeAt = 0;
    this.ref.close();
  }

  protected go(step: number): void {
    this.index.update((i) => Math.min(this.total - 1, Math.max(0, i + step)));
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.go(1);
    if (event.key === 'ArrowLeft') this.go(-1);
  }
}
