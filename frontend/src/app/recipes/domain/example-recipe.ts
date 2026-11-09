import { Language } from '../../core/i18n/i18n.service';
import { RecipeFormValue } from '../models/recipe-form.model';
import { AllergenId } from '../models/recipe.model';
import { emptyRecipeForm } from './recipe-form';

/** The parts of the example recipe that change with the language. */
interface ExampleText {
  name: string;
  description: string;
  /** Ingredient names, in the same order as `AMOUNTS`. */
  ingredients: string[];
  steps: string[];
  tip: string;
  extras: string[];
  pairing: string;
}

/** [quantity, unit] for each ingredient. */
const AMOUNTS: [string, string][] = [
  ['200', 'g'],
  ['100', 'g'],
  ['4', ''],
  ['150', 'g'],
  ['80', 'g'],
  ['', ''],
  ['150', 'g'],
];
const ALLERGENS: AllergenId[] = ['gluten', 'eggs', 'milk'];

const TEXT: Record<Language, ExampleText> = {
  en: {
    name: 'Chocolate cake',
    description: 'A rich, fudgy chocolate cake made in one bowl: the easiest way to impress.',
    ingredients: [
      'dark chocolate',
      'butter',
      'eggs',
      'sugar',
      'flour',
      'a pinch of salt',
      'blueberries',
    ],
    steps: [
      'Heat the oven to 180°C and line a 22 cm cake tin with baking paper.',
      'Melt the chocolate and butter in a bowl over simmering water, stirring, for about 5 minutes. Let it cool a little.',
      'Whisk the eggs with the sugar for 3 minutes, until pale and fluffy.',
      'Fold in the melted chocolate, then the flour and salt, just until smooth.',
      'Pour into the tin and bake for 30 minutes: the middle should still wobble a little.',
      'Let it cool for 15 minutes, then top with blueberries and serve.',
    ],
    tip: 'Take it out while the middle still wobbles: it sets as it cools and stays fudgy.',
    extras: ['blueberries, for freshness', 'whipped cream or vanilla ice cream'],
    pairing: 'An espresso or a glass of cold milk.',
  },
  ro: {
    name: 'Tort de ciocolată',
    description:
      'Un tort de ciocolată bogat și umed, făcut într-un singur bol: cel mai simplu mod de a impresiona.',
    ingredients: [
      'ciocolată neagră',
      'unt',
      'ouă',
      'zahăr',
      'făină',
      'un vârf de cuțit de sare',
      'afine',
    ],
    steps: [
      'Încinge cuptorul la 180°C și tapetează o tavă rotundă de 22 cm cu hârtie de copt.',
      'Topește ciocolata cu untul într-un bol pus peste o oală cu apă fierbinte, amestecând, cam 5 minute. Las-o puțin să se răcească.',
      'Bate ouăle cu zahărul 3 minute, până devin deschise la culoare și pufoase.',
      'Încorporează ciocolata topită, apoi făina și sarea, doar până se omogenizează.',
      'Toarnă compoziția în tavă și coace 30 de minute: mijlocul trebuie să mai tremure puțin.',
      'Lasă tortul să se răcească 15 minute, apoi pune afinele deasupra și servește.',
    ],
    tip: 'Scoate-l când mijlocul încă tremură: se întărește cât se răcește și rămâne umed.',
    extras: ['afine, pentru prospețime', 'frișcă sau înghețată de vanilie'],
    pairing: 'Un espresso sau un pahar cu lapte rece.',
  },
  es: {
    name: 'Tarta de chocolate',
    description:
      'Una tarta de chocolate intensa y jugosa hecha en un solo bol: la forma más fácil de sorprender.',
    ingredients: [
      'chocolate negro',
      'mantequilla',
      'huevos',
      'azúcar',
      'harina',
      'una pizca de sal',
      'arándanos',
    ],
    steps: [
      'Precalienta el horno a 180°C y forra un molde de 22 cm con papel de horno.',
      'Derrite el chocolate con la mantequilla al baño maría, removiendo, unos 5 minutos. Deja que se temple un poco.',
      'Bate los huevos con el azúcar durante 3 minutos, hasta que estén claros y esponjosos.',
      'Incorpora el chocolate derretido y después la harina y la sal, solo hasta que quede liso.',
      'Vierte en el molde y hornea 30 minutos: el centro debe temblar un poco.',
      'Deja enfriar 15 minutos, cubre con arándanos y sirve.',
    ],
    tip: 'Sácala cuando el centro aún tiemble: cuaja al enfriarse y queda jugosa.',
    extras: ['arándanos, para dar frescura', 'nata montada o helado de vainilla'],
    pairing: 'Un espresso o un vaso de leche fría.',
  },
  fr: {
    name: 'Gâteau au chocolat',
    description:
      'Un gâteau au chocolat riche et fondant, fait dans un seul saladier : la façon la plus simple d’impressionner.',
    ingredients: [
      'chocolat noir',
      'beurre',
      'œufs',
      'sucre',
      'farine',
      'une pincée de sel',
      'myrtilles',
    ],
    steps: [
      'Préchauffez le four à 180°C et chemisez un moule de 22 cm de papier cuisson.',
      'Faites fondre le chocolat et le beurre au bain-marie en remuant, environ 5 minutes. Laissez tiédir.',
      'Fouettez les œufs avec le sucre pendant 3 minutes, jusqu’à ce qu’ils blanchissent.',
      'Incorporez le chocolat fondu, puis la farine et le sel, juste jusqu’à ce que ce soit lisse.',
      'Versez dans le moule et faites cuire 30 minutes : le centre doit encore trembler un peu.',
      'Laissez refroidir 15 minutes, ajoutez les myrtilles et servez.',
    ],
    tip: 'Sortez-le quand le centre tremble encore : il prend en refroidissant et reste fondant.',
    extras: ['myrtilles, pour la fraîcheur', 'crème fouettée ou glace vanille'],
    pairing: 'Un espresso ou un verre de lait froid.',
  },
  it: {
    name: 'Torta al cioccolato',
    description:
      'Una torta al cioccolato ricca e morbida, fatta in una sola ciotola: il modo più facile per stupire.',
    ingredients: [
      'cioccolato fondente',
      'burro',
      'uova',
      'zucchero',
      'farina',
      'un pizzico di sale',
      'mirtilli',
    ],
    steps: [
      'Scalda il forno a 180°C e fodera una tortiera da 22 cm con carta da forno.',
      'Sciogli il cioccolato con il burro a bagnomaria, mescolando, per circa 5 minuti. Lascia intiepidire.',
      'Monta le uova con lo zucchero per 3 minuti, finché sono chiare e spumose.',
      'Incorpora il cioccolato fuso, poi la farina e il sale, solo finché è liscio.',
      'Versa nella tortiera e cuoci per 30 minuti: il centro deve ancora tremare un po’.',
      'Lascia raffreddare 15 minuti, poi decora con i mirtilli e servi.',
    ],
    tip: 'Sfornala quando il centro trema ancora: si rassoda raffreddandosi e resta morbida.',
    extras: ['mirtilli, per freschezza', 'panna montata o gelato alla vaniglia'],
    pairing: 'Un espresso o un bicchiere di latte freddo.',
  },
  de: {
    name: 'Schokoladentorte',
    description:
      'Eine saftige, schokoladige Torte aus nur einer Schüssel: der einfachste Weg, Eindruck zu machen.',
    ingredients: [
      'Zartbitterschokolade',
      'Butter',
      'Eier',
      'Zucker',
      'Mehl',
      'eine Prise Salz',
      'Heidelbeeren',
    ],
    steps: [
      'Den Ofen auf 180°C vorheizen und eine 22-cm-Form mit Backpapier auslegen.',
      'Schokolade und Butter über einem Wasserbad unter Rühren etwa 5 Minuten schmelzen. Kurz abkühlen lassen.',
      'Die Eier mit dem Zucker 3 Minuten hell und schaumig schlagen.',
      'Die geschmolzene Schokolade unterheben, dann Mehl und Salz, nur bis alles glatt ist.',
      'In die Form füllen und 30 Minuten backen: Die Mitte darf noch leicht wackeln.',
      'Die Torte 15 Minuten abkühlen lassen, mit Heidelbeeren belegen und servieren.',
    ],
    tip: 'Herausnehmen, solange die Mitte noch wackelt: Beim Abkühlen wird sie fest und bleibt saftig.',
    extras: ['Heidelbeeren, für Frische', 'Schlagsahne oder Vanilleeis'],
    pairing: 'Ein Espresso oder ein Glas kalte Milch.',
  },
};

