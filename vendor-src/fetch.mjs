import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://gitlab.com/opennota/fresheye/-/raw/master/';
const files = [
  'word_iterator.go',
  'context_test.go',
  'word_iterator_test.go',
  'colorizer_test.go',
  'testdata/kuprin.txt',
];

await mkdir('obs-plugin/vendor-src/testdata', { recursive: true });

for (const f of files) {
  const url = BASE + f;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const text = await res.text();
    const out = 'obs-plugin/vendor-src/' + f;
    await writeFile(out, text);
    console.log('OK', res.status, text.length, out);
  } catch (e) {
    console.log('FAIL', f, e.message);
  }
}

// AGPL-3.0 license text
try {
  const res = await fetch('https://www.gnu.org/licenses/agpl-3.0.txt', { signal: AbortSignal.timeout(60000) });
  const text = await res.text();
  await writeFile('obs-plugin/LICENSE', text);
  console.log('OK LICENSE', res.status, text.length);
} catch (e) {
  console.log('FAIL LICENSE', e.message);
}
