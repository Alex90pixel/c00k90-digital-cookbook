import { Component, computed, input } from '@angular/core';
import { SOCIAL_PLATFORMS, normalizeSocialLink } from '../../account/profile/social-links';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ChefProfile } from '../chef.model';

/** Round icon links to a chef's social media profiles. */
@Component({
  selector: 'app-social-icons',
  imports: [TranslatePipe],
  template: `
    @for (link of links(); track link.id) {
      <a
        class="social-link"
        [href]="link.url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        [title]="link.label"
        [attr.aria-label]="'chefs.socialLink' | t: { platform: link.label, name: name() }"
      >
        <span aria-hidden="true">{{ link.icon }}</span>
      </a>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--border);
      border-radius: 50%;
      background: var(--card-soft);
      font-size: 15px;
      text-decoration: none;
      transition: all 0.2s;

      &:hover,
      &:focus-visible {
        outline: none;
        border-color: var(--teal-light);
        background: var(--teal-pale);
      }
    }
  `,
})
export class SocialIcons {
  readonly chef = input.required<ChefProfile>();
  readonly name = input.required<string>();

  /**
   * Links are re-checked here: chef profiles are written by their owners, and only real
   * profile links on the right site may become clickable.
   */
  protected readonly links = computed(() => {
    const chef = this.chef();
    return SOCIAL_PLATFORMS.flatMap((platform) => {
      const url = chef[platform.id] ? normalizeSocialLink(platform.id, chef[platform.id]) : null;
      return url ? [{ id: platform.id, icon: platform.icon, label: platform.label, url }] : [];
    });
  });
}
