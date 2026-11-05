import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
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
  /** Icons of the tiles (their labels are `guide.<id>.t1`, `t2`…). */
  tiles: readonly string[];
}

const SECTIONS: readonly GuideCard[] = [
  { id: 'start', emoji: '✍️', tiles: ['🍳', '📷', '🔗', '🔎', '🌾', '🎲'] },
  { id: 'cook', emoji: '👩‍🍳', tiles: ['🍽️', '📱', '🛒', '🗓️', '📁', '🥕'] },
  { id: 'yours', emoji: '💛', tiles: ['🌍', '❤️', '👨‍🍳', '📄', '⚠️', '🎨'] },
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
  'cook.1': '.cook-icon',
  'cook.2': '.more-btn',
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
  'cook.2': 'shopping',
  'yours.0': 'inspired',
  'yours.1': 'favorites',
  'yours.2': 'chefs',
};

/**
 * "How to use C00K90": everything the app can do on one page, as tiles that open each place.
 * It opens by itself the first time, and again from the chef's hat on the avatar.
 */
@Component({
  selector: 'app-guide-dialog',
  imports: [TranslatePipe, ChefHat],
  template: `
    <div class="guide" role="dialog" aria-labelledby="guide-title">
      <button
        type="button"
        class="close"
        [attr.aria-label]="'common.close' | t"
        (click)="ref.close()"
      >
        ✕
      </button>

      <h2 id="guide-title">👋 {{ 'guide.welcome.title' | t }}</h2>
      <p class="intro">{{ 'guide.welcome.text' | t }}</p>

      @for (section of sections; track section.id) {
        <h3>{{ section.emoji }} {{ key(section, 'title') | t }}</h3>
        <ul class="tiles">
          @for (icon of section.tiles; track $index) {
            <li>
              <button type="button" (click)="goTo(section.id, $index)">
                <span class="tile-icon" aria-hidden="true">{{ icon }}</span>
                <span class="tile-label">{{ key(section, 't' + ($index + 1)) | t }}</span>
              </button>
            </li>
          }
        </ul>
      }

      <div class="footer">
        <p class="again">
          <app-chef-hat class="hat" />
          {{ 'guide.again.text' | t }}
        </p>
        <button type="button" class="btn-save" (click)="ref.close()">
          {{ 'guide.done' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    /* Its own card, so the text never sits on top of the page behind. */
    .guide {
      position: relative;
      padding: 26px 24px 22px;
      border-radius: 20px;
      background: var(--card);
      box-shadow: var(--panel-shadow);
      text-align: center;
    }
    .close {
      position: absolute;
      top: 12px;
      right: 14px;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--text-mid);
      font-size: 15px;
      cursor: pointer;

      &:hover {
        background: var(--teal-pale);
      }
    }
    h2 {
      margin: 0 0 6px;
      color: var(--text-dark);
      font-family: 'Playfair Display', serif;
      font-size: 24px;
    }
    .intro {
      max-width: 420px;
      margin: 0 auto 18px;
      color: var(--text-dark);
      font-size: 15px;
      line-height: 1.55;
    }
    h3 {
      margin: 16px 0 8px;
      color: var(--text-dark);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-align: left;
      text-transform: uppercase;
    }
    /* Six tiles a row on wide screens, three on phones; all the same size. */
    .tiles {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .tiles button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      height: 92px;
      padding: 8px 6px;
      border: 2px solid transparent;
      border-radius: 16px;
      background: var(--teal-pale);
      font: inherit;
      text-align: center;
      cursor: pointer;
      transition:
        transform 0.15s,
        border-color 0.15s;

      &:hover,
      &:focus-visible {
        border-color: var(--teal);
        transform: translateY(-2px);
        outline: none;
      }
    }
    .tile-icon {
      font-size: 24px;
      line-height: 1;
    }
    .tile-label {
      color: var(--teal-deep);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.25;
    }
    .footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 20px;
    }
    .again {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--text-mid);
      font-size: 13px;
      text-align: left;
    }
    .hat {
      width: 26px;
      height: 26px;
      flex: none;
      transform: rotate(-18deg);
    }
    @media (max-width: 640px) {
      .tiles {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `,
})
export class GuideDialog {
  protected readonly ref = inject(DialogRef);
  protected readonly sections = SECTIONS;

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
}
