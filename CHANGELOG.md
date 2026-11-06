# Changelog

## 0.2.0 — the article composer

- `@bitbaum/writingkit/react`: `ArticleComposer` (title and text with microphone
  and writing help, Speak / Photo / Chart tools, preview, drafts that survive
  sign-in, one primary publish action) and `styles.css` on chatkit's tokens.
- Core: `assist` (prompts and checks for "write from a brief" and "improve"),
  `text-edit`, `drafts`; moved here from BiasLens so no product keeps a copy.
- Browser test at 390 / 320 (dark) / 1280px; unit and server-render tests.

## 0.1.0 — bootstrap source

- Revision-safe operation coordinator with captured identities/revisions,
  cancellation, disposal, synchronous application and explicit outcomes.
- Runtime regressions exercise overlapping operations, edited/reverted drafts,
  account switches, ignored aborts, late failures and reentrant cancellation.
- This records source capability; package publication and app adoption are pending.
