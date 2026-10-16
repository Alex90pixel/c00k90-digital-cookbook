import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/** Width presets matching the old app's modals. */
export const DIALOG_WIDTH = {
  detail: '820px',
  form: '680px',
  legal: '600px',
  wide: '480px',
  medium: '420px',
  small: '380px',
  confirm: '360px',
} as const;

export interface AppDialogOptions<D> {
  data?: D;
  width: keyof typeof DIALOG_WIDTH;
  /** When true, Escape and backdrop clicks don't close the dialog; the component decides. */
  disableClose?: boolean;
}

/**
 * Opens the app's modals with a consistent look (backdrop, width, panel) on top of the CDK dialog,
 * which handles Escape, focus trapping, scroll locking and stacked dialogs.
 */
@Injectable({ providedIn: 'root' })
export class AppDialog {
  private readonly dialog = inject(Dialog);

  open<C, D = unknown, R = unknown>(
    component: ComponentType<C>,
    options: AppDialogOptions<D>,
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(component, {
      data: options.data,
      width: 'calc(100% - 32px)',
      maxWidth: DIALOG_WIDTH[options.width],
      maxHeight: 'calc(100dvh - 40px)',
      panelClass: 'app-dialog-panel',
      backdropClass: 'app-dialog-backdrop',
      disableClose: options.disableClose ?? false,
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }

  /** Closes every open dialog (e.g. after deleting the account). */
  closeAll(): void {
    this.dialog.closeAll();
  }

  /** Asks a yes/no question; resolves `true` only when the user confirms. */
  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data,
      width: 'confirm',
    });
    return (await firstValueFrom(ref.closed)) === true;
  }
}
