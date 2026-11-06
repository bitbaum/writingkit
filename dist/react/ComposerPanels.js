'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DictationField } from '@bitbaum/chatkit/react';
import { CHART_TEMPLATE } from '../text-edit.js';
/**
 * "Say what to write": a spoken or typed brief becomes an article, or the
 * words go straight into the text. The microphone is chatkit's — the same one
 * as in every text box of the fleet.
 */
export function SpeakPanel({ labels, voice, busy, canDraft, signInHref, onBrief, onInsert, }) {
    const [heard, setHeard] = useState('');
    return (_jsxs("div", { className: "wk-panel", children: [_jsx("h2", { className: "wk-panel-title", children: labels.speakTitle }), _jsx("p", { className: "wk-meta", children: labels.speakHelp }), _jsx(DictationField, { label: labels.speakBrief, value: heard, onValueChange: setHeard, placeholder: labels.speakPlaceholder, rows: 4, voice: voice, disabled: busy }), _jsxs("div", { className: "wk-actions-row", children: [_jsx("button", { type: "button", className: "wk-btn wk-btn-primary", disabled: !heard.trim() || busy || !canDraft, onClick: () => onBrief(heard.trim()), children: busy ? labels.speakWriting : labels.speakWrite }), _jsx("button", { type: "button", className: "wk-btn", disabled: !heard.trim() || busy, onClick: () => {
                            onInsert(heard.trim());
                            setHeard('');
                        }, children: labels.speakInsert })] }), !canDraft && (_jsx("p", { className: "wk-meta", children: signInHref ? _jsx("a", { href: signInHref, children: labels.speakSignIn }) : labels.speakSignIn }))] }));
}
/** A chart block the page draws from numbers; the writer edits the numbers in the text. */
export function ChartPanel({ labels, onInsert, }) {
    return (_jsxs("div", { className: "wk-panel", children: [_jsx("h2", { className: "wk-panel-title", children: labels.chartTitle }), _jsx("p", { className: "wk-meta", children: labels.chartHelp }), _jsx("pre", { className: "wk-code", children: CHART_TEMPLATE }), _jsx("div", { className: "wk-actions-row", children: _jsx("button", { type: "button", className: "wk-btn wk-btn-primary", onClick: () => onInsert(CHART_TEMPLATE), children: labels.chartInsert }) })] }));
}
