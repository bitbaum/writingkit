import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDraft, restoreDraft, writeDraft } from '@bitbaum/writingkit';

const memory = () => {
  const data = new Map();
  return {
    data,
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: k => void data.delete(k),
  };
};
const draft = { title: 'T', body: 'B', savedAt: '2026-11-06T10:00:00.000Z' };

test('a draft round-trips and garbage is ignored', () => {
  const s = memory();
  assert.equal(writeDraft(s, 'k', draft), true);
  assert.deepEqual(readDraft(s, 'k'), { ...draft, extra: undefined });
  s.data.set('bad', '{not json');
  s.data.set('odd', '{"title":1}');
  assert.equal(readDraft(s, 'bad'), null);
  assert.equal(readDraft(s, 'odd'), null);
});

test('a full or blocked storage says so instead of throwing', () => {
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('full');
    },
    removeItem: () => {},
  };
  assert.equal(writeDraft(blocked, 'k', draft), false);
  assert.equal(readDraft(blocked, 'k'), null);
  assert.equal(restoreDraft(blocked, 'k', 'anon'), null);
});

test('signing in carries the anonymous draft over and removes the old key', () => {
  const s = memory();
  writeDraft(s, 'anon', draft);
  assert.deepEqual(restoreDraft(s, 'user', 'anon')?.title, 'T');
  assert.ok(s.data.has('user'));
  assert.equal(s.data.has('anon'), false);
});

test('an account draft wins over the anonymous one and is not overwritten', () => {
  const s = memory();
  writeDraft(s, 'anon', { ...draft, title: 'anon' });
  writeDraft(s, 'user', { ...draft, title: 'mine' });
  assert.equal(restoreDraft(s, 'user', 'anon')?.title, 'mine');
  assert.ok(s.data.has('anon'));
});

test('an empty draft is not offered', () => {
  const s = memory();
  writeDraft(s, 'user', { ...draft, title: '', body: '' });
  assert.equal(restoreDraft(s, 'user'), null);
});
