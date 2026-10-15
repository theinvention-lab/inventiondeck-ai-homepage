// dist/ 내 모든 HTML의 내부 링크(href/src)와 #앵커가 실제로 존재하는지 검사한다.
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(f)));
    else if (f.endsWith('.html')) out.push(f);
  }
  return out;
}
const files = await walk(DIST);
const cache = new Map();
const htmlOf = async (f) => cache.get(f) ?? cache.set(f, await readFile(f, 'utf8')).get(f);
let bad = 0;
for (const file of files) {
  if (file.endsWith('404.html')) continue;
  const html = await htmlOf(file);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(url)) continue;
    const [p, hash] = url.split('#');
    const clean = p.split('?')[0];
    const base = !clean ? file : clean.startsWith('/') ? path.join(DIST, clean) : path.resolve(path.dirname(file), clean);
    let target = null;
    for (const c of [base, base + '.html', path.join(base, 'index.html')]) {
      try { await access(c); if (!c.endsWith(path.sep) && !(await readdir(c).then(() => true, () => false))) { target = c; break; } } catch {}
    }
    if (!target) { console.log(`✗ ${path.relative(DIST, file)} → ${url}`); bad++; continue; }
    if (hash && target.endsWith('.html') && !(await htmlOf(target)).includes(`id="${hash}"`)) {
      console.log(`✗ ${path.relative(DIST, file)} → ${url} (앵커 없음)`); bad++;
    }
  }
}
console.log(bad ? `${bad}개의 깨진 링크` : `✔ ${files.length}개 페이지, 깨진 내부 링크 없음`);
process.exit(bad ? 1 : 0);
