import test from 'node:test';
import assert from 'node:assert/strict';

import { iterateWords } from '../src/core/iterator.ts';

// Golden case from word_iterator_test.go of the reference implementation.
// Offset expectations are in UTF-8 bytes, exactly as in the Go test, so they
// are converted to JavaScript string indices before comparison.
const TEXT =
  'На правой стороне человек, носивший имя Лазарь Норман, расписался двадцать четыре раза с хвостиками и всеобъемлющими росчерками.\n' +
  'Еще кто-то решительно зачеркнул рукописание Нормана и в самом низу оставил загадочные слова: "Что знаем мы о себе?"';

const WORDS = [
  'На', 'правой', 'стороне', 'человек', 'носивший', 'имя', 'Лазарь', 'Норман', 'расписался',
  'двадцать', 'четыре', 'раза', 'с', 'хвостиками', 'и', 'всеобъемлющими', 'росчерками', 'Еще',
  'кто', 'то', 'решительно', 'зачеркнул', 'рукописание', 'Нормана', 'и', 'в', 'самом', 'низу',
  'оставил', 'загадочные', 'слова', 'Что', 'знаем', 'мы', 'о', 'себе',
];

const SEPS = [
  '', ' ', ' ', ' ', ', ', ' ', ' ', ' ', ', ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '.\n', ' ',
  '-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ': "', ' ', ' ', ' ', ' ',
];

const BYTE_SPANS: ReadonlyArray<readonly [number, number]> = [
  [0, 4], [5, 17], [18, 32], [33, 47], [49, 65], [66, 72], [73, 85], [86, 98], [100, 120],
  [121, 137], [138, 150], [151, 159], [160, 162], [163, 183], [184, 186], [187, 215], [216, 236],
  [238, 244], [245, 251], [252, 256], [257, 277], [278, 296], [297, 319], [320, 334], [335, 337],
  [338, 340], [341, 351], [352, 360], [361, 375], [376, 396], [397, 407], [410, 416], [417, 427],
  [428, 432], [433, 435], [436, 444],
];

function byteToChar(text: string): (byteOffset: number) => number {
  const map = new Map<number, number>();
  let bytes = 0;
  for (let i = 0; i <= text.length; i++) {
    map.set(bytes, i);
    if (i < text.length) bytes += text.charCodeAt(i) > 0x7f ? 2 : 1;
  }
  return (offset) => {
    const index = map.get(offset);
    if (index === undefined) throw new Error(`no character index for byte offset ${offset}`);
    return index;
  };
}

test('word iterator matches the reference behaviour', () => {
  const toChar = byteToChar(TEXT);
  let i = 0;

  for (const token of iterateWords(TEXT)) {
    assert.equal(token.text, WORDS[i], `word[${i}]`);
    assert.equal(token.sep, SEPS[i], `sep[${i}]`);
    assert.equal(token.start, toChar(BYTE_SPANS[i][0]), `start[${i}]`);
    assert.equal(token.end, toChar(BYTE_SPANS[i][1]), `end[${i}]`);
    i++;
  }

  assert.equal(i, WORDS.length, 'word count');
});

test('only the first word of each paragraph is marked', () => {
  const starts = [...iterateWords(TEXT)].map((t) => t.paragraphStart);
  assert.deepEqual(
    starts.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [0, 17],
  );
});
