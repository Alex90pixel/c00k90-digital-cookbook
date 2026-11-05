import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RecipeCard } from '../components/recipe-card';
import { RecipeOfTheDay } from '../components/recipe-of-the-day';
import { RecipeToolbar } from '../components/recipe-toolbar';
import { RecipeStore } from '../data/recipe.store';
import { starterRecipes } from '../domain/starter-recipes';
import { RecipeView } from '../models/recipe.model';
import { RecipeDialogs } from '../recipe-dialogs.service';

interface EmptyState {
  icon: string;
  title: TranslationKey;
  text: TranslationKey;
}

/** The recipe grid for "My recipes", "Favorites" and "Get Inspired" (`view` comes from the route). */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RecipeCard, RecipeToolbar, RecipeOfTheDay, TranslatePipe],
  template: `
    <div class="page">
      <app-recipe-toolbar />

      @if (view() === 'all' && !store.loading() && !store.search().trim()) {
        <app-recipe-of-the-day />
      }

      <section
        class="recipe-grid"
        [attr.aria-busy]="store.loading()"
        [attr.aria-label]="'list.label' | t"
      >
        @if (store.loading()) {
          <div class="loading-state">
            <div class="spinner" aria-hidden="true"></div>
            <p>{{ (view() === 'inspired' ? 'list.loadingInspired' : 'list.loadingMine') | t }}</p>
          </div>
        } @else {
          @for (recipe of store.visible(); track recipe.id) {
            <app-recipe-card
              [recipe]="recipe"
              [showFavorite]="!store.isOwner(recipe)"
              [favorite]="store.isFavorite(recipe)"
              [showChef]="view() !== 'all'"
              (open)="dialogs.openDetail(recipe.id)"
              (toggleFavorite)="store.toggleFavorite(recipe)"
            />
          } @empty {
            @let empty = emptyState();
            <div class="empty-state">
              <div class="empty-icon" aria-hidden="true">{{ empty.icon }}</div>
              <h2>{{ empty.title | t }}</h2>
              <p>{{ empty.text | t }}</p>
              @if (view() === 'all' && !store.search().trim()) {
                <button
                  type="button"
                  class="btn-save starter-btn"
                  [disabled]="addingStarters()"
                  (click)="addStarters()"
                >
                  {{ (addingStarters() ? 'list.starterAdding' : 'list.starterButton') | t }}
                </button>
                <p class="starter-hint">{{ 'list.starterHint' | t }}</p>
              }
            </div>
          }
        }
      </section>
    </div>
  `,
  styleUrl: './recipe-list-page.scss',
})
export class RecipeListPage {
  protected readonly store = inject(RecipeStore);
  protected readonly dialogs = inject(RecipeDialogs);
  private readonly i18n = inject(I18nService);
  protected readonly addingStarters = signal(false);

  /** An empty cookbook can start with three example recipes, to see how everything looks. */
  protected async addStarters(): Promise<void> {
    this.addingStarters.set(true);
    try {
      for (const value of starterRecipes(this.i18n.language(), this.i18n.t('list.starterSource'))) {
        if (!(await this.store.save(value, [], null))) break;
      }
    } finally {
      this.addingStarters.set(false);
    }
  }

  readonly view = input.required<RecipeView>();

  protected readonly emptyState = computed<EmptyState>(() => {
    if (this.store.search().trim()) {
      return { icon: '🔍', title: 'list.searchEmptyTitle', text: 'list.searchEmptyText' };
    }
    switch (this.view()) {
      case 'favorites':
        return { icon: '🍽️', title: 'list.favoritesEmptyTitle', text: 'list.favoritesEmptyText' };
      case 'inspired':
        return { icon: '✨', title: 'list.inspiredEmptyTitle', text: 'list.inspiredEmptyText' };
      default:
        return { icon: '🍽️', title: 'list.mineEmptyTitle', text: 'list.mineEmptyText' };
    }
  });

  constructor() {
    effect(() => {
      const view = this.view();
      untracked(() => this.store.setView(view));
    });
  }
}
