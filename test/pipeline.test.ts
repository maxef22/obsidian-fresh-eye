import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { clusterFindings } from '../src/core/cluster.ts';
import { checkProse } from '../src/plugin/prose.ts';

const story = readFileSync(new URL('../samples/рассказ2.txt', import.meta.url), 'utf8');

function clustersAt(text: string, threshold: number) {
  return clusterFindings(checkProse(text, { sensitivityThreshold: threshold }));
}

test('groups the intentional repetition of «квадрат» into one cluster', () => {
  const occurrences = clustersAt(story, 800).find(
    (cluster) => cluster.spans.filter((span) => span.text.toLowerCase() === 'квадрат').length >= 3,
  );

  assert.ok(occurrences, 'no cluster with three or more «квадрат»');
});

test('the same check on a story of 2731 words stays within a sane range', () => {
  const clusters = clustersAt(story, 800);

  assert.ok(clusters.length > 5, `too few clusters: ${clusters.length}`);
  assert.ok(clusters.length < 200, `too many clusters: ${clusters.length}`);
});

test('code blocks do not take part in the analysis', () => {
  const text = 'Моря и морем.\n```\nморя морем моря\n```\n';
  const clusters = clustersAt(text, 400);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].spans.length, 2);
});
