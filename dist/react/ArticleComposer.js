"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, } from "react";
import { DictationField, Markdown, } from "@bitbaum/chatkit/react";
import { countWords, figureMarkdown, insertBlock, readingMinutes, wrapRange, } from "../text-edit.js";
import { restoreDraft, writeDraft } from "../drafts.js";
import { ASSIST_LIMITS } from "../assist.js";
import { DEFAULT_COMPOSER_LABELS } from "./labels.js";
import { ChartPanel, SpeakPanel } from "./ComposerPanels.js";
/**
 * One place to write, the same in every product: a title and a text that both
 * have the microphone and writing help, a speak-to-write panel, photos and
 * charts, a preview, a draft that survives sign-in, and a publish bar with one
 * primary action. Built from chatkit's `DictationField`, so it is also the
 * same microphone as in every chat. Apps pass transports and context, never a
 * second composer.
 */
export function ArticleComposer({ transport, initial, draftKey, anonymousDraftKey, storage, signedIn, signInHref, authorName, canPublish = true, editingPublished = false, voice = {}, photos, above, below, extraActions, bodyRef: externalBodyRef, renderPreview, formatTime = (iso) => new Date(iso).toLocaleString(), limits = { title: 160, body: ASSIST_LIMITS.body }, labels: overrides, }) {
    const labels = { ...DEFAULT_COMPOSER_LABELS, ...overrides };
    const [title, setTitle] = useState(initial?.title ?? "");
    const [body, setBody] = useState(initial?.body ?? "");
    const [tab, setTab] = useState("write");
    const [panel, setPanel] = useState(null);
    const [busy, setBusy] = useState(null);
    const [assisting, setAssisting] = useState(false);
    const [problems, setProblems] = useState([]);
    const [restored, setRestored] = useState(null);
    const [kept, setKept] = useState(false);
    const [undo, setUndo] = useState(null);
    const areaRef = useRef(null);
    const hasInitial = Boolean(initial?.title || initial?.body);
    const store = () => {
        if (storage)
            return storage;
        try {
            return typeof window === "undefined" ? null : window.localStorage;
        }
        catch {
            return null;
        }
    };
    // A draft from an earlier visit comes back — including one typed before signing in.
    useEffect(() => {
        queueMicrotask(() => {
            const s = store();
            if (!s || hasInitial)
                return;
            const found = restoreDraft(s, draftKey, anonymousDraftKey);
            if (!found)
                return;
            setTitle((current) => current || found.title);
            setBody((current) => current || found.body);
            setRestored(found.savedAt);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
    }, []);
    // Keep the draft on this device as it is written.
    useEffect(() => {
        if (!title && !body)
            return;
        const handle = window.setTimeout(() => {
            const s = store();
            setKept(s
                ? writeDraft(s, draftKey, {
                    title,
                    body,
                    savedAt: new Date().toISOString(),
                })
                : false);
        }, 600);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- store() reads only props
    }, [title, body, draftKey]);
    const setArea = (el) => {
        areaRef.current = el;
        if (externalBodyRef)
            externalBodyRef.current = areaRef.current;
    };
    const apply = (edit) => {
        setTab("write");
        setBody(edit.text);
        window.requestAnimationFrame(() => {
            const el = areaRef.current;
            el?.focus();
            el?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
        });
    };
    const selection = () => [
        areaRef.current?.selectionStart ?? body.length,
        areaRef.current?.selectionEnd ?? body.length,
    ];
    const insert = (snippet) => {
        const [start, end] = selection();
        apply(insertBlock(body, start, end, snippet));
        setPanel(null);
    };
    const wrap = (before, after, placeholder) => {
        const [start, end] = selection();
        apply(wrapRange(body, start, end, before, after, placeholder));
    };
    const askAssist = async (request) => {
        if (!transport.assist)
            return null;
        try {
            return await transport.assist(request);
        }
        catch {
            return null;
        }
    };
    const draftFromBrief = async (brief) => {
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
            run: async (text, instruction) => (await askAssist({ mode: "improve", instruction, title, body: text }))
                ?.body ?? null,
        }
        : undefined;
    const improveTitle = canAssist && body.trim().length >= 20
        ? {
            suggestions: labels.improveSuggestionsTitle,
            run: async (text, instruction) => (await askAssist({
                mode: "improve",
                instruction: labels.titleInstruction(instruction),
                title: text,
                body,
            }))?.title ?? null,
        }
        : undefined;
    const ready = title.trim().length > 0 && body.trim().length > 0 && !busy && canPublish;
    const save = async (status) => {
        if (!ready)
            return;
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
            }
            catch {
                /* the draft key is harmless once the article exists */
            }
        }
        catch {
            setProblems([labels.publishUnreachable]);
        }
        finally {
            setBusy(null);
        }
    };
    const onKey = (event) => {
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
    const toggle = (next) => setPanel((current) => (current === next ? null : next));
    const format = [
        ["H", labels.heading, "## ", "", labels.heading],
        ["B", labels.bold, "**", "**", labels.bold.toLowerCase()],
        ["“", labels.quote, "> ", "", labels.quote],
        ["•", labels.list, "- ", "", labels.list],
        [labels.link, labels.link, "[", "](https://)", labels.link.toLowerCase()],
    ];
    return (_jsxs("div", { className: "wk-composer", onKeyDown: onKey, children: [above, _jsxs("form", { className: "wk-form", onSubmit: (event) => {
                    event.preventDefault();
                    if (!signedIn && signInHref) {
                        window.location.assign(signInHref);
                        return;
                    }
                    void save("published");
                }, children: [_jsx(DictationField, { label: labels.titleLabel, className: "wk-title", value: title, onValueChange: setTitle, multiline: false, maxLength: limits.title, placeholder: labels.titlePlaceholder, voice: voice, improve: improveTitle, disabled: Boolean(busy) || assisting }), _jsxs("div", { className: "wk-editor-head", children: [_jsx("div", { className: "wk-tabs", role: "tablist", "aria-label": `${labels.tabWrite} / ${labels.tabPreview}`, children: ["write", "preview"].map((which) => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === which, className: "wk-tab", onClick: () => setTab(which), children: which === "write" ? labels.tabWrite : labels.tabPreview }, which))) }), _jsxs("div", { className: "wk-tools", role: "toolbar", "aria-label": labels.toolsLabel, children: [_jsx("button", { type: "button", className: "wk-tool", "aria-pressed": panel === "speak", onClick: () => toggle("speak"), children: labels.speak }), photos && (_jsx("button", { type: "button", className: "wk-tool", "aria-pressed": panel === "photo", onClick: () => toggle("photo"), children: labels.photo })), _jsx("button", { type: "button", className: "wk-tool", "aria-pressed": panel === "chart", onClick: () => toggle("chart"), children: labels.chart })] })] }), _jsx("div", { className: "wk-format", role: "toolbar", "aria-label": labels.formatLabel, children: format.map(([glyph, name, before, after, placeholder]) => (_jsx("button", { type: "button", className: "wk-tool", title: name, "aria-label": name, disabled: tab !== "write", onClick: () => wrap(before, after, placeholder), children: glyph }, name))) }), panel === "speak" && (_jsx(SpeakPanel, { labels: labels, voice: voice, busy: assisting, canDraft: canAssist, signInHref: signInHref, onBrief: (brief) => void draftFromBrief(brief), onInsert: insert })), panel === "photo" && photos && (_jsx("div", { className: "wk-panel", children: photos((photo) => insert(figureMarkdown(photo))) })), panel === "chart" && _jsx(ChartPanel, { labels: labels, onInsert: insert }), tab === "write" ? (_jsx(DictationField, { label: _jsx("span", { className: "wk-sr", children: labels.bodyLabel }), className: "wk-body", value: body, onValueChange: setBody, rows: 12, maxLength: limits.body, placeholder: labels.bodyPlaceholder, voice: voice, improve: improveBody, inputRef: setArea, disabled: Boolean(busy) || assisting })) : (_jsx("div", { className: "wk-preview", "aria-label": labels.tabPreview, children: body.trim() ? ((renderPreview ?? ((md) => _jsx(Markdown, { text: md })))(body)) : (_jsx("p", { className: "wk-meta", children: labels.previewEmpty })) })), undo && (_jsxs("p", { className: "wk-meta", role: "status", children: [labels.assistChanged, " ", _jsx("button", { type: "button", className: "wk-link", onClick: () => {
                                    setTitle(undo.title);
                                    setBody(undo.body);
                                    setUndo(null);
                                }, children: labels.assistUndo })] })), below, _jsxs("p", { className: "wk-meta", "aria-live": "polite", children: [labels.wordCount(words, readingMinutes(body)), restored ? ` · ${labels.draftRestored(formatTime(restored))}` : "", !restored && kept ? ` · ${labels.draftKept}` : ""] }), problems.length > 0 && (_jsx("div", { role: "alert", className: "wk-problems", children: _jsx("ul", { children: problems.map((p) => (_jsx("li", { children: p }, p))) }) })), _jsxs("div", { className: "wk-publish", children: [_jsx("button", { type: "submit", className: "wk-btn wk-btn-primary wk-btn-wide", disabled: signedIn ? !ready : false, children: publishLabel }), (signedIn || extraActions) && (_jsxs("div", { className: "wk-actions-row", children: [signedIn && (_jsx("button", { type: "button", className: "wk-btn", disabled: !ready, onClick: () => void save("draft"), children: busy === "draft" ? labels.savingDraft : labels.saveDraft })), extraActions] }))] }), _jsx("p", { className: "wk-meta", children: signedIn
                            ? labels.publishedAs(authorName?.trim() || "you")
                            : labels.signedOutNote })] })] }));
}
