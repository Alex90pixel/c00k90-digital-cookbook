/** One of the user's own recipe groups ("Christmas", "Quick dinners"). */
export interface RecipeCollection {
  id: string;
  name: string;
  /** The user's own recipes and other cooks' shared recipes, in the order they were added. */
  recipeIds: string[];
}

/** A document in the private Firestore `collections` collection (document id = the user's id). */
export interface CollectionsDocument {
  lists: RecipeCollection[];
  updatedAt: number;
}
