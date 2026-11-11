import test from 'node:test';
import assert from 'node:assert/strict';

import { toFnord } from '../src/core/fnord.ts';
import { inforSameDiff, wordSimilarity } from '../src/core/similarity.ts';

// Golden values from context_test.go of the reference implementation.
const INFOR_CASES: ReadonlyArray<readonly [string, string, readonly [number, number]]> = [
  ['шкипера', 'переплета', [894.5, 4661]],
  ['переплета', 'шкипера', [883.4285714285714, 4661]],
  ['лужицы', 'лежал', [1354, 6264]],
  ['особым', 'особенности', [918.75, 6351]],
  ['запах', 'пропахло', [987.75, 4279]],
  ['выколов', 'слов', [849, 3018]],
];

const SIMILARITY_CASES: ReadonlyArray<readonly [string, string, number]> = [
  ['шкипера', 'переплета', 214.70387507415273],
  ['переплета', 'шкипера', 214.70387507415273],
  ['лужицы', 'лежал', 454.6748372891439],
  ['особым', 'особенности', 652.7981153335286],
  ['запах', 'пропахло', 467.8451462363338],
  ['выколов', 'слов', 217.15781306460204],
];

test('inforSameDiff reproduces the reference values', () => {
  for (const [a, b, want] of INFOR_CASES) {
    assert.deepEqual(inforSameDiff(toFnord(a), toFnord(b)), want, `${a} / ${b}`);
  }
});

test('wordSimilarity reproduces the reference values', () => {
  for (const [a, b, want] of SIMILARITY_CASES) {
    assert.equal(wordSimilarity(toFnord(a), toFnord(b)), want, `${a} / ${b}`);
  }
});

test('wordSimilarity is symmetric', () => {
  for (const [a, b] of SIMILARITY_CASES) {
    assert.equal(wordSimilarity(toFnord(a), toFnord(b)), wordSimilarity(toFnord(b), toFnord(a)));
  }
});

test('unrelated words stay below the report threshold', () => {
  assert.ok(wordSimilarity(toFnord('кот'), toFnord('электричество')) < 400);
});
