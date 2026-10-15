import { Component, computed, input, output } from '@angular/core';
import { totalMinutes } from '../domain/diets';
import { cardImageUrl } from '../domain/recipe-images';
import { difficultyIcon } from '../models/recipe.constants';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  template: `
    @let r = recipe();
    <article class="recipe-card">
      <div class="card-media">
        @if (imageUrl(); as url) {
          <img [src]="url" [alt]="r.name" loading="lazy" decoding="async" />
        } @else {
          <div class="card-image-placeholder" aria-hidden="true">{{ r.imageEmoji || '🍽️' }}</div>
        }
        @if (showFavorite()) {
          <button
            type="button"
            class="heart-btn"
            [class.fav]="r.favorite"
            [attr.aria-pressed]="!!r.favorite"
            [attr.aria-label]="r.favorite ? 'Remove from favorites' : 'Add to favorites'"
            (click)="toggleFavorite.emit()"
          >
            {{ r.favorite ? '❤️' : '🤍' }}
          </button>
        }
      </div>
      <div class="card-body">
        <div class="card-category">{{ r.category }}</div>
        <h3 class="card-title">
          <!-- The whole card is clickable through this button (see .card-open::after). -->
          <button type="button" class="card-open" (click)="open.emit()">{{ r.name }}</button>
        </h3>
        <p class="card-desc">{{ summary() }}</p>
        <div class="card-meta">
          @if (minutes()) {
            <span class="meta-pill">⏱ {{ minutes() }} min</span>
          }
          <span class="meta-pill">{{ difficultyIcon() }} {{ difficulty() }}</span>
        </div>
      </div>
    </article>
  `,
  styleUrl: './recipe-card.scss',
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  readonly showFavorite = input(true);
  readonly open = output();
  readonly toggleFavorite = output();

  protected readonly imageUrl = computed(() => cardImageUrl(this.recipe()));
  protected readonly minutes = computed(() => totalMinutes(this.recipe()));
  protected readonly difficulty = computed(() => this.recipe().difficulty ?? 'Easy');
  protected readonly difficultyIcon = computed(() => difficultyIcon(this.difficulty()));
  /** The description, or the first ingredients when there is none. */
  protected readonly summary = computed(() => {
    const r = this.recipe();
    return (
      r.description ||
      (r.ingredients ?? [])
        .slice(0, 4)
        .map((i) => i.name)
        .join(', ')
    );
  });
}
