import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
import { PhotoConsent } from '../../../shared/dialog/photo-consent.service';
import { NutritionService } from '../../data/nutrition.service';
import { RecipeImportService } from '../../data/recipe-import.service';
import { RecipePhotoService } from '../../data/recipe-photo.service';
import { RecipeStore } from '../../data/recipe.store';
import { formToRecipeData } from '../../domain/recipe-form';
import { RecipeFormValue } from '../../models/recipe-form.model';
import { RecipeFormDialog } from './recipe-form-dialog';

async function setup() {
  const save = vi.fn().mockResolvedValue(true);
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [RecipeFormDialog],
    providers: [
      { provide: DIALOG_DATA, useValue: null },
      {
        provide: DialogRef,
        useValue: { close, backdropClick: new Subject(), keydownEvents: new Subject() },
      },
      { provide: RecipeStore, useValue: { save } },
      { provide: RecipePhotoService, useValue: {} },
      { provide: RecipeImportService, useValue: {} },
      { provide: NutritionService, useValue: { estimate: () => null } },
      { provide: AppDialog, useValue: { confirm: vi.fn().mockResolvedValue(true) } },
      { provide: PhotoConsent, useValue: { ask: vi.fn().mockResolvedValue(true) } },
    ],
  });
  const fixture = TestBed.createComponent(RecipeFormDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;

  const type = (selector: string, value: string) => {
    const field = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const choose = (selector: string, value: string) => {
    const select = element.querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    select.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const click = async (text: string) => {
    const button = Array.from(element.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(text),
    )!;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };
  // Signal Forms tags array items with a hidden symbol for tracking; compare only real fields.
  const savedValue = () => {
    const value = save.mock.calls[0][0] as RecipeFormValue;
    return {
      ...value,
      ingredients: value.ingredients.map(({ qty, unit, name }) => ({ qty, unit, name })),
    };
  };

  return { fixture, element, type, choose, click, save, savedValue };
}

describe('RecipeFormDialog saving', () => {
  it('saves ingredients and steps added from the paste boxes', async () => {
    const { type, choose, click, save, savedValue } = await setup();
    type('#recipe-name', 'Pancakes');
    choose('#recipe-category', 'Breakfast');
    type('#ingredients-paste', '200g flour\n2 eggs');
    await click('Add pasted ingredients');
    type('#steps-paste', '1. Mix\n2. Fry');
    await click('Add pasted steps');
    await click('Save Recipe');

    expect(save).toHaveBeenCalledTimes(1);
    expect(savedValue().ingredients).toEqual([
      { qty: '200', unit: 'g', name: 'flour' },
      { qty: '2', unit: '', name: 'eggs' },
    ]);
    expect(savedValue().steps).toEqual(['Mix', 'Fry']);
  });

  it('keeps edits made in the ingredient and step rows', async () => {
    const { element, fixture, type, choose, click, savedValue } = await setup();
    type('#recipe-name', 'Soup');
    choose('#recipe-category', 'Soups');
    type('#ingredients-paste', '1 l water');
    await click('Add pasted ingredients');
    type('#steps-paste', 'Boil');
    await click('Add pasted steps');

    const nameInput = element.querySelector<HTMLInputElement>(
      '.dynamic-list .dynamic-item input:nth-of-type(3)',
    )!;
    nameInput.value = 'sparkling water';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await click('Save Recipe');

    expect(savedValue().ingredients[0].name).toBe('sparkling water');
  });

  it('saves every field of the form into the Firestore document', async () => {
    const { element, fixture, type, choose, click, save } = await setup();
    type('#recipe-name', 'Lava cake');
    choose('#recipe-category', 'Desserts');
    const vegetarian = element.querySelectorAll<HTMLInputElement>('.diet-checks input')[0];
    vegetarian.click();
    fixture.detectChanges();
    await click('Hard');
    type('#ingredients-paste', '100g chocolate');
    type('#steps-paste', 'Melt the chocolate');
    type('#recipe-prep', '15');
    type('#recipe-cook', '12');
    type('#recipe-servings', '4');
    type('#recipe-source', "Grandma's recipe");
    type('#recipe-video', 'https://youtu.be/dQw4w9WgXcQ');
    type('#recipe-pairing', 'Espresso');
    type('#recipe-notes', 'Serve warm');
    await click('Save Recipe');

    const value = save.mock.calls[0][0] as RecipeFormValue;
    const data = formToRecipeData(value, 'u1', [], null);
    expect(data).toMatchObject({
      name: 'Lava cake',
      category: 'Desserts',
      diets: ['vegetarian'],
      difficulty: 'Hard',
      prepTime: 15,
      cookTime: 12,
      servings: 4,
      ingredients: [{ qty: '100', unit: 'g', name: 'chocolate' }],
      steps: ['Melt the chocolate'],
      source: "Grandma's recipe",
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pairing: 'Espresso',
      notes: 'Serve warm',
      userId: 'u1',
      imageEmoji: '🍮',
    });
    // Plain objects only: Firestore must not receive the form's internal tracking markers.
    expect(Object.getOwnPropertySymbols(data.ingredients![0])).toEqual([]);
  });

  it('also saves text left in the paste boxes, without pressing "Add pasted…"', async () => {
    const { type, choose, click, savedValue } = await setup();
    type('#recipe-name', 'Toast');
    choose('#recipe-category', 'Breakfast');
    type('#ingredients-paste', '2 slices bread\n1 tbsp butter');
    type('#steps-paste', 'Toast the bread\nSpread the butter');
    await click('Save Recipe');

    expect(savedValue().ingredients.map((i) => i.name)).toEqual(['bread', 'butter']);
    expect(savedValue().steps).toEqual(['Toast the bread', 'Spread the butter']);
  });
});
