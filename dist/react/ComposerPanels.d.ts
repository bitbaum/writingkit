import { type ComposerVoice } from "@bitbaum/chatkit/react";
import type { ComposerLabels } from "./labels.js";
/**
 * "Say what to write": a spoken or typed brief becomes an article, or the
 * words go straight into the text. The microphone is chatkit's — the same one
 * as in every text box of the fleet.
 */
export declare function SpeakPanel({ labels, voice, busy, canDraft, signInHref, onBrief, onInsert, }: {
    labels: ComposerLabels;
    voice: ComposerVoice | false;
    busy: boolean;
    canDraft: boolean;
    signInHref?: string;
    onBrief: (brief: string) => void;
    onInsert: (text: string) => void;
}): import("react").JSX.Element;
/** A chart block the page draws from numbers; the writer edits the numbers in the text. */
export declare function ChartPanel({ labels, onInsert, }: {
    labels: ComposerLabels;
    onInsert: (markdown: string) => void;
}): import("react").JSX.Element;
