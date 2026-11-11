import { analyze } from '../core/analyze.ts';
import type { AnalyzeOptions, Finding } from '../core/analyze.ts';
import { intersectsMasked, maskedRanges } from './markdown.ts';

/**
 * Runs the analysis on the whole note and drops findings that touch code,
 * links, tags and other non-prose. Distances between words are left untouched,
 * so the result stays comparable with the reference implementation.
 */
export function checkProse(text: string, options: AnalyzeOptions = {}): Finding[] {
  const ranges = maskedRanges(text);
  if (ranges.length === 0) return analyze(text, options);

  return analyze(text, options).filter(
    (finding) =>
      !intersectsMasked(ranges, finding.first.start, finding.first.end) &&
      !intersectsMasked(ranges, finding.second.start, finding.second.end),
  );
}
