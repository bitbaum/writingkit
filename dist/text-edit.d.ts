/**
 * Editing a Markdown text without a DOM: where a snippet or a wrapper lands,
 * and where the caret goes afterwards. Pure, so the same rules run in a test
 * and in the browser.
 */
export interface Edit {
    readonly text: string;
    /** Selection to restore after the edit. */
    readonly selectionStart: number;
    readonly selectionEnd: number;
}
/** A block (a photo, a chart) goes on its own paragraph, never glued to a sentence. */
export declare function insertBlock(text: string, start: number, end: number, snippet: string): Edit;
/** Wrap the selection, or drop in a placeholder that stays selected for typing over. */
export declare function wrapRange(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit;
export declare function countWords(text: string): number;
/** At 200 words a minute, never less than one. */
export declare function readingMinutes(text: string): number;
/** An image as a Markdown figure: alt, source, and a caption carrying its credit. */
export declare function figureMarkdown(image: {
    alt: string;
    src: string;
    caption?: string;
    credit?: string;
    license?: string;
}): string;
export declare const CHART_TEMPLATE = "```chart\n{ \"kind\": \"bar\", \"title\": \"Say what the numbers show\", \"series\": [{ \"name\": \"Series\", \"points\": [[\"2024\", 10], [\"2025\", 14], [\"2026\", 9]] }] }\n```";
