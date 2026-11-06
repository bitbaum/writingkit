"use client";

import { useState } from "react";
import { DictationField, type ComposerVoice } from "@bitbaum/chatkit/react";

import { CHART_TEMPLATE } from "../text-edit.js";
import type { ComposerLabels } from "./labels.js";

/**
 * "Say what to write": a spoken or typed brief becomes an article, or the
 * words go straight into the text. The microphone is chatkit's — the same one
 * as in every text box of the fleet.
 */
export function SpeakPanel({
  labels,
  voice,
  busy,
  canDraft,
  signInHref,
  onBrief,
  onInsert,
}: {
  labels: ComposerLabels;
  voice: ComposerVoice | false;
  busy: boolean;
  canDraft: boolean;
  signInHref?: string;
  onBrief: (brief: string) => void;
  onInsert: (text: string) => void;
}) {
  const [heard, setHeard] = useState("");
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-title">{labels.speakTitle}</h2>
      <p className="wk-meta">{labels.speakHelp}</p>
      <DictationField
        label={labels.speakBrief}
        value={heard}
        onValueChange={setHeard}
        placeholder={labels.speakPlaceholder}
        rows={4}
        voice={voice}
        disabled={busy}
      />
      <div className="wk-actions-row">
        <button
          type="button"
          className="wk-btn wk-btn-primary"
          disabled={!heard.trim() || busy || !canDraft}
          onClick={() => onBrief(heard.trim())}
        >
          {busy ? labels.speakWriting : labels.speakWrite}
        </button>
        <button
          type="button"
          className="wk-btn"
          disabled={!heard.trim() || busy}
          onClick={() => {
            onInsert(heard.trim());
            setHeard("");
          }}
        >
          {labels.speakInsert}
        </button>
      </div>
      {!canDraft && (
        <p className="wk-meta">
          {signInHref ? (
            <a href={signInHref}>{labels.speakSignIn}</a>
          ) : (
            labels.speakSignIn
          )}
        </p>
      )}
    </div>
  );
}

/** A chart block the page draws from numbers; the writer edits the numbers in the text. */
export function ChartPanel({
  labels,
  onInsert,
}: {
  labels: ComposerLabels;
  onInsert: (markdown: string) => void;
}) {
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-title">{labels.chartTitle}</h2>
      <p className="wk-meta">{labels.chartHelp}</p>
      <pre className="wk-code">{CHART_TEMPLATE}</pre>
      <div className="wk-actions-row">
        <button
          type="button"
          className="wk-btn wk-btn-primary"
          onClick={() => onInsert(CHART_TEMPLATE)}
        >
          {labels.chartInsert}
        </button>
      </div>
    </div>
  );
}
