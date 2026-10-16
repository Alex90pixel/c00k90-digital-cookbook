import { Component, computed, effect, inject, untracked } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RecipeCard } from '../../recipes/components/recipe-card';
import { RecipeStore } from '../../recipes/data/recipe.store';
import { newestFirst } from '../../recipes/data/recipe.repository';
import { matchesSearch } from '../../recipes/domain/search';
import { RecipeDialogs } from '../../recipes/recipe-dialogs.service';
import { chefAvatarUrl } from '../chef-display';
import { ChefDialogs } from '../chef-dialogs.service';
import { ChefService } from '../chef.service';
import { FollowButton } from '../components/follow-button';
import { SocialIcons } from '../components/social-icons';
import { FollowService } from '../follow.service';

/** The chefs the user follows, and their latest shared recipes. */
@Component({
  selector: 'app-followed-chefs-page',
  imports: [TranslatePipe, RecipeCard, FollowButton, SocialIcons],
  templateUrl: './followed-chefs-page.html',
  styleUrl: './followed-chefs-page.scss',
})
export class FollowedChefsPage {
  private readonly chefService = inject(ChefService);
  private readonly follows = inject(FollowService);
  private readonly i18n = inject(I18nService);
  protected readonly store = inject(RecipeStore);
  protected readonly recipeDialogs = inject(RecipeDialogs);
  protected readonly chefDialogs = inject(ChefDialogs);

  protected readonly chefs = computed(() =>
    this.follows.followed().map((id) => {
      const profile = this.chefService.chef(id);
      const name = profile?.displayName || this.i18n.t('chefs.unknown');
      return {
        id,
        profile,
        name,
        avatarUrl: chefAvatarUrl(profile, name),
        recipeCount: this.store.sharedRecipes().filter((r) => r.userId === id).length,
      };
    }),
  );

  private readonly followedRecipes = computed(() => {
    const ids = new Set(this.follows.followed());
    return this.store
      .sharedRecipes()
      .filter((r) => ids.has(r.userId))
      .sort(newestFirst);
  });

  /** Their recipes, filtered by the header search. */
  protected readonly recipes = computed(() => {
    const query = this.store.search().toLowerCase().trim();
    const recipes = this.followedRecipes();
    return query ? recipes.filter((r) => matchesSearch(r, query)) : recipes;
  });
  protected readonly searching = computed(() => !!this.store.search().trim());

  constructor() {
    this.store.search.set('');
    this.store.ensureSharedLoaded();
    effect(() => {
      const ids = this.follows.followed();
      untracked(() => this.chefService.request(ids));
    });
  }
}
