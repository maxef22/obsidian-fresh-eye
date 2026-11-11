/**
 * Port of https://gitlab.com/opennota/fresheye (AGPL-3.0), colorizer.go.
 * Original idea and algorithm: "Свежий взгляд" by Maxim Kirsanov.
 *
 * The reference implementation paints every pair in its own tint so that
 * neighbouring problems stay visually distinguishable. The plugin reuses the
 * same palette for its editor decorations.
 */
import { analyze } from './analyze.ts';
import type { Finding } from './analyze.ts';

const HIGHLIGHT_COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [235, 20, 255],
  [255, 130, 25],
  [0, 255, 20],
];

export interface Paint {
  readonly color: readonly [number, number, number];
  readonly badness: number;
  readonly counter: number;
}

/** Tints a highlight towards white; `level` is the 0..1 severity. */
export function colorForTint(level: number, colorCounter: number): [number, number, number] {
  const c = HIGHLIGHT_COLORS[colorCounter % HIGHLIGHT_COLORS.length];
  level += (1 - level) * 0.1;
  return [
    Math.round(255 + (c[0] - 255) * level),
    Math.round(255 + (c[1] - 255) * level),
    Math.round(255 + (c[2] - 255) * level),
  ];
}

/** Assigns a color to every word that takes part in at least one finding. */
export function colorize(findings: readonly Finding[], threshold: number): Map<number, Paint> {
  const painted = new Map<number, Paint>();
  let counter = 0;

  for (const pair of findings) {
    const badness = Math.min(pair.badness, 2000);
    const level = (badness - threshold) / (2000 - threshold);

    const first = painted.get(pair.first.start);
    const second = painted.get(pair.second.start);
    if (first) counter = first.counter;
    if (second) counter = second.counter;

    const color = colorForTint(level, counter);

    if (!first || first.badness < badness) {
      painted.set(pair.first.start, { color, badness, counter });
    }
    if (!second || second.badness < badness) {
      painted.set(pair.second.start, { color, badness, counter });
    }

    counter++;
  }

  return painted;
}

function escapeHtml(s: string): string {
  return s.replace(/[&'<>"]/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case "'":
        return '&#39;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return '&#34;';
    }
  });
}

function toHex(color: readonly [number, number, number]): string {
  return color.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Renders the text with problem words highlighted, for tests and for reports. */
export function toColoredHTML(
  text: string,
  contextSize = 20,
  sensitivityThreshold = 400,
  excludeProperNames = false,
): string {
  const findings = analyze(text, { contextSize, sensitivityThreshold, excludeProperNames });
  const painted = colorize(findings, sensitivityThreshold);

  const words = new Map<number, { start: number; end: number }>();
  for (const f of findings) {
    words.set(f.first.start, f.first);
    words.set(f.second.start, f.second);
  }
  const sorted = [...words.values()].sort((a, b) => a.start - b.start);

  let out = '';
  let index = 0;
  for (const word of sorted) {
    const paint = painted.get(word.start);
    if (!paint) continue;
    out += escapeHtml(text.slice(index, word.start));
    out += `<span style="background-color: #${toHex(paint.color)}">`;
    out += text.slice(word.start, word.end);
    out += '</span>';
    index = word.end;
  }
  out += escapeHtml(text.slice(index));

  return out.replace(/\n/g, '<br>\n');
}
