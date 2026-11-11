export { analyze, DEFAULT_CONTEXT_SIZE, DEFAULT_SENSITIVITY_THRESHOLD } from './analyze.ts';
export type { AnalyzeOptions, Finding, WordSpan } from './analyze.ts';
export { iterateWords } from './iterator.ts';
export type { WordToken } from './iterator.ts';
export { toFnord } from './fnord.ts';
export type { Fnord } from './fnord.ts';
export { wordSimilarity, inforSameDiff } from './similarity.ts';
export { colorize, colorForTint, toColoredHTML } from './colorizer.ts';
export type { Paint } from './colorizer.ts';
