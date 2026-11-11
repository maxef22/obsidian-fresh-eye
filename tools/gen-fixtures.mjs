/**
 * Extracts the end-to-end golden test from the reference Go implementation
 * (colorizer_test.go) into JSON, so the TypeScript port can be compared against
 * it character for character.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SRC = 'obs-plugin/vendor-src/colorizer_test.go';
const OUT = 'obs-plugin/test/fixtures/colorizer.json';

const go = await readFile(SRC, 'utf8');

function rawString(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  const start = source.indexOf('`', at);
  const end = source.indexOf('`', start + 1);
  if (start < 0 || end < 0) throw new Error(`raw string not closed after ${marker}`);
  return source.slice(start + 1, end);
}

function quotedString(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  let i = source.indexOf('"', at) + 1;
  let out = '';
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      const next = source[i + 1];
      switch (next) {
        case 'n':
          out += '\n';
          break;
        case 't':
          out += '\t';
          break;
        case 'r':
          out += '\r';
          break;
        case '"':
          out += '"';
          break;
        case '\\':
          out += '\\';
          break;
        default:
          out += next;
      }
      i += 2;
      continue;
    }
    if (ch === '"') return out;
    out += ch;
    i++;
  }
  throw new Error(`quoted string not closed after ${marker}`);
}

const input = rawString(go, 'const input =');
const want = quotedString(go, 'const want =');

if (!input.includes('Дул ветер')) throw new Error('input looks wrong');
if (!want.includes('background-color')) throw new Error('want looks wrong');

await mkdir('obs-plugin/test/fixtures', { recursive: true });
await writeFile(OUT, JSON.stringify({ input, want, contextSize: 20, sensitivityThreshold: 400, excludeProperNames: false }, null, 2) + '\n');

console.log(`wrote ${OUT}: input=${input.length} chars, want=${want.length} chars`);
