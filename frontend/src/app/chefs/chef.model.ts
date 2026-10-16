/** What other cooks can see about a chef who shares recipes. */
export interface ChefProfile {
  id: string;
  displayName: string;
  photoUrl: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

/**
 * A document in the public Firestore `chefs` collection (document id = user id). It only exists
 * while the user shares at least one recipe, and never holds private fields like real names.
 */
export interface ChefDocument extends Omit<ChefProfile, 'id'> {
  /** Milliseconds since epoch. */
  updatedAt: number;
}

/** A document in the private Firestore `follows` collection (document id = the follower's id). */
export interface FollowsDocument {
  chefIds: string[];
  updatedAt: number;
}
