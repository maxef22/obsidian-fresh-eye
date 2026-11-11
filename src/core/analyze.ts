/**
 * Port of https://gitlab.com/opennota/fresheye (AGPL-3.0), context.go.
 * Original idea and algorithm: "Свежий взгляд" by Maxim Kirsanov.
 */
import { iterateWords } from './iterator.ts';
import { toFnord } from './fnord.ts';
import type { Fnord } from './fnord.ts';
import { wordSimilarity } from './similarity.ts';
import { EXCEPTIONS, EXCEPTION_SECONDS } from './tables.ts';

export const DEFAULT_CONTEXT_SIZE = 20;
export const DEFAULT_SENSITIVITY_THRESHOLD = 400;

/** A span of text that the plugin can underline. */
export interface WordSpan {
  /** The word as it appears in the text. */
  readonly text: string;
  /** Start offset, inclusive. */
  readonly start: number;
  /** End offset, exclusive. */
  readonly end: number;
}

/** Two words that sound alike and are close to each other. */
export interface Finding {
  /** 0..2000, higher means worse; the threshold is 400 by default. */
  readonly badness: number;
  readonly first: WordSpan;
  readonly second: WordSpan;
}

export interface AnalyzeOptions {
  /** How many preceding words to compare each word with. Defaults to 20. */
  readonly contextSize?: number;
  /** Pairs with badness below this value are ignored. Defaults to 400. */
  readonly sensitivityThreshold?: number;
  /** Skip capitalized words that are not at the start of a sentence. */
  readonly excludeProperNames?: boolean;
}

interface QueueElement {
  readonly span: WordSpan;
  readonly wordStr: string;
  readonly fnord: Fnord;
  readonly sepWeight: number;
  readonly newSentence: boolean;
  readonly proper: boolean;
}

function weighSep(sep: string, paragraphStart: boolean): { weight: number; newSentence: boolean } {
  let weight = paragraphStart ? 8 : 0;
  let seenSpace = false;
  let newSentence = paragraphStart;

  for (const r of sep) {
    switch (r) {
      case ' ':
      case '\u00a0':
        if (!seenSpace) {
          weight++;
          seenSpace = true;
        }
        break;
      case ',':
      case '/':
        weight += 2;
        break;
      case '.':
      case '?':
      case '!':
        weight += 4;
        newSentence = true;
        break;
      case '(':
      case ')':
      case '[':
      case ']':
      case '<':
      case '>':
        weight += 3;
        break;
      case '"':
      case '\\':
      case '«':
      case '»':
      case '“':
      case '”':
      case '„':
        weight += 3;
        newSentence = true;
        break;
      case '—':
      case '–':
        weight += 3;
        break;
      case '-':
        weight++;
        if (seenSpace) weight += 2;
        break;
      default:
        break;
    }
  }

  return { weight, newSentence };
}

/** Capitalized Russian word with a lowercase second letter: a rough proper-name test. */
function isTitle(s: string): boolean {
  if (s.length < 2) return false;
  const first = s.charCodeAt(0);
  if (!((first >= 0x410 && first <= 0x42f) || first === 0x401)) return false;
  const second = s.charCodeAt(1);
  return (second >= 0x430 && second <= 0x44f) || second === 0x451;
}

/** Finds pairs of similar-sounding words placed close to each other. */
export function analyze(text: string, options: AnalyzeOptions = {}): Finding[] {
  const contextSize = options.contextSize ?? DEFAULT_CONTEXT_SIZE;
  const threshold = options.sensitivityThreshold ?? DEFAULT_SENSITIVITY_THRESHOLD;
  const excludeProperNames = options.excludeProperNames ?? false;
  const twoSigmaSqrReciprocal = 1 / (2 * Math.pow(contextSize * 4, 2));

  const queue: QueueElement[] = [];
  const findings: Finding[] = [];

  for (const token of iterateWords(text)) {
    const { weight: sepWeight, newSentence } = weighSep(token.sep, token.paragraphStart);
    const wordStr = token.text.toLowerCase();

    if (queue.length > contextSize) queue.shift();
    queue.push({
      span: { text: token.text, start: token.start, end: token.end },
      wordStr,
      fnord: toFnord(wordStr),
      sepWeight,
      newSentence,
      proper: !newSentence && isTitle(token.text),
    });

    const cur = queue[queue.length - 1];
    if (excludeProperNames && cur.proper) continue;

    const checkException = EXCEPTION_SECONDS.has(cur.wordStr);

    for (let i = 0; i < queue.length - 1; i++) {
      const other = queue[i];
      if (excludeProperNames && other.proper) continue;
      if (checkException && EXCEPTIONS.has(`${other.wordStr} ${cur.wordStr}`)) continue;

      const similarity = wordSimilarity(other.fnord, cur.fnord);

      let distance = 0;
      for (let j = i + 1; j < queue.length; j++) {
        distance += queue[j].sepWeight;
        if (j < queue.length - 1) {
          distance += queue[j].fnord.lnum.length * 0.333 + 1;
        }
      }

      const decay = Math.exp(-distance * distance * twoSigmaSqrReciprocal);
      const badness = similarity * decay;
      if (badness <= threshold) continue;

      findings.push({ badness, first: other.span, second: cur.span });
    }
  }

  return findings;
}
