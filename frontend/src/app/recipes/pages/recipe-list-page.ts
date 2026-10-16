import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RecipeCard } from '../components/recipe-card';
import { RecipeToolbar } from '../components/recipe-toolbar';
import { RecipeStore } from '../data/recipe.store';
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
  imports: [RecipeCard, RecipeToolbar, TranslatePipe],
  template: `
    <div class="page">
      <app-recipe-toolbar />

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
