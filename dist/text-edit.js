/**
 * Editing a Markdown text without a DOM: where a snippet or a wrapper lands,
 * and where the caret goes afterwards. Pure, so the same rules run in a test
 * and in the browser.
 */
/** A block (a photo, a chart) goes on its own paragraph, never glued to a sentence. */
export function insertBlock(text, start, end, snippet) {
    const from = Math.min(Math.max(0, start), text.length);
    const to = Math.min(Math.max(from, end), text.length);
    const before = text.slice(0, from);
    const after = text.slice(to);
    const pad = before && !before.endsWith("\n\n")
        ? before.endsWith("\n")
            ? "\n"
            : "\n\n"
        : "";
    const next = before + pad + snippet + (after.startsWith("\n") ? "" : "\n\n") + after;
    const caret = (before + pad + snippet).length;
    return { text: next, selectionStart: caret, selectionEnd: caret };
}
/** Wrap the selection, or drop in a placeholder that stays selected for typing over. */
export function wrapRange(text, start, end, before, after, placeholder) {
    const from = Math.min(Math.max(0, start), text.length);
    const to = Math.min(Math.max(from, end), text.length);
    const chosen = text.slice(from, to) || placeholder;
    return {
        text: text.slice(0, from) + before + chosen + after + text.slice(to),
        selectionStart: from + before.length,
        selectionEnd: from + before.length + chosen.length,
    };
}
export function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}
/** At 200 words a minute, never less than one. */
export function readingMinutes(text) {
    return Math.max(1, Math.round(countWords(text) / 200));
}
/** An image as a Markdown figure: alt, source, and a caption carrying its credit. */
export function figureMarkdown(image) {
    const credit = [image.credit, image.license].filter(Boolean).join(", ");
    const caption = [image.caption || image.alt, credit]
        .filter(Boolean)
        .join(" — ")
        .replace(/"/g, "”");
    return `![${image.alt.replace(/[[\]]/g, "")}](${image.src} "${caption}")`;
}
export const CHART_TEMPLATE = `\`\`\`chart
{ "kind": "bar", "title": "Say what the numbers show", "series": [{ "name": "Series", "points": [["2024", 10], ["2025", 14], ["2026", 9]] }] }
\`\`\``;
