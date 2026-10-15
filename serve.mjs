// 로컬 미리보기 서버: node serve.mjs → http://localhost:4173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const base = path.join(DIST, path.normalize(p));
  if (!base.startsWith(DIST)) return res.writeHead(403).end();
  // Vercel cleanUrls 와 동일하게: /guide → guide/index.html, /terms → terms.html
  let file = base;
  for (const c of [base, base + '.html', path.join(base, 'index.html')]) {
    if (await stat(c).then((st) => st.isFile(), () => false)) { file = c; break; }
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(path.join(DIST, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`▶ http://localhost:${PORT}`));
