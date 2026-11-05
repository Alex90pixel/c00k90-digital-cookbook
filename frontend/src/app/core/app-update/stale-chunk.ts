import { ErrorHandler, Injectable } from '@angular/core';

/**
 * After a deploy, a tab that was already open still asks for the old code files, which are gone.
 * The browser then fails to load that part of the app. Reloading the page once fixes it.
 */
const STALE_MESSAGES = [
  'Failed to fetch dynamically imported module', // Chrome, Edge
  'Importing a module script failed', // Safari
  'error loading dynamically imported module', // Firefox
  'Expected a JavaScript-or-Wasm module script',
];
const LAST_RELOAD_KEY = 'c00k90.staleReloadAt';
/** Not again within this time, so a real outage never turns into a reload loop. */
const RELOAD_GAP_MS = 60_000;

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return STALE_MESSAGES.some((text) => message.includes(text));
}

/** Reloads the page to get the new version. Returns false if it just did that. */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(LAST_RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_GAP_MS) return false;
    sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
  } catch {
    // No session storage (private mode): still reload, the browser's own cache stops a loop.
  }
  location.reload();
  return true;
}

/** `await lazyImport(() => import('firebase/ai'))`: reloads once if the file is from an old version. */
export async function lazyImport<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isStaleChunkError(error)) reloadForNewVersion();
    throw error;
  }
}

/** Everything that isn't caught elsewhere (pages, dialogs) goes through here. */
@Injectable()
export class StaleChunkErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    const cause = (error as { rejection?: unknown })?.rejection ?? error;
    if (isStaleChunkError(cause) && reloadForNewVersion()) return;
    super.handleError(error);
  }
}