/**
 * The example recipe every new cookbook starts with, to show what a recipe can hold: a photo, a
 * description, allergens, a diet label, servings to scale, steps with times (timers in Cook
 * mode), a tip, pairings and "goes well with".
 */
export function exampleRecipe(language: Language, source: string): RecipeFormValue {
  const text = TEXT[language] ?? TEXT.en;
  const empty = emptyRecipeForm();
  return {
    ...empty,
    name: text.name,
    category: 'Desserts',
    difficulty: 'Easy',
    prepTime: 15,
    cookTime: 30,
    servings: 8,
    ingredients: text.ingredients.map((name, i) => ({
      qty: AMOUNTS[i][0],
      unit: AMOUNTS[i][1],
      name,
    })),
    steps: [...text.steps],
    description: text.description,
    tip: text.tip,
    extras: text.extras.join('\n'),
    pairing: text.pairing,
    source,
    diets: { ...empty.diets, vegetarian: true },
    allergens: { ...empty.allergens, ...Object.fromEntries(ALLERGENS.map((id) => [id, true])) },
  };
}

/** The photo of the example recipe (the same as on the landing page). */
export const EXAMPLE_PHOTO_URL = 'landing-dish.jpg';

/**
 * 3: the real photo and blueberries, on the cards too (1 was the watercolor with raspberries;
 * 2 had the new photo but still the old small copy on the cards).
 */
export const EXAMPLE_VERSION = 3;

/** Raspberries → blueberries, in every language, for example recipes added before version 2. */
const BERRIES: readonly [RegExp, string][] = [
  [/raspberries/g, 'blueberries'],
  [/Raspberries/g, 'Blueberries'],
  [/zmeura/g, 'afinele'],
  [/zmeură/g, 'afine'],
  [/Zmeură/g, 'Afine'],
  [/frambuesas/g, 'arándanos'],
  [/framboises/g, 'myrtilles'],
  [/lamponi/g, 'mirtilli'],
  [/Himbeeren/g, 'Heidelbeeren'],
];

export function toBlueberries(text: string): string {
  return BERRIES.reduce((result, [from, to]) => result.replace(from, to), text);
}
