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
export declare function readDraft(storage: DraftStorage, key: string): StoredDraft | null;
/** False when storage is full or blocked: the text is still on screen. */
export declare function writeDraft(storage: DraftStorage, key: string, draft: StoredDraft): boolean;
/** The draft to offer: this key's, or else the anonymous one, moved to this key. */
export declare function restoreDraft(storage: DraftStorage, key: string, anonymousKey?: string): StoredDraft | null;
