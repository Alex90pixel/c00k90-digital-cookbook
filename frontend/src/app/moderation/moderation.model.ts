import { TranslationKey } from '../core/i18n/i18n.types';

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

export const REPORT_REASONS: readonly { id: ReportReason; labelKey: TranslationKey }[] = [
  { id: 'inappropriate-photo', labelKey: 'report.reasons.inappropriate-photo' },
  { id: 'offensive-text', labelKey: 'report.reasons.offensive-text' },
  { id: 'spam', labelKey: 'report.reasons.spam' },
  { id: 'other', labelKey: 'report.reasons.other' },
];

export const FEEDBACK_TYPES: readonly { id: FeedbackType; labelKey: TranslationKey }[] = [
  { id: 'bug', labelKey: 'feedback.types.bug' },
  { id: 'idea', labelKey: 'feedback.types.idea' },
  { id: 'other', labelKey: 'feedback.types.other' },
];

/** Translation key of a stored reason; `null` for unknown values (shown as they are). */
export function reportReasonKey(reason: string): TranslationKey | null {
  return REPORT_REASONS.find((r) => r.id === reason)?.labelKey ?? null;
}

export function feedbackTypeKey(type: string): TranslationKey | null {
  return FEEDBACK_TYPES.find((t) => t.id === type)?.labelKey ?? null;
}
