/**
 * Works out which parts of a note are not prose: code, math, links, tags,
 * frontmatter. The analysis itself runs on the untouched text, so distances
 * between words stay exactly as the reference implementation computes them;
 * findings that touch an excluded region are dropped afterwards.
 */

export type Range = readonly [from: number, to: number];

/** Ranges of a note that must not be analysed. */
export function maskedRanges(text: string): Range[] {
  const ranges: Range[] = [];

  const add = (from: number, to: number): void => {
    if (to > from) ranges.push([from, to]);
  };

  // Frontmatter, only at the very start of the document.
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:[ \t]*\r?\n|$)/.exec(text);
  if (frontmatter) add(0, frontmatter[0].length);

  const patterns: RegExp[] = [
    /```[\s\S]*?```/g, // fenced code
    /~~~[\s\S]*?~~~/g,
    /`[^`\n]+`/g, // inline code
    /\$\$[\s\S]*?\$\$/g, // display math
    /\$[^$\n]+\$/g, // inline math
    /%%[\s\S]*?%%/g, // comments
    /\[\[[^\]]*\]\]/g, // wiki links
    /!?\[[^\]\n]*\]\([^)\n]*\)/g, // markdown links and images
    /\[\^[^\]]*\]/g, // footnote references
    /https?:\/\/[^\s<>()]+/g, // bare urls
    /<[^>\n]+>/g, // inline html
    /(?<=^|[\s(])#[^\s#]+/gm, // tags
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      add(match.index, match.index + match[0].length);
      if (match[0].length === 0) pattern.lastIndex++;
      match = pattern.exec(text);
    }
  }

  ranges.sort((a, b) => a[0] - b[0]);
  return ranges;
}

/** Whether a span overlaps any excluded range. */
export function intersectsMasked(ranges: readonly Range[], from: number, to: number): boolean {
  let low = 0;
  let high = ranges.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end] = ranges[mid];
    if (to <= start) {
      high = mid - 1;
    } else if (from >= end) {
      low = mid + 1;
    } else {
      return true;
    }
  }

  return false;
}

/** Copy of the text with excluded regions replaced by spaces; for debugging. */
export function maskMarkdown(text: string): string {
  const ranges = maskedRanges(text);
  if (ranges.length === 0) return text;

  const chars = text.split('');
  for (const [from, to] of ranges) {
    for (let i = from; i < to && i < chars.length; i++) {
      if (chars[i] !== '\n') chars[i] = ' ';
    }
  }
  return chars.join('');
}
