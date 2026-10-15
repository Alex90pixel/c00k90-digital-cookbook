import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { AuthService } from '../core/auth/auth.service';
import { FIRESTORE } from '../core/firebase/firestore.token';
import { FeedbackMessage, FeedbackType, RecipeReport, ReportReason } from './moderation.model';

const REPORTS = 'reports';
const FEEDBACK = 'feedback';

/**
 * Reports and feedback. Every user can send them; only the moderator can read and close them.
 * (The Firestore security rules must enforce that; hiding the inbox in the UI is not protection.)
 */
@Injectable({ providedIn: 'root' })
export class ModerationService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly reportList = signal<RecipeReport[]>([]);
  private readonly feedbackList = signal<FeedbackMessage[]>([]);

  readonly reports = this.reportList.asReadonly();
  readonly feedback = this.feedbackList.asReadonly();
  /** Open items for the badge on the moderator's avatar. */
  readonly openItems = computed(() => this.reportList().length + this.feedbackList().length);

  constructor() {
    effect(() => {
      const isAdmin = this.auth.isAdmin();
      untracked(() => {
        if (isAdmin) void this.refresh();
        else {
          this.reportList.set([]);
          this.feedbackList.set([]);
        }
      });
    });
  }

  async sendReport(
    recipe: { id: string; name: string; userId: string },
    reason: ReportReason,
    text: string,
  ): Promise<void> {
    await addDoc(collection(this.db, REPORTS), {
      recipeId: recipe.id,
      recipeName: recipe.name || '',
      ownerId: recipe.userId || '',
      reason,
      text: text.trim(),
      reporterId: this.auth.requireUser().uid,
      createdAt: Date.now(),
    });
  }

  async sendFeedback(type: FeedbackType, text: string): Promise<void> {
    await addDoc(collection(this.db, FEEDBACK), {
      text: text.trim(),
      type,
      userId: this.auth.requireUser().uid,
      createdAt: Date.now(),
    });
  }

  /** Reloads both inboxes (moderator only). A failed load shows an empty inbox. */
  async refresh(): Promise<void> {
    if (!this.auth.isAdmin()) return;
    const [reports, feedback] = await Promise.all([
      this.readAll<RecipeReport>(REPORTS),
      this.readAll<FeedbackMessage>(FEEDBACK),
    ]);
    this.reportList.set(reports);
    this.feedbackList.set(feedback);
  }

  async dismissReport(reportId: string): Promise<void> {
    await deleteDoc(doc(this.db, REPORTS, reportId));
    this.reportList.update((list) => list.filter((r) => r.id !== reportId));
  }

  async markFeedbackDone(feedbackId: string): Promise<void> {
    await deleteDoc(doc(this.db, FEEDBACK, feedbackId));
    this.feedbackList.update((list) => list.filter((f) => f.id !== feedbackId));
  }

  private async readAll<T extends { createdAt: number }>(name: string): Promise<T[]> {
    try {
      const snapshot = await getDocs(collection(this.db, name));
      return snapshot.docs
        .map((document) => ({ ...(document.data() as T), id: document.id }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {
      return [];
    }
  }
}
