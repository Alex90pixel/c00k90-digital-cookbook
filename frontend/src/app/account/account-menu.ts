import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { FeedbackInboxDialog } from '../moderation/dialogs/feedback-inbox-dialog';
import { ReportsDialog } from '../moderation/dialogs/reports-dialog';
import { ModerationService } from '../moderation/moderation.service';
import { AppDialog } from '../shared/dialog/app-dialog.service';
import { MealPlanDialog } from '../recipes/dialogs/meal-plan-dialog';
import { CookbookExportDialog } from '../recipes/dialogs/cookbook-export-dialog';
import { CollectionsDialog } from './dialogs/collections-dialog';
import { ProfileDialog } from './profile/profile-dialog';
import { SettingsDialog } from './settings/settings-dialog';

/**
 * Avatar button with the account menu: the moderator's inboxes, then the kitchen tools (meal
 * plan, collections, printable cookbook), then the account (profile, settings, sign out).
 */
@Component({
  selector: 'app-account-menu',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem, TranslatePipe],
  template: `
    @if (auth.avatarUrl(); as avatar) {
      <button
        type="button"
        class="avatar-btn"
        [attr.aria-label]="'menu.label' | t"
        [cdkMenuTriggerFor]="menu"
        [cdkMenuPosition]="menuPosition"
      >
        <img class="user-avatar" [src]="avatar" alt="" referrerpolicy="no-referrer" />
        @if (auth.isAdmin() && moderation.openItems()) {
          <span
            class="report-badge"
            [attr.aria-label]="'menu.openItems' | t: { count: moderation.openItems() }"
            >{{ moderation.openItems() }}</span
          >
        }
      </button>
    }

    <ng-template #menu>
      <div class="account-dropdown" cdkMenu>
        @if (auth.isAdmin()) {
          <button
            type="button"
            cdkMenuItem
            class="menu-item"
            (cdkMenuItemTriggered)="open('reports')"
          >
            {{ 'menu.reports' | t
            }}{{ moderation.reports().length ? ' (' + moderation.reports().length + ')' : '' }}
          </button>
          <button
            type="button"
            cdkMenuItem
            class="menu-item"
            (cdkMenuItemTriggered)="open('feedbackInbox')"
          >
            {{ 'menu.feedbackInbox' | t
            }}{{ moderation.feedback().length ? ' (' + moderation.feedback().length + ')' : '' }}
          </button>
          <hr class="dropdown-divider" />
        }
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('mealPlan')"
        >
          {{ 'mealPlan.menu' | t }}
        </button>
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('collections')"
        >
          {{ 'menu.collections' | t }}
        </button>
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('cookbook')"
        >
          {{ 'menu.cookbook' | t }}
        </button>
        <hr class="dropdown-divider" />
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('profile')"
        >
          {{ 'menu.profile' | t }}
        </button>
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('settings')"
        >
          {{ 'menu.settings' | t }}
        </button>
        <hr class="dropdown-divider" />
        <button type="button" cdkMenuItem class="menu-item" (cdkMenuItemTriggered)="signOut()">
          {{ 'menu.signOut' | t }}
        </button>
      </div>
    </ng-template>
  `,
  styleUrl: './account-menu.scss',
})
export class AccountMenu {
  protected readonly auth = inject(AuthService);
  protected readonly moderation = inject(ModerationService);
  private readonly dialog = inject(AppDialog);
  private readonly router = inject(Router);

  /** Opens below the avatar, aligned to its right edge. */
  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  ];

  protected open(
    dialog:
      | 'reports'
      | 'feedbackInbox'
      | 'profile'
      | 'settings'
      | 'mealPlan'
      | 'collections'
      | 'cookbook',
  ): void {
    switch (dialog) {
      case 'reports':
        this.dialog.open(ReportsDialog, { width: 'wide' });
        break;
      case 'feedbackInbox':
        this.dialog.open(FeedbackInboxDialog, { width: 'wide' });
        break;
      case 'profile':
        this.dialog.open(ProfileDialog, { width: 'legal' });
        break;
      case 'settings':
        this.dialog.open(SettingsDialog, { width: 'wide' });
        break;
      case 'mealPlan':
        this.dialog.open(MealPlanDialog, { width: 'wide' });
        break;
      case 'collections':
        this.dialog.open(CollectionsDialog, { width: 'medium' });
        break;
      case 'cookbook':
        this.dialog.open(CookbookExportDialog, { width: 'wide' });
        break;
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
