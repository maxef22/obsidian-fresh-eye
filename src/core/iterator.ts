/**
 * Port of https://gitlab.com/opennota/fresheye (AGPL-3.0), word_iterator.go.
 * Original idea and algorithm: "Свежий взгляд" by Maxim Kirsanov.
 */

/** One Russian word with the text that separates it from the previous word. */
export interface WordToken {
  /** The word as it appears in the text, original case. */
  readonly text: string;
  /** Start offset in the source text, inclusive. */
  readonly start: number;
  /** End offset in the source text, exclusive. */
  readonly end: number;
  /** Text between the previous word and this one. */
  readonly sep: string;
  /** Whether a new paragraph starts at or before this word. */
  readonly paragraphStart: boolean;
}

function isRussianLetter(code: number): boolean {
  return (
    (code >= 0x430 && code <= 0x44f) || // а-я
    (code >= 0x410 && code <= 0x42f) || // А-Я
    code === 0x451 || // ё
    code === 0x401 // Ё
  );
}

/**
 * Walks the text and yields Russian words one by one. Everything else — Latin
 * words, digits, punctuation, Markdown syntax — is treated as a separator.
 *
 * The traversal is a literal translation of the Go original, including its
 * quirk: the single character that terminates a word is consumed without being
 * inspected, so a lone newline right after a word does not start a paragraph.
 */
export function* iterateWords(text: string): Generator<WordToken> {
  let index = 0;
  let previousEnd = 0;
  let first = true;

  while (index < text.length) {
    let paragraphStart = first;
    first = false;

    // Skip to the next Russian letter, noticing paragraph breaks on the way.
    let start = -1;
    while (index < text.length) {
      const code = text.charCodeAt(index);
      if (code === 0x0a) paragraphStart = true;
      if (isRussianLetter(code)) {
        start = index;
        break;
      }
      index++;
    }
    if (start < 0) return;

    // Consume the word; the terminating character is consumed too, exactly as
    // the reference implementation does.
    let end = start;
    while (index < text.length) {
      const code = text.charCodeAt(index);
      index++;
      if (!isRussianLetter(code)) break;
      end = index;
    }

    yield {
      text: text.slice(start, end),
      start,
      end,
      sep: text.slice(previousEnd, start),
      paragraphStart,
    };

    previousEnd = end;
  }
}
