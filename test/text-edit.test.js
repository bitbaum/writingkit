import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  figureMarkdown,
  insertBlock,
  readingMinutes,
  wrapRange,
} from '@bitbaum/writingkit';

test('a block gets its own paragraph, wherever the caret was', () => {
  const edit = insertBlock('One sentence.', 13, 13, '![a](b)');
  assert.equal(edit.text, 'One sentence.\n\n![a](b)\n\n');
  assert.equal(edit.selectionStart, 'One sentence.\n\n![a](b)'.length);
  assert.equal(insertBlock('', 0, 0, 'X').text, 'X\n\n');
  assert.equal(insertBlock('A\n', 2, 2, 'X').text, 'A\n\nX\n\n');
  assert.equal(insertBlock('A\n\nB', 3, 3, 'X').text, 'A\n\nX\n\nB');
});

test('a block replaces the selection and stays inside the text', () => {
  assert.equal(insertBlock('abcdef', 2, 4, 'X').text, 'ab\n\nX\n\nef');
  assert.equal(insertBlock('abc', 99, 120, 'X').text, 'abc\n\nX\n\n');
});

test('wrapping keeps the selection, or offers a placeholder to type over', () => {
  const wrapped = wrapRange('make this bold', 5, 9, '**', '**', 'bold');
  assert.equal(wrapped.text, 'make **this** bold');
  assert.equal(wrapped.text.slice(wrapped.selectionStart, wrapped.selectionEnd), 'this');
  const empty = wrapRange('', 0, 0, '[', '](https://)', 'link text');
  assert.equal(empty.text, '[link text](https://)');
  assert.equal(empty.text.slice(empty.selectionStart, empty.selectionEnd), 'link text');
});

test('words and reading time', () => {
  assert.equal(countWords('  one  two\nthree '), 3);
  assert.equal(countWords(''), 0);
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('word '.repeat(600)), 3);
});

test('a figure carries its credit and cannot break out of its caption', () => {
  const md = figureMarkdown({
    alt: 'A [dam]',
    src: 'https://x/y.jpg',
    caption: 'The "big" dam',
    credit: 'Ann',
    license: 'CC BY 4.0',
  });
  assert.equal(md, '![A dam](https://x/y.jpg "The ”big” dam — Ann, CC BY 4.0")');
});
