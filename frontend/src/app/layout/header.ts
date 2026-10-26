import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AccountMenu } from '../account/account-menu';
import { TranslationKey } from '../core/i18n/i18n.types';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { RecipeStore } from '../recipes/data/recipe.store';
import { RecipeDialogs } from '../recipes/recipe-dialogs.service';
import { Logo } from '../shared/ui/logo';

interface NavItem {
  path: string;
  labelKey: TranslationKey;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'header.myRecipes' },
  { path: '/favorites', labelKey: 'header.favorites' },
  { path: '/inspired', labelKey: 'header.inspired' },
  { path: '/chefs', labelKey: 'header.followedChefs' },
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo, AccountMenu, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  protected readonly store = inject(RecipeStore);
  protected readonly dialogs = inject(RecipeDialogs);

  /** The current path, without query string or fragment. */
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => currentPath(this.router)),
    ),
    { initialValue: currentPath(this.router) },
  );

  protected readonly navItems = computed(() =>
    NAV_ITEMS.map((item) => {
      const active = this.path() === item.path;
      // Clicking the active view again goes back home.
      return { ...item, active, link: active ? '/' : item.path };
    }),
  );

  protected onSearch(event: Event): void {
    this.store.search.set((event.target as HTMLInputElement).value);
  }
}

function currentPath(router: Router): string {
  return router.url.split(/[?#]/)[0] || '/';
}
