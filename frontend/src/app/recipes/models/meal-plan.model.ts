/** A document in the private Firestore `mealPlans` collection (document id = the user's id). */
export interface MealPlanDocument {
  /** Recipe ids planned for each day, by local date ("2026-10-27"). */
  days: Record<string, string[]>;
  updatedAt: number;
}

/** One day of the week shown in the planner. */
export interface PlanDay {
  /** Local date, "2026-10-27". */
  date: string;
  isToday: boolean;
}
