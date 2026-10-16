import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { disclaimerWithoutAlcohol, pickPairing } from '../domain/pairing';
import { PairingsFile } from '../models/pairing.model';
import { RecipeData } from '../models/recipe.model';

export interface DrinkSuggestion {
  /** Written by the recipe's author: shown alone, without a disclaimer. */
  custom?: string;
  wine?: string;
  noAlcohol?: string;
  disclaimer?: string;
}

/** Suggests drinks for a recipe, from the rules in `public/data/pairings.json`. */
@Injectable({ providedIn: 'root' })
export class PairingService {
  private readonly i18n = inject(I18nService);
  private readonly pairings = httpResource<PairingsFile>(() => 'data/pairings.json');
  private readonly file = computed(() => (this.pairings.hasValue() ? this.pairings.value() : null));

  /** The author's own pairing if there is one, otherwise an automatic suggestion. */
  suggestionFor(
    recipe: Pick<RecipeData, 'name' | 'category' | 'ingredients' | 'pairing'>,
  ): DrinkSuggestion | null {
    if (recipe.pairing) return { custom: recipe.pairing };
    const file = this.file();
    const rule = file && pickPairing(recipe, file);
    if (!file || !rule) return null;

    const romanian = this.i18n.language() === 'ro' ? file.translations?.ro : undefined;
    const text = (romanian && rule.ro) || rule;
    const wine = text.wine || undefined;
    // The alcohol warning is only shown when alcohol is actually suggested.
    const disclaimer = romanian
      ? wine
        ? romanian.disclaimer
        : romanian.disclaimerWithoutAlcohol
      : wine
        ? file.disclaimer
        : disclaimerWithoutAlcohol(file.disclaimer);
    return { wine, noAlcohol: text.noAlcohol, disclaimer };
  }
}
