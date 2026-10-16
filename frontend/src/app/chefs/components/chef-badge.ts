import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { chefAvatarUrl } from '../chef-display';
import { ChefDialogs } from '../chef-dialogs.service';
import { ChefService } from '../chef.service';

/** Avatar and name of a chef; opens the chef's profile. */
@Component({
  selector: 'app-chef-badge',
  imports: [TranslatePipe],
  host: { '[class]': '"size-" + size()' },
  template: `
    <button
      type="button"
      class="chef-badge"
      [attr.aria-label]="'chefs.openProfile' | t: { name: name() }"
      (click)="$event.stopPropagation(); dialogs.openChef(chefId())"
    >
      <img class="avatar" [src]="avatarUrl()" alt="" referrerpolicy="no-referrer" />
      <span class="name">{{ name() }}</span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      min-width: 0;
    }
    .chef-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      padding: 2px 10px 2px 2px;
      border: 1px solid var(--border);
      border-radius: 50px;
      background: var(--card-soft);
      color: var(--text-dark);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover,
      &:focus-visible {
        outline: none;
        border-color: var(--teal-light);
        background: var(--teal-pale);
      }
    }
    .avatar {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :host(.size-medium) {
      .chef-badge {
        padding-right: 14px;
        font-size: 14px;
      }
      .avatar {
        width: 32px;
        height: 32px;
      }
    }
  `,
})
export class ChefBadge {
  private readonly chefs = inject(ChefService);
  private readonly i18n = inject(I18nService);
  protected readonly dialogs = inject(ChefDialogs);

  readonly chefId = input.required<string>();
  readonly size = input<'small' | 'medium'>('small');

  private readonly chef = computed(() => this.chefs.chef(this.chefId()));
  protected readonly name = computed(
    () => this.chef()?.displayName || this.i18n.t('chefs.unknown'),
  );
  protected readonly avatarUrl = computed(() => chefAvatarUrl(this.chef(), this.name()));

  constructor() {
    effect(() => {
      const id = this.chefId();
      untracked(() => this.chefs.request([id]));
    });
  }
}
