/**
 * Port of https://gitlab.com/opennota/fresheye (AGPL-3.0).
 * Original idea and algorithm: "Свежий взгляд" by Maxim Kirsanov.
 */
import { ALPHABET_SIZE } from './tables.ts';

const A_CODE = 0x430; // 'а'
const YA_CODE = 0x44f; // 'я'
const YO_CODE = 0x451; // 'ё'
const PLACEHOLDER = 32; // slot reserved for "not a Russian letter", all-zero row

/** A word encoded for the similarity function. */
export interface Fnord {
  /** Letter indices, see {@link ALPHABET_SIZE}. */
  readonly lnum: readonly number[];
  /** 1-based index of the first occurrence of each letter, or 0 when absent. */
  readonly lindex: readonly number[];
}

/** Encodes a lowercase Russian word. Unknown characters become the zero-weight placeholder. */
export function toFnord(word: string): Fnord {
  const lnum = new Array<number>(word.length);
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i);
    if (code >= A_CODE && code <= YA_CODE) {
      lnum[i] = code - A_CODE;
    } else if (code === YO_CODE) {
      lnum[i] = 33;
    } else {
      lnum[i] = PLACEHOLDER;
    }
  }

  const lindex = new Array<number>(ALPHABET_SIZE).fill(0);
  for (let i = lnum.length - 1; i >= 0; i--) {
    lindex[lnum[i]] = i + 1;
  }

  return { lnum, lindex };
}
