import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdateService } from './app-update.service';

function setup(visibility: 'visible' | 'hidden') {
  const versionUpdates = new Subject<{ type: string }>();
  const reload = vi.fn();
  const listeners: Record<string, () => void> = {};
  const fakeDocument = {
    visibilityState: visibility,
    location: { reload },
    addEventListener: (name: string, fn: () => void) => (listeners[name] = fn),
    removeEventListener: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: fakeDocument },
      {
        provide: SwUpdate,
        useValue: {
          isEnabled: true,
          versionUpdates,
          unrecoverable: new Subject(),
          checkForUpdate: vi.fn().mockResolvedValue(false),
        },
      },
    ],
  });
  TestBed.inject(AppUpdateService).start();
  return { versionUpdates, reload, fakeDocument, listeners };
}

describe('AppUpdateService', () => {
  it('switches to a new version at once when the app is not on screen', () => {
    const { versionUpdates, reload } = setup('hidden');
    versionUpdates.next({ type: 'VERSION_READY' });
    expect(reload).toHaveBeenCalled();
  });

  it('waits until the cook comes back to the app, never reloading under their fingers', () => {
    const { versionUpdates, reload, fakeDocument, listeners } = setup('visible');
    versionUpdates.next({ type: 'VERSION_READY' });
    expect(reload).not.toHaveBeenCalled();
    fakeDocument.visibilityState = 'hidden';
    listeners['visibilitychange']();
    fakeDocument.visibilityState = 'visible';
    listeners['visibilitychange']();
    expect(reload).toHaveBeenCalled();
  });
});
