import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { TranslationKey } from './core/i18n/i18n.types';
import { RecipeView } from './recipes/models/recipe.model';

// Titles are translation keys; I18nTitleStrategy turns them into text in the current language.

export const routes: Routes = [
  {
    path: 'login',
    title: 'titles.login' satisfies TranslationKey,
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell-layout').then((m) => m.ShellLayout),
    // Each view is the same page; the view name reaches it as the `view` input.
    children: [
      {
        path: '',
        title: 'titles.home' satisfies TranslationKey,
        data: { view: 'all' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
      {
        path: 'favorites',
        title: 'titles.favorites' satisfies TranslationKey,
        data: { view: 'favorites' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
      {
        path: 'inspired',
        title: 'titles.inspired' satisfies TranslationKey,
        data: { view: 'inspired' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
      {
        path: 'chefs',
        title: 'titles.chefs' satisfies TranslationKey,
        loadComponent: () =>
          import('./chefs/pages/followed-chefs-page').then((m) => m.FollowedChefsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

function recipeListPage() {
  return import('./recipes/pages/recipe-list-page').then((m) => m.RecipeListPage);
}
