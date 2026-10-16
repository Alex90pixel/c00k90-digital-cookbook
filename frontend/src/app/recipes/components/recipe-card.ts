import { Component, computed, inject, input, output } from '@angular/core';
import { ChefBadge } from '../../chefs/components/chef-badge';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { totalMinutes } from '../domain/diets';
import { cardImageUrl } from '../domain/recipe-images';
import { youtubeVideoId } from '../domain/video';
import { difficultyIcon } from '../models/recipe.constants';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  imports: [TranslatePipe, ChefBadge],
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
            [class.fav]="favorite()"
            [attr.aria-pressed]="favorite()"
            [attr.aria-label]="(favorite() ? 'card.removeFavorite' : 'card.addFavorite') | t"
            (click)="toggleFavorite.emit()"
          >
            {{ favorite() ? '❤️' : '🤍' }}
          </button>
        }
      </div>
      <div class="card-body">
        <div class="card-category">{{ i18n.label('categories', r.category) }}</div>
        <h3 class="card-title">
          <!-- The whole card is clickable through this button (see .card-open::after). -->
          <button type="button" class="card-open" (click)="open.emit()">{{ r.name }}</button>
        </h3>
        <p class="card-desc">{{ summary() }}</p>
        <div class="card-meta">
          @if (minutes()) {
            <span class="meta-pill">{{ 'card.minutes' | t: { count: minutes() } }}</span>
          }
          <span class="meta-pill"
            >{{ difficultyIcon() }} {{ i18n.label('difficulty', difficulty()) }}</span
          >
          @if (hasVideo()) {
            <span class="meta-pill">{{ 'card.video' | t }}</span>
          }
        </div>
        @if (showChef()) {
          <div class="card-chef">
            <app-chef-badge [chefId]="r.userId" />
          </div>
        }
      </div>
    </article>
  `,
  styleUrl: './recipe-card.scss',
})
export class RecipeCard {
  protected readonly i18n = inject(I18nService);
  readonly recipe = input.required<Recipe>();
  /** Shows the heart; only for other cooks' recipes (your own can't be favorites). */
  readonly showFavorite = input(false);
  readonly favorite = input(false);
  /** Shows who shared the recipe (Get Inspired, Followed Chefs). */
  readonly showChef = input(false);
  readonly open = output();
  readonly toggleFavorite = output();

  protected readonly imageUrl = computed(() => cardImageUrl(this.recipe()));
  protected readonly minutes = computed(() => totalMinutes(this.recipe()));
  protected readonly hasVideo = computed(() => !!youtubeVideoId(this.recipe().videoUrl));
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
