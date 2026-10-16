import { Component, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { ChefService } from '../chef.service';
import { FollowService } from '../follow.service';

/** "+ Follow" / "✓ Following" toggle; hidden on the user's own recipes. */
@Component({
  selector: 'app-follow-button',
  imports: [TranslatePipe],
  template: `
    @if (!isMe()) {
      <button
        type="button"
        class="btn-action"
        [class.primary]="!following()"
        [attr.aria-pressed]="following()"
        [attr.aria-label]="
          (following() ? 'chefs.unfollowName' : 'chefs.followName') | t: { name: name() }
        "
        [disabled]="busy()"
        (click)="$event.stopPropagation(); toggle()"
      >
        {{ (following() ? 'chefs.following' : 'chefs.follow') | t }}
      </button>
    }
  `,
})
export class FollowButton {
  private readonly auth = inject(AuthService);
  private readonly follows = inject(FollowService);
  private readonly chefs = inject(ChefService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  readonly chefId = input.required<string>();

  protected readonly busy = signal(false);
  protected readonly isMe = computed(() => this.chefId() === this.auth.user()?.uid);
  protected readonly following = computed(() => this.follows.isFollowing(this.chefId()));
  protected readonly name = computed(
    () => this.chefs.chef(this.chefId())?.displayName || this.i18n.t('chefs.unknown'),
  );

  protected async toggle(): Promise<void> {
    this.busy.set(true);
    const name = this.name();
    try {
      if (this.following()) {
        await this.follows.unfollow(this.chefId());
        this.toast.show(this.i18n.t('chefs.unfollowed', { name }));
      } else {
        await this.follows.follow(this.chefId());
        this.toast.show(this.i18n.t('chefs.followed', { name }));
      }
    } catch (error) {
      console.error('Follow change failed', error);
      this.toast.show(this.i18n.t('chefs.followFailed'));
    } finally {
      this.busy.set(false);
    }
  }
}
