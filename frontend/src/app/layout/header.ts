import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountMenu } from '../account/account-menu';
import { RecipeStore } from '../recipes/data/recipe.store';
import { RecipeDialogs } from '../recipes/recipe-dialogs.service';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo, AccountMenu],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly store = inject(RecipeStore);
  protected readonly dialogs = inject(RecipeDialogs);

  // Clicking the active view again goes back home, like the old app.
  protected readonly favoritesLink = computed(() =>
    this.store.view() === 'favorites' ? '/' : '/favorites',
  );
  protected readonly inspiredLink = computed(() =>
    this.store.view() === 'inspired' ? '/' : '/inspired',
  );

  protected onSearch(event: Event): void {
    this.store.search.set((event.target as HTMLInputElement).value);
  }
}
