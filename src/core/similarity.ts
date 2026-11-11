/**
 * Port of https://gitlab.com/opennota/fresheye (AGPL-3.0), context.go.
 * Original idea and algorithm: "Свежий взгляд" by Maxim Kirsanov.
 *
 * The arithmetic below is a deliberate, operand-for-operand translation of the
 * Go original: the tuned constants only make sense together with the exact
 * order of floating point operations.
 */
import { INF_LETTERS, SIM_CH, SIM_CH_STRIDE } from './tables.ts';
import type { Fnord } from './fnord.ts';

const DISSIMILARITY_THRESHOLD = 24000;

/**
 * Share of "informativeness" that two words have in common, and the amount of
 * dissimilar material in them.
 */
export function inforSameDiff(ca: Fnord, cb: Fnord): [same: number, diff: number] {
  let countSame = 0;
  let resSame = 0;
  let resDiff = 0;

  const a = ca.lnum;
  const b = cb.lnum;
  const indexInA = ca.lindex;
  const indexInB = cb.lindex;

  let p = 0;

  for (let i = 0; i < a.length; i++) {
    const v = a[i];
    const bp = indexInB[v];
    if (bp === 0) {
      p = i === 0 ? INF_LETTERS[v * 2 + 1] : INF_LETTERS[v * 2];
      resDiff += p;
    } else {
      p = i === 0 && bp === 1 ? INF_LETTERS[v * 2 + 1] : INF_LETTERS[v * 2];
      resSame += p;
      countSame++;
    }
  }

  for (let i = 0; i < b.length; i++) {
    const v = b[i];
    if (indexInA[v] === 0) {
      p = i === 0 ? INF_LETTERS[v * 2 + 1] : INF_LETTERS[v * 2];
      resDiff += p;
    }
  }

  const same = countSame !== 0 ? resSame / countSame : 0;
  return [same, resDiff];
}

/** How similar two words sound, in "badness" units before distance decay. */
export function wordSimilarity(ca: Fnord, cb: Fnord): number {
  if (ca.lnum.length > cb.lnum.length) {
    const tmp = ca;
    ca = cb;
    cb = tmp;
  }

  const [sameRatio, dissim] = inforSameDiff(ca, cb);
  if (dissim >= DISSIMILARITY_THRESHOLD) return 0;

  const a = ca.lnum;
  const b = cb.lnum;

  const rp3Alen = 1 / (3 * a.length);
  const rp3BLen = 1 / (3 * b.length);
  const k1 = ((a.length + b.length) * 3) / 8 + 1;
  const k2 = Math.min(k1, a.length);

  let result = 0;
  const maxq = new Float64Array(a.length + 1);

  for (let i0 = 0; i0 < a.length; i0++) {
    for (let j0 = 0; j0 < b.length; j0++) {
      let p = 0;
      const k3 = (1 - i0 * rp3Alen) * (1 - j0 * rp3BLen);
      for (let i = i0, j = j0, partlen = 1; i < a.length && j < b.length; ) {
        p += SIM_CH[a[i] * SIM_CH_STRIDE + b[j]];
        let q = p * k3;
        const dist = a.length - (i + partlen) + j;
        if (dist < 2) {
          q *= 1 + (2 - dist) * 0.333;
        }
        if (q > maxq[partlen]) maxq[partlen] = q;
        i++;
        j++;
        partlen++;
      }
    }
  }

  for (let partlen = 0; partlen < maxq.length; partlen++) {
    const m = maxq[partlen];
    if (m > 6 * partlen) {
      result += m * (1 + (partlen - k2) / (2 * k1));
    }
  }

  result *= sameRatio / (a.length * (a.length + 1) * 4.5);
  result *= (DISSIMILARITY_THRESHOLD - dissim) / DISSIMILARITY_THRESHOLD;
  result *= 1 - (b.length - a.length) / (2 * b.length);
  result *= (a.length * b.length) / (implen(a.length) * implen(b.length));

  return result;
}

function implen(x: number): number {
  if (x === 2) return 5;
  return x - ((x - 1) * (x - 1)) / 36 + 4.1 / x;
}
