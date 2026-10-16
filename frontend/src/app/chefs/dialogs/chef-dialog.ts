import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RecipeCard } from '../../recipes/components/recipe-card';
import { RecipeStore } from '../../recipes/data/recipe.store';
import { RecipeDialogs } from '../../recipes/recipe-dialogs.service';
import { chefAvatarUrl } from '../chef-display';
import { ChefService } from '../chef.service';
import { FollowButton } from '../components/follow-button';
import { SocialIcons } from '../components/social-icons';

/** A chef's public profile: photo, name, social links, follow button and shared recipes. */
@Component({
  selector: 'app-chef-dialog',
  imports: [TranslatePipe, RecipeCard, FollowButton, SocialIcons],
  template: `
    <div class="form-modal" aria-labelledby="chef-title">
      <div class="form-header">
        <div class="chef-head">
          <img class="chef-photo" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
          <div class="chef-info">
            <h2 class="form-title" id="chef-title">{{ name() }}</h2>
            <span class="chef-count">{{
              'chefs.recipeCount' | t: { count: recipes().length }
            }}</span>
            @if (chef(); as profile) {
              <app-social-icons [chef]="profile" [name]="name()" />
            }
          </div>
        </div>
        <button
          type="button"
          class="detail-close"
          [attr.aria-label]="'common.close' | t"
          (click)="ref.close()"
        >
          ✕
        </button>
      </div>

      <div class="form-body">
        <div class="follow-row">
          <app-follow-button [chefId]="chefId" />
        </div>
        <h3 class="section-heading">{{ 'chefs.sharedRecipes' | t }}</h3>
        @if (store.sharedLoading() && !recipes().length) {
          <p class="muted">{{ 'chefs.loading' | t }}</p>
        } @else {
          <div class="chef-recipes">
            @for (recipe of recipes(); track recipe.id) {
              <app-recipe-card
                [recipe]="recipe"
                [showFavorite]="!store.isOwner(recipe)"
                [favorite]="store.isFavorite(recipe)"
                (open)="recipeDialogs.openDetail(recipe.id)"
                (toggleFavorite)="store.toggleFavorite(recipe)"
              />
            } @empty {
              <p class="muted">{{ 'chefs.noSharedRecipes' | t }}</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .chef-head {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }
    .chef-photo {
      flex-shrink: 0;
      width: 72px;
      height: 72px;
      border: 3px solid var(--teal-light);
      border-radius: 50%;
      object-fit: cover;
    }
    .chef-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .chef-count {
      color: var(--text-light);
      font-size: 13px;
    }
    .follow-row {
      margin-bottom: 20px;
    }
    .chef-recipes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .muted {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--text-light);
      font-size: 14px;
    }
  `,
})
export class ChefDialog {
  private readonly chefs = inject(ChefService);
  private readonly i18n = inject(I18nService);
  protected readonly store = inject(RecipeStore);
  protected readonly recipeDialogs = inject(RecipeDialogs);
  protected readonly ref = inject(DialogRef);
  protected readonly chefId = inject<string>(DIALOG_DATA);

  protected readonly chef = computed(() => this.chefs.chef(this.chefId));
  protected readonly name = computed(
    () => this.chef()?.displayName || this.i18n.t('chefs.unknown'),
  );
  protected readonly avatarUrl = computed(() => chefAvatarUrl(this.chef(), this.name()));
  protected readonly recipes = computed(() =>
    this.store.sharedRecipes().filter((r) => r.userId === this.chefId),
  );

  constructor() {
    this.chefs.request([this.chefId]);
    this.store.ensureSharedLoaded();
  }
}
