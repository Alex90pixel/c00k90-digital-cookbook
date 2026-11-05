import { Language } from '../../core/i18n/i18n.service';
import { RecipeFormValue } from '../models/recipe-form.model';
import { AllergenId, Category, Difficulty } from '../models/recipe.model';
import { emptyRecipeForm } from './recipe-form';

/** The parts of a starter recipe that change with the language. */
interface StarterText {
  name: string;
  description: string;
  /** Ingredient names, in the same order as `amounts`. */
  ingredients: string[];
  steps: string[];
  tip: string;
  extras: string[];
}

interface StarterRecipe {
  category: Category;
  difficulty: Difficulty;
  prepTime: number;
  cookTime: number;
  servings: number;
  allergens: AllergenId[];
  vegetarian: boolean;
  /** [quantity, unit] for each ingredient. */
  amounts: [string, string][];
  text: Record<Language, StarterText>;
}

/**
 * Three example recipes for a brand-new, empty cookbook, so people can see straight away how a
 * recipe, Cook mode (the steps have times, so timers show up), allergens and the rest look.
 */
const STARTERS: readonly StarterRecipe[] = [
  {
    category: 'Breakfast',
    difficulty: 'Easy',
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    allergens: ['gluten', 'eggs', 'milk'],
    vegetarian: true,
    amounts: [
      ['200', 'g'],
      ['2', ''],
      ['300', 'ml'],
      ['20', 'g'],
      ['10', 'g'],
      ['30', 'g'],
    ],
    text: {
      en: {
        name: 'Fluffy pancakes',
        description: 'Soft, thick pancakes for a slow weekend breakfast.',
        ingredients: ['flour', 'eggs', 'milk', 'sugar', 'baking powder', 'melted butter'],
        steps: [
          'Whisk the flour, sugar and baking powder in a bowl.',
          'In another bowl, whisk the eggs, milk and melted butter.',
          'Pour the wet mix into the dry one, stir just until combined and let it rest 10 minutes.',
          'Cook ladlefuls in a lightly greased pan, about 2 minutes on each side.',
        ],
        tip: 'Do not overmix: a few lumps make them fluffier.',
        extras: ['berries, for freshness', 'maple syrup or honey'],
      },
      ro: {
        name: 'Clătite pufoase',
        description: 'Clătite groase și moi, pentru un mic dejun liniștit de weekend.',
        ingredients: ['făină', 'ouă', 'lapte', 'zahăr', 'praf de copt', 'unt topit'],
        steps: [
          'Amestecă făina, zahărul și praful de copt într-un bol.',
          'Într-un alt bol, bate ouăle cu laptele și untul topit.',
          'Toarnă amestecul lichid peste cel uscat, amestecă doar cât se omogenizează și lasă-l 10 minute.',
          'Coace câte un polonic într-o tigaie unsă ușor, cam 2 minute pe fiecare parte.',
        ],
        tip: 'Nu amesteca prea mult: câteva cocoloașe le fac mai pufoase.',
        extras: ['fructe de pădure, pentru prospețime', 'sirop de arțar sau miere'],
      },
      es: {
        name: 'Tortitas esponjosas',
        description: 'Tortitas gruesas y suaves para un desayuno tranquilo de fin de semana.',
        ingredients: [
          'harina',
          'huevos',
          'leche',
          'azúcar',
          'levadura química',
          'mantequilla derretida',
        ],
        steps: [
          'Mezcla la harina, el azúcar y la levadura en un bol.',
          'En otro bol, bate los huevos con la leche y la mantequilla derretida.',
          'Vierte la mezcla líquida sobre la seca, remueve lo justo y deja reposar 10 minutos.',
          'Cocina cucharones en una sartén apenas engrasada, unos 2 minutos por cada lado.',
        ],
        tip: 'No mezcles de más: unos grumos las hacen más esponjosas.',
        extras: ['frutos rojos, para dar frescor', 'sirope de arce o miel'],
      },
      fr: {
        name: 'Pancakes moelleux',
        description:
          'Des pancakes épais et moelleux pour un petit-déjeuner tranquille du week-end.',
        ingredients: ['farine', 'œufs', 'lait', 'sucre', 'levure chimique', 'beurre fondu'],
        steps: [
          'Mélangez la farine, le sucre et la levure dans un saladier.',
          'Dans un autre bol, fouettez les œufs avec le lait et le beurre fondu.',
          'Versez le mélange liquide sur le sec, mélangez juste assez et laissez reposer 10 minutes.',
          'Faites cuire des louches dans une poêle légèrement graissée, environ 2 minutes de chaque côté.',
        ],
        tip: 'Ne mélangez pas trop : quelques grumeaux les rendent plus moelleux.',
        extras: ['des fruits rouges, pour la fraîcheur', "du sirop d'érable ou du miel"],
      },
      it: {
        name: 'Pancake soffici',
        description: 'Pancake alti e morbidi per una colazione tranquilla nel weekend.',
        ingredients: ['farina', 'uova', 'latte', 'zucchero', 'lievito per dolci', 'burro fuso'],
        steps: [
          'Mescola la farina, lo zucchero e il lievito in una ciotola.',
          'In un’altra ciotola, sbatti le uova con il latte e il burro fuso.',
          'Versa i liquidi sugli ingredienti secchi, mescola appena e lascia riposare 10 minuti.',
          'Cuoci un mestolo alla volta in una padella appena unta, circa 2 minuti per lato.',
        ],
        tip: 'Non mescolare troppo: qualche grumo li rende più soffici.',
        extras: ['frutti di bosco, per freschezza', 'sciroppo d’acero o miele'],
      },
      de: {
        name: 'Fluffige Pfannkuchen',
        description: 'Dicke, weiche Pfannkuchen für ein gemütliches Wochenendfrühstück.',
        ingredients: ['Mehl', 'Eier', 'Milch', 'Zucker', 'Backpulver', 'geschmolzene Butter'],
        steps: [
          'Mehl, Zucker und Backpulver in einer Schüssel mischen.',
          'In einer zweiten Schüssel Eier, Milch und geschmolzene Butter verquirlen.',
          'Die flüssige Mischung zur trockenen geben, nur kurz verrühren und 10 Minuten ruhen lassen.',
          'Je eine Kelle in einer leicht gefetteten Pfanne backen, etwa 2 Minuten pro Seite.',
        ],
        tip: 'Nicht zu lange rühren: ein paar Klümpchen machen sie fluffiger.',
        extras: ['Beeren, für Frische', 'Ahornsirup oder Honig'],
      },
    },
  },
  {
    category: 'Soups',
    difficulty: 'Easy',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    allergens: ['milk', 'celery'],
    vegetarian: true,
    amounts: [
      ['1', 'kg'],
      ['1', ''],
      ['2', ''],
      ['500', 'ml'],
      ['100', 'ml'],
      ['30', 'ml'],
    ],
    text: {
      en: {
        name: 'Creamy tomato soup',
        description: 'A warm, velvety tomato soup that is ready in about 40 minutes.',
        ingredients: [
          'ripe tomatoes',
          'onion',
          'garlic cloves',
          'vegetable stock',
          'cream',
          'olive oil',
        ],
        steps: [
          'Soften the chopped onion in the olive oil for 5 minutes.',
          'Add the garlic and the chopped tomatoes and cook for 10 minutes.',
          'Pour in the stock and simmer for 15 minutes.',
          'Blend until smooth, stir in the cream and season to taste.',
        ],
        tip: 'A pinch of sugar balances tomatoes that are too sour.',
        extras: ['fresh basil, for aroma', 'toasted bread, to dip'],
      },
      ro: {
        name: 'Supă cremă de roșii',
        description: 'O supă caldă și catifelată de roșii, gata în vreo 40 de minute.',
        ingredients: [
          'roșii coapte',
          'ceapă',
          'căței de usturoi',
          'supă de legume',
          'smântână lichidă',
          'ulei de măsline',
        ],
        steps: [
          'Călește ceapa tocată în uleiul de măsline 5 minute.',
          'Adaugă usturoiul și roșiile tăiate și gătește 10 minute.',
          'Toarnă supa de legume și fierbe 15 minute.',
          'Pasează până devine cremoasă, adaugă smântâna și potrivește de gust.',
        ],
        tip: 'Un vârf de zahăr echilibrează roșiile prea acre.',
        extras: ['busuioc proaspăt, pentru aromă', 'pâine prăjită, de înmuiat'],
      },
      es: {
        name: 'Crema de tomate',
        description: 'Una crema de tomate cálida y suave, lista en unos 40 minutos.',
        ingredients: [
          'tomates maduros',
          'cebolla',
          'dientes de ajo',
          'caldo de verduras',
          'nata',
          'aceite de oliva',
        ],
        steps: [
          'Pocha la cebolla picada en el aceite de oliva 5 minutos.',
          'Añade el ajo y los tomates troceados y cocina 10 minutos.',
          'Vierte el caldo y deja hervir a fuego suave 15 minutos.',
          'Tritura hasta que quede fina, añade la nata y sazona al gusto.',
        ],
        tip: 'Una pizca de azúcar equilibra los tomates demasiado ácidos.',
        extras: ['albahaca fresca, para dar aroma', 'pan tostado, para mojar'],
      },
      fr: {
        name: 'Velouté de tomates',
        description: 'Un velouté de tomates chaud et onctueux, prêt en 40 minutes environ.',
        ingredients: [
          'tomates mûres',
          'oignon',
          "gousses d'ail",
          'bouillon de légumes',
          'crème',
          "huile d'olive",
        ],
        steps: [
          "Faites revenir l'oignon haché dans l'huile d'olive 5 minutes.",
          "Ajoutez l'ail et les tomates coupées et laissez cuire 10 minutes.",
          'Versez le bouillon et laissez mijoter 15 minutes.',
          'Mixez finement, ajoutez la crème et assaisonnez.',
        ],
        tip: 'Une pincée de sucre équilibre des tomates trop acides.',
        extras: ['du basilic frais, pour le parfum', 'du pain grillé, à tremper'],
      },
      it: {
        name: 'Vellutata di pomodoro',
        description: 'Una vellutata di pomodoro calda e cremosa, pronta in circa 40 minuti.',
        ingredients: [
          'pomodori maturi',
          'cipolla',
          'spicchi d’aglio',
          'brodo vegetale',
          'panna',
          'olio d’oliva',
        ],
        steps: [
          'Fai appassire la cipolla tritata nell’olio per 5 minuti.',
          'Aggiungi l’aglio e i pomodori a pezzi e cuoci 10 minuti.',
          'Versa il brodo e lascia sobbollire 15 minuti.',
          'Frulla fino a renderla liscia, unisci la panna e regola di sale.',
        ],
        tip: 'Un pizzico di zucchero bilancia i pomodori troppo acidi.',
        extras: ['basilico fresco, per il profumo', 'pane tostato, da intingere'],
      },
      de: {
        name: 'Cremige Tomatensuppe',
        description: 'Eine warme, samtige Tomatensuppe, fertig in etwa 40 Minuten.',
        ingredients: [
          'reife Tomaten',
          'Zwiebel',
          'Knoblauchzehen',
          'Gemüsebrühe',
          'Sahne',
          'Olivenöl',
        ],
        steps: [
          'Die gehackte Zwiebel 5 Minuten im Olivenöl andünsten.',
          'Knoblauch und gehackte Tomaten dazugeben und 10 Minuten kochen.',
          'Die Brühe angießen und 15 Minuten köcheln lassen.',
          'Fein pürieren, die Sahne einrühren und abschmecken.',
        ],
        tip: 'Eine Prise Zucker gleicht zu saure Tomaten aus.',
        extras: ['frisches Basilikum, für Aroma', 'geröstetes Brot, zum Eintunken'],
      },
    },
  },
  {
    category: 'Mains',
    difficulty: 'Medium',
    prepTime: 10,
    cookTime: 30,
    servings: 2,
    allergens: [],
    vegetarian: false,
    amounts: [
      ['2', ''],
      ['150', 'g'],
      ['1', ''],
      ['3', ''],
      ['30', 'ml'],
      ['', ''],
    ],
    text: {
      en: {
        name: 'Lemon garlic chicken with rice',
        description: 'Juicy chicken with a bright lemon and garlic sauce, served on fluffy rice.',
        ingredients: [
          'chicken breasts',
          'rice',
          'lemon',
          'garlic cloves',
          'olive oil',
          'salt and pepper',
        ],
        steps: [
          'Rinse the rice and cook it in salted water for 15 minutes.',
          'Season the chicken with salt and pepper.',
          'Cook the chicken in the olive oil for 6 minutes on each side.',
          'Add the sliced garlic and the lemon juice and cook for 1 more minute.',
          'Let the chicken rest for 5 minutes, then slice it and serve on the rice.',
        ],
        tip: 'Resting the chicken keeps it juicy.',
        extras: ['steamed broccoli, for colour', 'fresh parsley, for freshness'],
      },
      ro: {
        name: 'Pui cu lămâie și usturoi, cu orez',
        description: 'Piept de pui suculent, cu sos de lămâie și usturoi, servit pe orez pufos.',
        ingredients: [
          'piepți de pui',
          'orez',
          'lămâie',
          'căței de usturoi',
          'ulei de măsline',
          'sare și piper',
        ],
        steps: [
          'Spală orezul și fierbe-l în apă cu sare 15 minute.',
          'Condimentează puiul cu sare și piper.',
          'Gătește puiul în uleiul de măsline câte 6 minute pe fiecare parte.',
          'Adaugă usturoiul feliat și sucul de lămâie și mai gătește 1 minut.',
          'Lasă puiul să stea 5 minute, apoi feliază-l și servește-l pe orez.',
        ],
        tip: 'Dacă lași puiul să stea înainte de tăiat, rămâne suculent.',
        extras: ['broccoli la abur, pentru culoare', 'pătrunjel proaspăt, pentru prospețime'],
      },
      es: {
        name: 'Pollo al limón y ajo con arroz',
        description: 'Pollo jugoso con una salsa fresca de limón y ajo, sobre arroz suelto.',
        ingredients: [
          'pechugas de pollo',
          'arroz',
          'limón',
          'dientes de ajo',
          'aceite de oliva',
          'sal y pimienta',
        ],
        steps: [
          'Lava el arroz y cuécelo en agua con sal 15 minutos.',
          'Salpimienta el pollo.',
          'Cocina el pollo en el aceite 6 minutos por cada lado.',
          'Añade el ajo en láminas y el zumo de limón y cocina 1 minuto más.',
          'Deja reposar el pollo 5 minutos, córtalo y sírvelo sobre el arroz.',
        ],
        tip: 'Dejar reposar el pollo lo mantiene jugoso.',
        extras: ['brócoli al vapor, para dar color', 'perejil fresco, para dar frescor'],
      },
      fr: {
        name: 'Poulet citron-ail et riz',
        description: "Un poulet juteux, une sauce vive au citron et à l'ail, sur un riz moelleux.",
        ingredients: [
          'blancs de poulet',
          'riz',
          'citron',
          "gousses d'ail",
          "huile d'olive",
          'sel et poivre',
        ],
        steps: [
          "Rincez le riz et faites-le cuire 15 minutes dans l'eau salée.",
          'Salez et poivrez le poulet.',
          "Faites cuire le poulet dans l'huile 6 minutes de chaque côté.",
          "Ajoutez l'ail émincé et le jus de citron et laissez cuire encore 1 minute.",
          'Laissez reposer le poulet 5 minutes, tranchez-le et servez-le sur le riz.',
        ],
        tip: 'Laisser reposer le poulet le garde juteux.',
        extras: ['du brocoli vapeur, pour la couleur', 'du persil frais, pour la fraîcheur'],
      },
      it: {
        name: 'Pollo al limone e aglio con riso',
        description: 'Pollo succoso con una salsa fresca al limone e aglio, su riso soffice.',
        ingredients: [
          'petti di pollo',
          'riso',
          'limone',
          'spicchi d’aglio',
          'olio d’oliva',
          'sale e pepe',
        ],
        steps: [
          'Sciacqua il riso e cuocilo in acqua salata per 15 minuti.',
          'Condisci il pollo con sale e pepe.',
          'Cuoci il pollo nell’olio per 6 minuti per lato.',
          'Aggiungi l’aglio a fettine e il succo di limone e cuoci ancora 1 minuto.',
          'Lascia riposare il pollo 5 minuti, taglialo a fette e servilo sul riso.',
        ],
        tip: 'Far riposare il pollo lo mantiene succoso.',
        extras: ['broccoli al vapore, per colore', 'prezzemolo fresco, per freschezza'],
      },
      de: {
        name: 'Zitronen-Knoblauch-Hähnchen mit Reis',
        description: 'Saftiges Hähnchen mit frischer Zitronen-Knoblauch-Soße auf lockerem Reis.',
        ingredients: [
          'Hähnchenbrustfilets',
          'Reis',
          'Zitrone',
          'Knoblauchzehen',
          'Olivenöl',
          'Salz und Pfeffer',
        ],
        steps: [
          'Den Reis waschen und 15 Minuten in Salzwasser kochen.',
          'Das Hähnchen mit Salz und Pfeffer würzen.',
          'Das Hähnchen im Olivenöl 6 Minuten pro Seite braten.',
          'Den geschnittenen Knoblauch und den Zitronensaft zugeben und noch 1 Minute garen.',
          'Das Hähnchen 5 Minuten ruhen lassen, dann aufschneiden und auf dem Reis servieren.',
        ],
        tip: 'Wenn das Hähnchen ruht, bleibt es saftig.',
        extras: ['gedämpfter Brokkoli, für Farbe', 'frische Petersilie, für Frische'],
      },
    },
  },
];

/** The starter recipes as form values, in the user's language. */
export function starterRecipes(language: Language, source: string): RecipeFormValue[] {
  return STARTERS.map((starter) => {
    const text = starter.text[language] ?? starter.text.en;
    const empty = emptyRecipeForm();
    return {
      ...empty,
      name: text.name,
      category: starter.category,
      difficulty: starter.difficulty,
      prepTime: starter.prepTime,
      cookTime: starter.cookTime,
      servings: starter.servings,
      ingredients: text.ingredients.map((name, i) => ({
        qty: starter.amounts[i][0],
        unit: starter.amounts[i][1],
        name,
      })),
      steps: [...text.steps],
      description: text.description,
      tip: text.tip,
      extras: text.extras.join('\n'),
      source,
      diets: { ...empty.diets, vegetarian: starter.vegetarian },
      allergens: {
        ...empty.allergens,
        ...Object.fromEntries(starter.allergens.map((id) => [id, true])),
      },
    };
  });
}
