import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { IdeaOption, RecipeIdeasService } from '../data/recipe-ideas.service';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { RecipeStore } from '../data/recipe.store';
import { PhotoConsent } from '../../shared/dialog/photo-consent.service';
import { parseIngredientLines } from '../domain/ingredients';
import { emptyRecipeForm } from '../domain/recipe-form';
import { RecipeIdea } from '../models/recipe-idea.model';
import { categoryEmoji, difficultyIcon } from '../models/recipe.constants';

const OPTIONS: readonly { id: IdeaOption; label: TranslationKey }[] = [
  { id: 'quick', label: 'ideas.options.quick' },
  { id: 'vegetarian', label: 'ideas.options.vegetarian' },
  { id: 'budget', label: 'ideas.options.budget' },
  { id: 'onePot', label: 'ideas.options.onePot' },
  { id: 'kids', label: 'ideas.options.kids' },
  { id: 'protein', label: 'ideas.options.protein' },
];

/**
 * "What can I cook?": the user types what they have at home and Gemini suggests three recipes
 * that use it. Any of them can be saved to the user's cookbook in one tap.
 */
@Component({
  selector: 'app-recipe-ideas-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="ideas-title">
      <h2 id="ideas-title">{{ 'ideas.title' | t }}</h2>
      <p>{{ 'ideas.hint' | t }}</p>

      <form class="ask" (submit)="$event.preventDefault(); suggest()">
        <input
          class="field"
          type="text"
          name="i-have"
          maxlength="300"
          [attr.aria-label]="'ideas.label' | t"
          [placeholder]="'ideas.placeholder' | t"
          [value]="have()"
          (input)="have.set($any($event.target).value)"
        />
        <input
          #fridgePhoto
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          (change)="readFridge(fridgePhoto)"
        />
        <button
          type="button"
          class="btn-confirm-cancel photo-btn"
          [disabled]="loading() || readingPhoto()"
          [attr.aria-label]="'ideas.photo' | t"
          [title]="'ideas.photoHint' | t"
          (click)="pickFridge(fridgePhoto)"
        >
          📸
        </button>
        <button type="submit" class="btn-save" [disabled]="!have().trim() || loading()">
          {{ (loading() ? 'ideas.thinking' : 'ideas.get') | t }}
        </button>
      </form>

      <div class="options" role="group" [attr.aria-label]="'ideas.optionsLabel' | t">
        @for (option of optionList; track option.id) {
          <button
            type="button"
            class="option"
            [class.on]="options().includes(option.id)"
            [attr.aria-pressed]="options().includes(option.id)"
            (click)="toggleOption(option.id)"
          >
            {{ option.label | t }}
          </button>
        }
      </div>

      @if (readingPhoto()) {
        <p class="photo-status" role="status">{{ 'ideas.readingPhoto' | t }}</p>
      }

      @if (error()) {
        <p class="error" role="alert">{{ error()! | t }}</p>
      }

      <div class="ideas" aria-live="polite">
        @for (idea of ideas(); track idea.name; let i = $index) {
          <article class="idea">
            <p class="kicker">{{ emoji(idea) }} {{ i18n.label('categories', idea.category) }}</p>
            <h3>{{ idea.name }}</h3>
            <p class="meta">
              <span
                >⏱ {{ 'ideas.minutes' | t: { count: idea.prepMinutes + idea.cookMinutes } }}</span
              >
              <span>🍽 {{ 'ideas.serves' | t: { count: idea.servings } }}</span>
              <span
                >{{ difficultyIcon(idea) }} {{ i18n.label('difficulty', idea.difficulty) }}</span
              >
            </p>
            <p class="desc">{{ idea.description }}</p>
            <h4>{{ 'detail.ingredients' | t }}</h4>
            <ul class="ing">
              @for (line of idea.ingredients; track $index) {
                <li>{{ line }}</li>
              }
            </ul>
            @if (idea.extras.length) {
              <div class="extras">
                <span class="extras-title">{{ 'ideas.extras' | t }}</span>
                @for (extra of idea.extras; track $index) {
                  <span class="chip">{{ extra }}</span>
                }
              </div>
            }
            @if (idea.tip) {
              <p class="tip">💡 {{ idea.tip }}</p>
            }
            <details>
              <summary>{{ 'ideas.details' | t }}</summary>
              <ol>
                @for (step of idea.steps; track $index) {
                  <li>{{ step }}</li>
                }
              </ol>
            </details>
            <button
              type="button"
              class="btn-confirm-cancel save"
              [disabled]="saved().has(i) || saving() === i"
              (click)="save(idea, i)"
            >
              {{ (saved().has(i) ? 'ideas.saved' : 'ideas.save') | t }}
            </button>
          </article>
        }
      </div>

      @if (ideas().length) {
        <button
          type="button"
          class="btn-add-row more"
          [disabled]="loading()"
          (click)="suggest(true)"
        >
          {{ (loading() ? 'ideas.thinking' : 'ideas.more') | t }}
        </button>
      }

      <p class="note">{{ 'ideas.note' | t }}</p>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.close' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .ask {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .ask .field {
      flex: 1;
      min-width: 0;
    }
    .options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: -4px 0 14px;
    }
    .option {
      padding: 5px 12px;
      border: 1.5px solid var(--border);
      border-radius: 50px;
      background: transparent;
      color: var(--text-mid);
      font-size: 13px;
      cursor: pointer;

      &.on {
        border-color: var(--teal);
        background: var(--teal-pale);
        color: var(--teal-deep);
        font-weight: 600;
      }
    }
    .more {
      display: block;
      margin: 14px auto 0;
    }
    .photo-btn {
      flex: none;
      padding: 0 14px;
      font-size: 20px;
    }
    .photo-status {
      margin: -6px 0 12px;
      color: var(--teal);
      font-size: 13px;
      font-weight: 600;
    }
    .error {
      color: var(--magenta-deep);
      font-size: 14px;
    }
    .ideas {
      display: grid;
      gap: 12px;
      max-height: 55vh;
      margin-bottom: 12px;
      overflow-y: auto;
    }
    .idea {
      padding: 14px 16px;
      border: 1.5px solid var(--border);
      border-radius: 16px;
    }
    .kicker {
      margin: 0 0 2px;
      color: var(--text-light);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .idea h3 {
      margin: 0 0 6px;
      color: var(--text-dark);
      font-size: 18px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0 0 8px;
    }
    .meta span {
      padding: 3px 10px;
      border-radius: 50px;
      background: var(--teal-pale);
      color: var(--teal-deep);
      font-size: 12px;
      font-weight: 600;
    }
    .desc {
      margin: 0 0 8px;
      color: var(--text-mid);
      font-size: 14px;
      line-height: 1.5;
    }
    .ing {
      columns: 2;
      column-gap: 20px;
      font-size: 13px;
    }
    .extras {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 10px 0 6px;
    }
    .extras-title {
      color: var(--text-mid);
      font-size: 12px;
      font-weight: 700;
    }
    .chip {
      padding: 3px 10px;
      border-radius: 50px;
      background: var(--magenta-pale);
      color: var(--magenta-deep);
      font-size: 12px;
      font-weight: 600;
    }
    .tip {
      margin: 6px 0 8px;
      color: var(--text-dark);
      font-size: 13px;
    }
    @media (max-width: 520px) {
      .ing {
        columns: 1;
      }
    }
    details {
      margin-bottom: 10px;
      color: var(--text-dark);
      font-size: 14px;
    }
    summary {
      color: var(--teal);
      font-weight: 700;
      cursor: pointer;
    }
    h4 {
      margin: 10px 0 4px;
      font-size: 13px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-mid);
    }
    ul,
    ol {
      margin: 0;
      padding-left: 20px;
      line-height: 1.6;
    }
    .note {
      color: var(--text-light);
      font-size: 12px;
    }
  `,
})
export class RecipeIdeasDialog {
  protected readonly ref = inject(DialogRef);
  private readonly ideasService = inject(RecipeIdeasService);
  private readonly store = inject(RecipeStore);
  protected readonly i18n = inject(I18nService);

  protected readonly have = signal('');
  protected readonly ideas = signal<RecipeIdea[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<
    'ideas.failed' | 'ideas.none' | 'ideas.photoNothing' | 'ideas.photoFailed' | null
  >(null);
  protected readonly saved = signal(new Set<number>());
  protected readonly saving = signal<number | null>(null);

  protected emoji(idea: RecipeIdea): string {
    return categoryEmoji(idea.category);
  }

  protected difficultyIcon(idea: RecipeIdea): string {
    return difficultyIcon(idea.difficulty);
  }

  protected readonly optionList = OPTIONS;
  protected readonly options = signal<readonly IdeaOption[]>([]);
  /** Every idea shown for these ingredients, so "More ideas" doesn't repeat them. */
  private shownNames: string[] = [];

  // "📸": a photo of the fridge fills in the ingredients.
  private readonly photoConsent = inject(PhotoConsent);
  protected readonly readingPhoto = signal(false);

  protected async pickFridge(input: HTMLInputElement): Promise<void> {
    if (await this.photoConsent.ask()) input.click();
  }

  protected async readFridge(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file?.type.startsWith('image/')) return;
    this.readingPhoto.set(true);
    this.error.set(null);
    try {
      const found = await this.ideasService.ingredientsInPhoto(file, this.i18n.language());
      if (!found.length) {
        this.error.set('ideas.photoNothing');
        return;
      }
      // Added to what was already typed, without repeats.
      const typed = this.have()
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
      this.have.set([...new Set([...typed, ...found])].join(', '));
      await this.suggest();
    } catch (error) {
      console.error('Reading the fridge photo failed', error);
      this.error.set('ideas.photoFailed');
    } finally {
      this.readingPhoto.set(false);
    }
  }

  protected toggleOption(id: IdeaOption): void {
    this.options.update((list) =>
      list.includes(id) ? list.filter((o) => o !== id) : [...list, id],
    );
  }

  /** `more` keeps asking about the same ingredients, for ideas not shown yet. */
  protected async suggest(more = false): Promise<void> {
    if (!this.have().trim() || this.loading()) return;
    if (!more) this.shownNames = [];
    this.loading.set(true);
    this.error.set(null);
    this.saved.set(new Set());
    try {
      const ideas = await this.ideasService.suggest(
        this.have(),
        this.i18n.language(),
        this.options(),
        this.shownNames,
      );
      this.shownNames.push(...ideas.map((idea) => idea.name));
      this.ideas.set(ideas);
      if (!ideas.length) this.error.set('ideas.none');
    } catch (error) {
      console.error('Recipe ideas failed', error);
      this.error.set('ideas.failed');
    } finally {
      this.loading.set(false);
    }
  }

  protected async save(idea: RecipeIdea, index: number): Promise<void> {
    this.saving.set(index);
    const value = {
      ...emptyRecipeForm(),
      name: idea.name,
      category: idea.category,
      servings: idea.servings,
      prepTime: idea.prepMinutes,
      cookTime: idea.cookMinutes,
      ingredients: parseIngredientLines(idea.ingredients.join('\n')),
      steps: idea.steps,
      source: this.i18n.t('ideas.source'),
      description: idea.description,
      extras: idea.extras.join('\n'),
      tip: idea.tip,
      difficulty: idea.difficulty,
    };
    // Ideas asked for as vegetarian or for kids get those diet labels.
    value.diets = {
      ...value.diets,
      vegetarian: this.options().includes('vegetarian'),
      'kid-friendly': this.options().includes('kids'),
    };
    if (await this.store.save(value, [], null)) {
      this.saved.update((set) => new Set(set).add(index));
    }
    this.saving.set(null);
  }
}
