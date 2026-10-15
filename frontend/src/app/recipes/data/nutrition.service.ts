import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';
import { NutritionIndex, estimateNutrition } from '../domain/nutrition';
import { CiqualFile, NutritionEstimate } from '../models/nutrition.model';
import { Ingredient } from '../models/recipe.model';

/**
 * Nutrition estimates based on the ANSES Ciqual 2025 table. Until the table has loaded (or if it
 * fails to load), estimates use the small built-in table; they update by themselves afterwards.
 */
@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly ciqual = httpResource<CiqualFile>(() => 'data/ciqual-2025.json');

  private readonly index = computed(() =>
    this.ciqual.hasValue()
      ? NutritionIndex.fromCiqual(this.ciqual.value())
      : NutritionIndex.fallbackOnly(),
  );

  /** Nutrition per serving; reactive when called inside a `computed` or template. */
  estimate(
    ingredients: readonly Ingredient[] | undefined,
    servings: number | undefined,
  ): NutritionEstimate | null {
    return estimateNutrition(ingredients ?? [], servings, this.index());
  }
}
