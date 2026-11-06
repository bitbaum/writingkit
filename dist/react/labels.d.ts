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
export declare const DEFAULT_COMPOSER_LABELS: ComposerLabels;
