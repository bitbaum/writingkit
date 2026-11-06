import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleComposer } from '@bitbaum/writingkit/react';

const transport = { publish: async () => {}, assist: async () => null };
const render = props =>
  renderToStaticMarkup(
    createElement(ArticleComposer, { transport, draftKey: 'k', signedIn: true, ...props })
  );

test('title and text both carry the microphone path, labelled', () => {
  const html = render({});
  assert.equal((html.match(/ck-field-wrap/g) ?? []).length >= 2, true);
  assert.match(html, /<label[^>]*>Title<\/label>/);
  assert.match(html, /Speak/);
});

test('one primary action; a signed-in writer can also save a draft', () => {
  const html = render({});
  assert.equal((html.match(/wk-btn-primary/g) ?? []).length, 1);
  assert.match(html, /Save as draft/);
  assert.match(html, />Publish</);
});

test('a signed-out writer is shown the way to sign in, not a dead end', () => {
  const html = render({ signedIn: false, signInHref: '/sign-in?next=/write' });
  assert.match(html, /Sign in to publish/);
  assert.doesNotMatch(html, /Save as draft/);
  assert.match(html, /stays on this device/);
});

test('editing a published article offers Save changes, and the photo tool only with a finder', () => {
  assert.match(render({ editingPublished: true }), /Save changes/);
  assert.doesNotMatch(render({}), />Photo</);
  assert.match(render({ photos: () => null }), />Photo</);
});

test('extra actions and context are slotted, not rebuilt', () => {
  const html = render({
    above: createElement('p', { id: 'ctx' }, 'In response to X'),
    extraActions: createElement('a', { href: '/cancel' }, 'Cancel'),
  });
  assert.match(html, /In response to X/);
  assert.match(html, /href="\/cancel"/);
});
