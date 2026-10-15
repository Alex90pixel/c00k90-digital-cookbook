export type ReportReason = 'inappropriate-photo' | 'offensive-text' | 'spam' | 'other';
export type FeedbackType = 'bug' | 'idea' | 'other';

/** A document in the Firestore `reports` collection. */
export interface RecipeReport {
  id: string;
  recipeId: string;
  recipeName: string;
  ownerId: string;
  reason: ReportReason | string;
  text: string;
  reporterId: string;
  createdAt: number;
}

/** A document in the Firestore `feedback` collection. */
export interface FeedbackMessage {
  id: string;
  type: FeedbackType | string;
  text: string;
  userId: string;
  createdAt: number;
}

export const REPORT_REASONS: readonly { id: ReportReason; label: string }[] = [
  { id: 'inappropriate-photo', label: 'Inappropriate photo' },
  { id: 'offensive-text', label: 'Offensive text' },
  { id: 'spam', label: 'Spam or advertising' },
  { id: 'other', label: 'Something else' },
];

export const FEEDBACK_TYPES: readonly { id: FeedbackType; label: string }[] = [
  { id: 'bug', label: "🐞 Something's broken" },
  { id: 'idea', label: '💡 Idea' },
  { id: 'other', label: '💬 Other' },
];

export function reportReasonLabel(reason: string): string {
  return REPORT_REASONS.find((r) => r.id === reason)?.label ?? reason;
}

export function feedbackTypeLabel(type: string): string {
  return FEEDBACK_TYPES.find((t) => t.id === type)?.label ?? type;
}
