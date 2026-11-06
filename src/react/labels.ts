export interface ComposerLabels {
  titleLabel: string;
  titlePlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  tabWrite: string;
  tabPreview: string;
  previewEmpty: string;
  toolsLabel: string;
  speak: string;
  photo: string;
  chart: string;
  formatLabel: string;
  heading: string;
  bold: string;
  quote: string;
  list: string;
  link: string;
  /** Speak panel */
  speakTitle: string;
  speakHelp: string;
  speakBrief: string;
  speakPlaceholder: string;
  speakWrite: string;
  speakWriting: string;
  speakInsert: string;
  speakSignIn: string;
  /** Chart panel */
  chartTitle: string;
  chartHelp: string;
  chartInsert: string;
  /** Title / body writing help */
  improveSuggestionsBody: readonly string[];
  improveSuggestionsTitle: readonly string[];
  titleInstruction: (instruction: string) => string;
  assistChanged: string;
  assistUndo: string;
  assistFailed: string;
  /** Publish bar */
  publish: string;
  publishing: string;
  saveChanges: string;
  signInToPublish: string;
  saveDraft: string;
  savingDraft: string;
  publishFailed: string;
  publishUnreachable: string;
  wordCount: (words: number, minutes: number) => string;
  draftKept: string;
  draftRestored: (at: string) => string;
  publishedAs: (name: string) => string;
  signedOutNote: string;
}

export const DEFAULT_COMPOSER_LABELS: ComposerLabels = {
  titleLabel: "Title",
  titlePlaceholder: "Say it in one line",
  bodyLabel: "Article",
  bodyPlaceholder:
    "Write here — or press Speak and say what you want written. Paragraphs are enough; Markdown works for headings, lists, links and quotes.",
  tabWrite: "Write",
  tabPreview: "Preview",
  previewEmpty: "Nothing to preview yet.",
  toolsLabel: "Add to the article",
  speak: "Speak",
  photo: "Photo",
  chart: "Chart",
  formatLabel: "Format",
  heading: "Heading",
  bold: "Bold",
  quote: "Quote",
  list: "List",
  link: "Link",
  speakTitle: "Say what to write",
  speakHelp:
    "Tell it what to write and how (“an angry piece, 400 words, about…”), or dictate the text itself.",
  speakBrief: "What should it say?",
  speakPlaceholder: "Speak or type your brief…",
  speakWrite: "Write the article from this",
  speakWriting: "Writing…",
  speakInsert: "Put these words in the text",
  speakSignIn:
    "Sign in to have the article written for you; dictation works without.",
  chartTitle: "Add a chart",
  chartHelp:
    "A small bar, line or area chart drawn from numbers you type. The block lands in the text; change the title, the names and the points.",
  chartInsert: "Insert the chart block",
  improveSuggestionsBody: [
    "Fix spelling and grammar, change nothing else",
    "Make it tighter",
    "Add a short counter-argument and answer it",
    "Give it a clearer opening",
  ],
  improveSuggestionsTitle: ["Make it sharper", "Make it shorter"],
  titleInstruction: (instruction) =>
    `Change only the title: ${instruction}. Return the article body unchanged.`,
  assistChanged: "The text was changed by writing help.",
  assistUndo: "Undo",
  assistFailed:
    "Writing help could not answer just now. Your text is unchanged; try again, or write on by hand.",
  publish: "Publish",
  publishing: "Publishing…",
  saveChanges: "Save changes",
  signInToPublish: "Sign in to publish",
  saveDraft: "Save as draft",
  savingDraft: "Saving…",
  publishFailed: "The article could not be saved. Try again.",
  publishUnreachable:
    "The article could not be sent. Check your connection and try again.",
  wordCount: (words, minutes) =>
    `${words} ${words === 1 ? "word" : "words"} · ${minutes} min read`,
  draftKept: "Draft kept on this device.",
  draftRestored: (at) => `Draft from ${at} restored`,
  publishedAs: (name) =>
    `Published as ${name}. Anyone with the link can read it; you can edit or delete it later. Ctrl/⌘ + Enter publishes.`,
  signedOutNote:
    "Your draft stays on this device while you sign in or create an account; nothing is lost.",
};
