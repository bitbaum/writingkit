/**
 * A draft lives on the device until it is published, and signing in never
 * loses it: what was typed under the anonymous key moves to the account's.
 * Storage is passed in, so a test (or a server render) needs no browser.
 */

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredDraft {
  title: string;
  body: string;
  savedAt: string;
  /** Anything the app wants kept with it (the headline being answered). */
  extra?: unknown;
}

export function readDraft(
  storage: DraftStorage,
  key: string,
): StoredDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<StoredDraft>;
    if (typeof draft.title !== "string" || typeof draft.body !== "string")
      return null;
    return {
      title: draft.title,
      body: draft.body,
      savedAt:
        typeof draft.savedAt === "string"
          ? draft.savedAt
          : new Date(0).toISOString(),
      extra: draft.extra,
    };
  } catch {
    return null;
  }
}

/** False when storage is full or blocked: the text is still on screen. */
export function writeDraft(
  storage: DraftStorage,
  key: string,
  draft: StoredDraft,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** The draft to offer: this key's, or else the anonymous one, moved to this key. */
export function restoreDraft(
  storage: DraftStorage,
  key: string,
  anonymousKey?: string,
): StoredDraft | null {
  const own = readDraft(storage, key);
  if (own && (own.title || own.body)) return own;
  if (!anonymousKey || anonymousKey === key) return null;
  const carried = readDraft(storage, anonymousKey);
  if (!carried || (!carried.title && !carried.body)) return null;
  if (writeDraft(storage, key, carried)) {
    try {
      storage.removeItem(anonymousKey);
    } catch {
      /* the copy exists; the old one is harmless */
    }
  }
  return carried;
}
