import { type ReactNode } from "react";
import { type ComposerVoice } from "@bitbaum/chatkit/react";
import { type DraftStorage } from "../drafts.js";
import { type AssistMode } from "../assist.js";
import { type ComposerLabels } from "./labels.js";
export type ArticleStatus = "published" | "draft";
export interface ArticleContent {
    title: string;
    body: string;
}
export interface AssistRequest extends ArticleContent {
    mode: AssistMode;
    instruction: string;
}
/**
 * What the app owns. The composer owns the writing; the app owns the account,
 * the database and the model call.
 */
export interface ArticleTransport {
    /**
     * Writing help: resolve with the new `{ title, body }`; throw (or resolve
     * `null`) when it could not be done. Omit and no writing help is offered.
     */
    assist?: (request: AssistRequest) => Promise<ArticleContent | null>;
    /**
     * Store the article. Resolve with `{ problems }` to show what is wrong; throw
     * for a network failure. On success navigate away yourself — the composer
     * clears the local draft and stops.
     */
    publish: (status: ArticleStatus, content: ArticleContent) => Promise<{
        problems?: string[];
    } | void>;
}
/** A photo the app found; the composer turns it into a figure with its credit. */
export interface PhotoPick {
    alt: string;
    src: string;
    caption?: string;
    credit?: string;
    license?: string;
}
export interface ArticleComposerProps {
    transport: ArticleTransport;
    /** Text to start from (editing). A restored local draft only fills what is empty. */
    initial?: Partial<ArticleContent>;
    /** Where this draft is kept on the device. One per account and article. */
    draftKey: string;
    /** The key used before signing in; its draft moves to `draftKey`. */
    anonymousDraftKey?: string;
    storage?: DraftStorage;
    /** `false`: a signed-out writer can write and keep a draft, and is shown the way to sign in. */
    signedIn: boolean;
    signInHref?: string;
    /** The name readers will see, for the note under the buttons. */
    authorName?: string;
    /** Extra condition for publishing (a byline that must be chosen first). */
    canPublish?: boolean;
    /** The first publish of an edited, already-published article reads "Save changes". */
    editingPublished?: boolean;
    /** The microphone. `{ transcribeUrl }` for the server leg; `false` hides it. */
    voice?: ComposerVoice | false;
    /** The app's photo finder, rendered inside the Photo panel; call `pick` with the choice. */
    photos?: (pick: (photo: PhotoPick) => void) => ReactNode;
    /** Above the title: what is being written about, a headline to pick, the article being answered. */
    above?: ReactNode;
    /** Between the text and the buttons: the byline field. */
    below?: ReactNode;
    /** Extra equal cells beside "Save as draft" (Cancel). */
    extraActions?: ReactNode;
    /** The body's text area, for an app that puts the caret there (a headline's "Write about it"). */
    bodyRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
    /** How the preview draws Markdown. Default: chatkit's `Markdown`. */
    renderPreview?: (markdown: string) => ReactNode;
    /** Formats the time of a restored draft for the person. */
    formatTime?: (iso: string) => string;
    limits?: {
        title: number;
        body: number;
    };
    labels?: Partial<ComposerLabels>;
}
/**
 * One place to write, the same in every product: a title and a text that both
 * have the microphone and writing help, a speak-to-write panel, photos and
 * charts, a preview, a draft that survives sign-in, and a publish bar with one
 * primary action. Built from chatkit's `DictationField`, so it is also the
 * same microphone as in every chat. Apps pass transports and context, never a
 * second composer.
 */
export declare function ArticleComposer({ transport, initial, draftKey, anonymousDraftKey, storage, signedIn, signInHref, authorName, canPublish, editingPublished, voice, photos, above, below, extraActions, bodyRef: externalBodyRef, renderPreview, formatTime, limits, labels: overrides, }: ArticleComposerProps): import("react").JSX.Element;
