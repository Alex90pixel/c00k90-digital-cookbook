import { DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { PhotoConsent } from '../../shared/dialog/photo-consent.service';
import { PROFILE_LIMITS, PhotoChange, UserProfile, emptyProfile } from './profile.model';
import { ProfileService } from './profile.service';
import { SOCIAL_PLATFORMS, normalizeSocialLink } from './social-links';

@Component({
  selector: 'app-profile-dialog',
  imports: [FormField, TranslatePipe],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss',
})
export class ProfileDialog {
  private readonly profiles = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly photoConsent = inject(PhotoConsent);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);

  protected readonly platforms = SOCIAL_PLATFORMS;
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);

  protected readonly model = signal<UserProfile>(emptyProfile(this.auth.displayName() ?? ''));

  // Photo: changed in the dialog, uploaded only when saving.
  protected readonly photoChange = signal<PhotoChange>({ kind: 'keep' });
  private readonly pickedPreviewUrl = signal<string | null>(null);
  protected readonly preparingPhoto = signal(false);
  protected readonly hasOwnPhoto = computed(() => {
    const change = this.photoChange();
    return change.kind === 'replace' || (change.kind === 'keep' && !!this.model().photoUrl);
  });
  protected readonly photoPreviewUrl = computed(() => {
    switch (this.photoChange().kind) {
      case 'replace':
        return this.pickedPreviewUrl();
      case 'remove':
        return this.auth.defaultAvatarUrl();
      default:
        return this.model().photoUrl || this.auth.avatarUrl();
    }
  });
  protected readonly profileForm = form(this.model, (profile) => {
    required(profile.displayName, { message: this.i18n.t('profile.displayNameRequired') });
    maxLength(profile.displayName, PROFILE_LIMITS.displayName);
    maxLength(profile.firstName, PROFILE_LIMITS.name);
    maxLength(profile.lastName, PROFILE_LIMITS.name);
    for (const platform of SOCIAL_PLATFORMS) {
      validate(profile[platform.id], ({ value }) =>
        normalizeSocialLink(platform.id, value()) === null
          ? {
              kind: 'socialLink',
              message: this.i18n.t('profile.socialInvalid', { platform: platform.label }),
            }
          : null,
      );
    }
  });

  constructor() {
    void this.load();
    inject(DestroyRef).onDestroy(() => this.setPickedPreview(null));
  }

  protected async pickPhoto(input: HTMLInputElement): Promise<void> {
    if (await this.photoConsent.ask()) input.click();
  }

  protected async photoPicked(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.show(this.i18n.t('profile.chooseImage'));
      return;
    }
    this.preparingPhoto.set(true);
    try {
      const photo = await this.profiles.preparePhoto(file);
      this.setPickedPreview(URL.createObjectURL(photo));
      this.photoChange.set({ kind: 'replace', file: photo });
    } catch {
      this.toast.show(this.i18n.t('profile.badImage'));
    } finally {
      this.preparingPhoto.set(false);
    }
  }

  protected removePhoto(): void {
    this.setPickedPreview(null);
    this.photoChange.set({ kind: 'remove' });
  }

  private setPickedPreview(url: string | null): void {
    const previous = this.pickedPreviewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.pickedPreviewUrl.set(url);
  }

  protected async save(): Promise<void> {
    if (this.saving() || this.loading() || this.preparingPhoto()) return;
    if (this.profileForm().invalid()) {
      this.profileForm().markAsTouched();
      const firstError = this.profileForm().errorSummary()[0];
      this.toast.show(firstError?.message ?? this.i18n.t('profile.checkProfile'));
      firstError?.fieldTree().focusBoundControl();
      return;
    }
    this.saving.set(true);
    try {
      await this.profiles.save(normalized(this.model()), this.photoChange());
      this.toast.show(this.i18n.t('profile.saved'));
      this.ref.close();
    } catch (error) {
      console.error('Saving the profile failed', error);
      this.toast.show(this.i18n.t('profile.saveFailed'));
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.model.set(await this.profiles.load());
    } catch (error) {
      console.error('Loading the profile failed', error);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

/** Trimmed names and full profile URLs, as stored in Firestore. */
function normalized(profile: UserProfile): UserProfile {
  const result: UserProfile = {
    ...profile,
    displayName: profile.displayName.trim(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
  };
  for (const platform of SOCIAL_PLATFORMS) {
    result[platform.id] = normalizeSocialLink(platform.id, profile[platform.id]) ?? '';
  }
  return result;
}
