import { Injectable, inject } from '@angular/core';
import { AppDialog } from '../shared/dialog/app-dialog.service';

/** Opens a chef's profile. Loaded on first use, like the recipe dialogs. */
@Injectable({ providedIn: 'root' })
export class ChefDialogs {
  private readonly dialog = inject(AppDialog);

  async openChef(chefId: string): Promise<void> {
    const { ChefDialog } = await import('./dialogs/chef-dialog');
    this.dialog.open(ChefDialog, { data: chefId, width: 'form' });
  }
}
