import test from 'node:test';
import assert from 'node:assert/strict';

import { maskMarkdown } from '../src/plugin/markdown.ts';

test('keeps the text length and line structure', () => {
  const text = 'Привет, мир!\n```js\nconst x = 1;\n```\nКонец.';
  const masked = maskMarkdown(text);

  assert.equal(masked.length, text.length);
  assert.equal(masked.split('\n').length, text.split('\n').length);
});

test('masks fenced code blocks', () => {
  const text = 'До кода.\n```js\nconst x = 1;\n```\nПосле кода.';
  const masked = maskMarkdown(text);

  assert.ok(!masked.includes('const'));
  assert.ok(masked.includes('После кода.'));
});

test('masks inline code, links, tags and urls', () => {
  const text = 'Ставлю `тег` и [[ссылку]] на https://example.com #заметка дальше.';
  const masked = maskMarkdown(text);

  assert.ok(!masked.includes('тег'));
  assert.ok(!masked.includes('ссылку'));
  assert.ok(!masked.includes('example'));
  assert.ok(!masked.includes('заметка'));
  assert.ok(masked.includes('Ставлю'));
  assert.ok(masked.includes('дальше.'));
});

test('masks frontmatter only at the start', () => {
  const text = '---\ntags: [разное]\n---\nТекст заметки.';
  const masked = maskMarkdown(text);

  assert.ok(!masked.includes('разное'));
  assert.ok(masked.includes('Текст заметки.'));
});

test('leaves offsets of the prose untouched', () => {
  const text = 'Первое слово, `код`, и последнее слово.';
  const masked = maskMarkdown(text);

  assert.equal(masked.indexOf('последнее'), text.indexOf('последнее'));
});

test('does not touch plain prose without markdown', () => {
  const text = 'Обычный текст без разметки, только запятые и тире.';
  assert.equal(maskMarkdown(text), text);
});
