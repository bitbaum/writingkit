/**
 * Writing help, as pure functions over a model call: the prompts, the input
 * checks and the answer checks. The route owns HTTP; the model transport is
 * ai-kit's. Two jobs:
 *
 *   draft    — "say what you want to write and how": a spoken or typed brief
 *              becomes a titled article in the writer's own voice.
 *   improve  — the current text plus an instruction ("tighter", "fix the
 *              grammar", "add a counter-argument") becomes a revised text.
 *
 * The writer's words are the material, never instructions; the brief and the
 * instruction are the only things the model obeys. Nothing is invented as
 * fact: the prompts forbid new figures, names and quotes.
 */
export declare const ASSIST_MODES: readonly ["draft", "improve"];
export type AssistMode = (typeof ASSIST_MODES)[number];
export declare const ASSIST_LIMITS: {
    readonly brief: 6000;
    readonly body: 60000;
    readonly instruction: 1000;
    readonly title: 160;
};
export interface AssistInput {
    mode: AssistMode;
    /** draft: what to write and how. improve: what to change. */
    instruction: string;
    /** improve: the text as it stands. draft: optional notes already typed. */
    title: string;
    body: string;
    /** Output language label the model writes in (e.g. "English"). */
    language: string;
}
export type ParsedAssist = {
    ok: true;
    data: AssistInput;
} | {
    ok: false;
    problem: string;
};
export declare function parseAssistInput(input: unknown): ParsedAssist;
export declare function assistMessages(input: AssistInput): ({
    role: "system";
    content: string;
} | {
    role: "user";
    content: string;
})[];
export interface AssistAnswer {
    title: string;
    body: string;
}
/** The model's JSON, checked; null when it is not an article. */
export declare function parseAssistAnswer(raw: string, fallbackTitle: string): AssistAnswer | null;
