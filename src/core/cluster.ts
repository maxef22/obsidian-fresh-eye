import type { Finding, WordSpan } from './analyze.ts';

/** A group of word occurrences that are all connected by findings. */
export interface Cluster {
  /** Word occurrences, ordered by position. */
  readonly spans: readonly WordSpan[];
  /** Pairs that connect the occurrences. */
  readonly findings: readonly Finding[];
  /** The worst pair in the cluster. */
  readonly maxBadness: number;
  /** Set when every occurrence is the same word, ignoring case. */
  readonly repeatedWord: string | null;
}

interface MutableCluster {
  spans: WordSpan[];
  findings: Finding[];
  maxBadness: number;
  repeatedWord: string | null;
}

/**
 * Groups pairwise findings into clusters, so that a word repeated four times is
 * one problem with six pairs instead of six separate underlines.
 */
export function clusterFindings(findings: readonly Finding[]): Cluster[] {
  const spans = new Map<number, WordSpan>();
  const parent = new Map<number, number>();

  const find = (start: number): number => {
    let root = start;
    while (parent.get(root) !== root) root = parent.get(root) as number;
    let current = start;
    while (current !== root) {
      const next = parent.get(current) as number;
      parent.set(current, root);
      current = next;
    }
    return root;
  };

  const add = (span: WordSpan): void => {
    if (!spans.has(span.start)) {
      spans.set(span.start, span);
      parent.set(span.start, span.start);
    }
  };

  for (const finding of findings) {
    add(finding.first);
    add(finding.second);
    const a = find(finding.first.start);
    const b = find(finding.second.start);
    if (a !== b) parent.set(b, a);
  }

  const groups = new Map<number, { spans: WordSpan[]; findings: Finding[] }>();
  for (const span of spans.values()) {
    const root = find(span.start);
    let group = groups.get(root);
    if (!group) {
      group = { spans: [], findings: [] };
      groups.set(root, group);
    }
    group.spans.push(span);
  }

  const byStart = new Map<number, MutableCluster>();
  for (const [root, group] of groups) {
    group.spans.sort((x, y) => x.start - y.start);
    byStart.set(root, {
      spans: group.spans,
      findings: group.findings,
      maxBadness: 0,
      repeatedWord: null,
    });
  }

  for (const finding of findings) {
    const cluster = byStart.get(find(finding.first.start));
    if (!cluster) continue;
    cluster.findings.push(finding);
    if (finding.badness > cluster.maxBadness) cluster.maxBadness = finding.badness;
  }

  const result: Cluster[] = [];
  for (const cluster of byStart.values()) {
    const first = cluster.spans[0].text.toLowerCase();
    const uniform = cluster.spans.every((s) => s.text.toLowerCase() === first);
    result.push({
      spans: cluster.spans,
      findings: cluster.findings,
      maxBadness: cluster.maxBadness,
      repeatedWord: uniform ? first : null,
    });
  }

  result.sort((a, b) => a.spans[0].start - b.spans[0].start);
  return result;
}

/** Human-readable description of a cluster, used for tooltips and reports. */
export function describeCluster(cluster: Cluster): string {
  if (cluster.repeatedWord) {
    return `«${cluster.repeatedWord}» — ${cluster.spans.length} раза подряд`;
  }
  const words = cluster.spans.map((s) => s.text.toLowerCase());
  return `похожие слова рядом: ${[...new Set(words)].join(', ')}`;
}
