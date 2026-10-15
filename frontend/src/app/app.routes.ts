import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { RecipeView } from './recipes/models/recipe.model';

const APP_TITLE = 'C00K90 — Digital Cook Book';

export const routes: Routes = [
  {
    path: 'login',
    title: APP_TITLE,
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
        title: APP_TITLE,
        data: { view: 'all' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
      {
        path: 'favorites',
        title: `Favorites · ${APP_TITLE}`,
        data: { view: 'favorites' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
      {
        path: 'inspired',
        title: `Get Inspired · ${APP_TITLE}`,
        data: { view: 'inspired' satisfies RecipeView },
        loadComponent: recipeListPage,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

function recipeListPage() {
  return import('./recipes/pages/recipe-list-page').then((m) => m.RecipeListPage);
}
