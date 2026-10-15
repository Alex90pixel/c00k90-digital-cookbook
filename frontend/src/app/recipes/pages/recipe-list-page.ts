import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RecipeCard } from '../components/recipe-card';
import { RecipeToolbar } from '../components/recipe-toolbar';
import { RecipeStore } from '../data/recipe.store';
import { RecipeView } from '../models/recipe.model';
import { RecipeDialogs } from '../recipe-dialogs.service';

interface EmptyState {
  icon: string;
  title: string;
  text: string;
}

/** The recipe grid for "My recipes", "Favorites" and "Get Inspired" (`view` comes from the route). */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RecipeCard, RecipeToolbar],
  template: `
    <div class="page">
      <app-recipe-toolbar />

      <section class="recipe-grid" [attr.aria-busy]="store.loading()" aria-label="Recipes">
        @if (store.loading()) {
          <div class="loading-state">
            <div class="spinner" aria-hidden="true"></div>
            <p>{{ view() === 'inspired' ? 'Loading inspiration…' : 'Loading your recipes…' }}</p>
          </div>
        } @else {
          @for (recipe of store.visible(); track recipe.id) {
            <app-recipe-card
              [recipe]="recipe"
              [showFavorite]="view() !== 'inspired'"
              (open)="dialogs.openDetail(recipe.id)"
              (toggleFavorite)="store.toggleFavorite(recipe)"
            />
          } @empty {
            @let empty = emptyState();
            <div class="empty-state">
              <div class="empty-icon" aria-hidden="true">{{ empty.icon }}</div>
              <h2>{{ empty.title }}</h2>
              <p>{{ empty.text }}</p>
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
      return {
        icon: '🔍',
        title: 'No recipes found.',
        text: 'Try another ingredient or recipe name.',
      };
    }
    switch (this.view()) {
      case 'favorites':
        return {
          icon: '🍽️',
          title: 'No favorites yet.',
          text: 'Click the ♡ on a recipe to save it here.',
        };
      case 'inspired':
        return {
          icon: '✨',
          title: 'Nothing shared yet.',
          text: 'Share one of your recipes to inspire other cooks!',
        };
      default:
        return {
          icon: '🍽️',
          title: 'Your cookbook is empty!',
          text: 'Click "+ New Recipe" to add your first recipe!',
        };
    }
  });

  constructor() {
    effect(() => {
      const view = this.view();
      untracked(() => this.store.setView(view));
    });
  }
}
