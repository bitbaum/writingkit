"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  DictationField,
  Markdown,
  type ComposerVoice,
} from "@bitbaum/chatkit/react";

import {
  countWords,
  figureMarkdown,
  insertBlock,
  readingMinutes,
  wrapRange,
  type Edit,
} from "../text-edit.js";
import { restoreDraft, writeDraft, type DraftStorage } from "../drafts.js";
import { ASSIST_LIMITS, type AssistMode } from "../assist.js";
import { DEFAULT_COMPOSER_LABELS, type ComposerLabels } from "./labels.js";
import { ChartPanel, SpeakPanel } from "./ComposerPanels.js";

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
  publish: (
    status: ArticleStatus,
    content: ArticleContent,
  ) => Promise<{ problems?: string[] } | void>;
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
  limits?: { title: number; body: number };
  labels?: Partial<ComposerLabels>;
}

type Panel = "speak" | "photo" | "chart" | null;

/**
 * One place to write, the same in every product: a title and a text that both
 * have the microphone and writing help, a speak-to-write panel, photos and
 * charts, a preview, a draft that survives sign-in, and a publish bar with one
 * primary action. Built from chatkit's `DictationField`, so it is also the
 * same microphone as in every chat. Apps pass transports and context, never a
 * second composer.
 */
export function ArticleComposer({
  transport,
  initial,
  draftKey,
  anonymousDraftKey,
  storage,
  signedIn,
  signInHref,
  authorName,
  canPublish = true,
  editingPublished = false,
  voice = {},
  photos,
  above,
  below,
  extraActions,
  bodyRef: externalBodyRef,
  renderPreview,
  formatTime = (iso) => new Date(iso).toLocaleString(),
  limits = { title: 160, body: ASSIST_LIMITS.body },
  labels: overrides,
}: ArticleComposerProps) {
  const labels: ComposerLabels = { ...DEFAULT_COMPOSER_LABELS, ...overrides };
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<ArticleStatus | null>(null);
  const [assisting, setAssisting] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [restored, setRestored] = useState<string | null>(null);
  const [kept, setKept] = useState(false);
  const [undo, setUndo] = useState<ArticleContent | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasInitial = Boolean(initial?.title || initial?.body);

  const store = (): DraftStorage | null => {
    if (storage) return storage;
    try {
      return typeof window === "undefined" ? null : window.localStorage;
    } catch {
      return null;
    }
  };

  // A draft from an earlier visit comes back — including one typed before signing in.
  useEffect(() => {
    queueMicrotask(() => {
      const s = store();
      if (!s || hasInitial) return;
      const found = restoreDraft(s, draftKey, anonymousDraftKey);
      if (!found) return;
      setTitle((current) => current || found.title);
      setBody((current) => current || found.body);
      setRestored(found.savedAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  // Keep the draft on this device as it is written.
  useEffect(() => {
    if (!title && !body) return;
    const handle = window.setTimeout(() => {
      const s = store();
      setKept(
        s
          ? writeDraft(s, draftKey, {
              title,
              body,
              savedAt: new Date().toISOString(),
            })
          : false,
      );
    }, 600);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store() reads only props
  }, [title, body, draftKey]);

  const setArea = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    areaRef.current = el as HTMLTextAreaElement | null;
    if (externalBodyRef) externalBodyRef.current = areaRef.current;
  };

  const apply = (edit: Edit) => {
    setTab("write");
    setBody(edit.text);
    window.requestAnimationFrame(() => {
      const el = areaRef.current;
      el?.focus();
      el?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };
  const selection = () =>
    [
      areaRef.current?.selectionStart ?? body.length,
      areaRef.current?.selectionEnd ?? body.length,
    ] as const;
  const insert = (snippet: string) => {
    const [start, end] = selection();
    apply(insertBlock(body, start, end, snippet));
    setPanel(null);
  };
  const wrap = (before: string, after: string, placeholder: string) => {
    const [start, end] = selection();
    apply(wrapRange(body, start, end, before, after, placeholder));
  };

  const askAssist = async (
    request: AssistRequest,
  ): Promise<ArticleContent | null> => {
    if (!transport.assist) return null;
    try {
      return await transport.assist(request);
    } catch {
      return null;
    }
  };

  const draftFromBrief = async (brief: string) => {
    setAssisting(true);
    setProblems([]);
    const answer = await askAssist({
      mode: "draft",
      instruction: brief,
      title,
      body,
    });
    setAssisting(false);
    if (!answer || !answer.body.trim()) {
      setProblems([labels.assistFailed]);
      return;
    }
    setUndo({ title, body });
    setTitle(answer.title || title);
    setBody(answer.body);
    setTab("write");
    setPanel(null);
  };

  const canAssist = signedIn && Boolean(transport.assist);
  const improveBody = canAssist
    ? {
        suggestions: labels.improveSuggestionsBody,
        run: async (text: string, instruction: string) =>
          (await askAssist({ mode: "improve", instruction, title, body: text }))
            ?.body ?? null,
      }
    : undefined;
  const improveTitle =
    canAssist && body.trim().length >= 20
      ? {
          suggestions: labels.improveSuggestionsTitle,
          run: async (text: string, instruction: string) =>
            (
              await askAssist({
                mode: "improve",
                instruction: labels.titleInstruction(instruction),
                title: text,
                body,
              })
            )?.title ?? null,
        }
      : undefined;

  const ready =
    title.trim().length > 0 && body.trim().length > 0 && !busy && canPublish;

  const save = async (status: ArticleStatus) => {
    if (!ready) return;
    setBusy(status);
    setProblems([]);
    try {
      const result = await transport.publish(status, { title, body });
      if (result?.problems?.length) {
        setProblems(result.problems);
        return;
      }
      try {
        store()?.removeItem(draftKey);
      } catch {
        /* the draft key is harmless once the article exists */
      }
    } catch {
      setProblems([labels.publishUnreachable]);
    } finally {
      setBusy(null);
    }
  };

  const onKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void save("published");
    }
  };

  const publishLabel = !signedIn
    ? labels.signInToPublish
    : busy === "published"
      ? labels.publishing
      : editingPublished
        ? labels.saveChanges
        : labels.publish;
  const words = countWords(body);
  const toggle = (next: Panel) =>
    setPanel((current) => (current === next ? null : next));
  const format: [string, string, string, string, string][] = [
    ["H", labels.heading, "## ", "", labels.heading],
    ["B", labels.bold, "**", "**", labels.bold.toLowerCase()],
    ["“", labels.quote, "> ", "", labels.quote],
    ["•", labels.list, "- ", "", labels.list],
    [labels.link, labels.link, "[", "](https://)", labels.link.toLowerCase()],
  ];

  return (
    <div className="wk-composer" onKeyDown={onKey}>
      {above}
      <form
        className="wk-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!signedIn && signInHref) {
            window.location.assign(signInHref);
            return;
          }
          void save("published");
        }}
      >
        <DictationField
          label={labels.titleLabel}
          className="wk-title"
          value={title}
          onValueChange={setTitle}
          multiline={false}
          maxLength={limits.title}
          placeholder={labels.titlePlaceholder}
          voice={voice}
          improve={improveTitle}
          disabled={Boolean(busy) || assisting}
        />

        <div className="wk-editor-head">
          <div
            className="wk-tabs"
            role="tablist"
            aria-label={`${labels.tabWrite} / ${labels.tabPreview}`}
          >
            {(["write", "preview"] as const).map((which) => (
              <button
                key={which}
                type="button"
                role="tab"
                aria-selected={tab === which}
                className="wk-tab"
                onClick={() => setTab(which)}
              >
                {which === "write" ? labels.tabWrite : labels.tabPreview}
              </button>
            ))}
          </div>
          <div
            className="wk-tools"
            role="toolbar"
            aria-label={labels.toolsLabel}
          >
            <button
              type="button"
              className="wk-tool"
              aria-pressed={panel === "speak"}
              onClick={() => toggle("speak")}
            >
              {labels.speak}
            </button>
            {photos && (
              <button
                type="button"
                className="wk-tool"
                aria-pressed={panel === "photo"}
                onClick={() => toggle("photo")}
              >
                {labels.photo}
              </button>
            )}
            <button
              type="button"
              className="wk-tool"
              aria-pressed={panel === "chart"}
              onClick={() => toggle("chart")}
            >
              {labels.chart}
            </button>
          </div>
        </div>
        <div
          className="wk-format"
          role="toolbar"
          aria-label={labels.formatLabel}
        >
          {format.map(([glyph, name, before, after, placeholder]) => (
            <button
              key={name}
              type="button"
              className="wk-tool"
              title={name}
              aria-label={name}
              disabled={tab !== "write"}
              onClick={() => wrap(before, after, placeholder)}
            >
              {glyph}
            </button>
          ))}
        </div>

        {panel === "speak" && (
          <SpeakPanel
            labels={labels}
            voice={voice}
            busy={assisting}
            canDraft={canAssist}
            signInHref={signInHref}
            onBrief={(brief) => void draftFromBrief(brief)}
            onInsert={insert}
          />
        )}
        {panel === "photo" && photos && (
          <div className="wk-panel">
            {photos((photo) => insert(figureMarkdown(photo)))}
          </div>
        )}
        {panel === "chart" && <ChartPanel labels={labels} onInsert={insert} />}

        {tab === "write" ? (
          <DictationField
            label={<span className="wk-sr">{labels.bodyLabel}</span>}
            className="wk-body"
            value={body}
            onValueChange={setBody}
            rows={12}
            maxLength={limits.body}
            placeholder={labels.bodyPlaceholder}
            voice={voice}
            improve={improveBody}
            inputRef={setArea}
            disabled={Boolean(busy) || assisting}
          />
        ) : (
          <div className="wk-preview" aria-label={labels.tabPreview}>
            {body.trim() ? (
              (renderPreview ?? ((md: string) => <Markdown text={md} />))(body)
            ) : (
              <p className="wk-meta">{labels.previewEmpty}</p>
            )}
          </div>
        )}
        {undo && (
          <p className="wk-meta" role="status">
            {labels.assistChanged}{" "}
            <button
              type="button"
              className="wk-link"
              onClick={() => {
                setTitle(undo.title);
                setBody(undo.body);
                setUndo(null);
              }}
            >
              {labels.assistUndo}
            </button>
          </p>
        )}

        {below}
        <p className="wk-meta" aria-live="polite">
          {labels.wordCount(words, readingMinutes(body))}
          {restored ? ` · ${labels.draftRestored(formatTime(restored))}` : ""}
          {!restored && kept ? ` · ${labels.draftKept}` : ""}
        </p>

        {problems.length > 0 && (
          <div role="alert" className="wk-problems">
            <ul>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="wk-publish">
          <button
            type="submit"
            className="wk-btn wk-btn-primary wk-btn-wide"
            disabled={signedIn ? !ready : false}
          >
            {publishLabel}
          </button>
          {(signedIn || extraActions) && (
            <div className="wk-actions-row">
              {signedIn && (
                <button
                  type="button"
                  className="wk-btn"
                  disabled={!ready}
                  onClick={() => void save("draft")}
                >
                  {busy === "draft" ? labels.savingDraft : labels.saveDraft}
                </button>
              )}
              {extraActions}
            </div>
          )}
        </div>
        <p className="wk-meta">
          {signedIn
            ? labels.publishedAs(authorName?.trim() || "you")
            : labels.signedOutNote}
        </p>
      </form>
    </div>
  );
}
