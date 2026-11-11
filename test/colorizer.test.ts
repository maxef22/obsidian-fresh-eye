import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toColoredHTML } from '../src/core/colorizer.ts';

interface Fixture {
  input: string;
  want: string;
  contextSize: number;
  sensitivityThreshold: number;
  excludeProperNames: boolean;
}

// The expected output comes from colorizer_test.go of the reference
// implementation: same input text, same options, character for character.
const fixture: Fixture = JSON.parse(
  readFileSync(new URL('./fixtures/colorizer.json', import.meta.url), 'utf8'),
);

test('end-to-end output matches the reference implementation', () => {
  const got = toColoredHTML(
    fixture.input,
    fixture.contextSize,
    fixture.sensitivityThreshold,
    fixture.excludeProperNames,
  );

  if (got !== fixture.want) {
    const at = [...got].findIndex((ch, i) => ch !== [...fixture.want][i]);
    const from = Math.max(0, at - 120);
    assert.fail(
      `first difference at char ${at}\n--- got ---\n${got.slice(from, at + 120)}\n--- want ---\n${fixture.want.slice(from, at + 120)}`,
    );
  }
});
