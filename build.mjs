// 의존성 없는 정적 사이트 빌더.
// src/pages/**/*.html 의 front matter + 본문을 공통 레이아웃으로 감싸 dist/ 에 출력한다.
import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, nav, guideGroups, footerLinks } from './src/site.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const OUT = path.join(ROOT, 'dist');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (!m) return { meta, body: raw };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: raw.slice(m[0].length) };
}

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 가이드 하위 페이지 순서 (이전/다음 내비게이션 용)
const guideFlat = guideGroups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.title })));

function header(current) {
  const links = nav
    .map((n) => `<a href="{{root}}${n.href}"${n.key === current ? ' aria-current="page"' : ''}>${n.label}</a>`)
    .join('');
  return `
<a class="skip-link" href="#main">본문 바로가기</a>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="{{root}}index.html" aria-label="${site.name} 홈">
      <img class="brand-logo" src="{{root}}assets/img/logo.png" alt="InventionDeck" width="88" height="40">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
      <span class="sr-only">메뉴 열기</span><span class="bar"></span><span class="bar"></span><span class="bar"></span>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="주 메뉴" data-nav>
      ${links}
    </nav>
  </div>
</header>`;
}

function footer() {
  const cols = footerLinks
    .map(
      (col) => `<div class="footer-col"><h3>${col.title}</h3><ul>${col.items
        .map((it) => `<li><a href="{{root}}${it.href}">${it.label}</a></li>`)
        .join('')}</ul></div>`
    )
    .join('');
  return `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-about">
      <a class="brand brand-footer" href="{{root}}index.html"><img class="brand-logo" src="{{root}}assets/img/logo.png" alt="InventionDeck AI" width="88" height="40"></a>
      <p>카드로 발상하고, AI로 확장하고, 템플릿으로 구체화하는 비즈니스 아이디에이션 플랫폼</p>
      <p class="footer-company">${site.company} · 대표 ${site.ceo}<br>문의 <a href="mailto:${site.email}">${site.email}</a></p>
    </div>
    ${cols}
  </div>
  <div class="container footer-bottom">
    <p>© ${new Date().getFullYear()} ${site.companyEn}. All rights reserved.</p>
    <p><a href="{{root}}terms.html">서비스이용약관</a> · <a href="{{root}}privacy.html"><b>개인정보처리방침</b></a></p>
  </div>
</footer>`;
}

function guideSidebar(currentHref) {
  const groups = guideGroups
    .map(
      (g) => `<div class="side-group"><p class="side-title">${g.title}</p><ul>${g.items
        .map(
          (it) =>
            `<li><a href="{{root}}${it.href}"${it.href === currentHref ? ' aria-current="page"' : ''}>${it.label}</a></li>`
        )
        .join('')}</ul></div>`
    )
    .join('');
  return `<aside class="guide-side" aria-label="가이드 목차">
    <a class="side-home" href="{{root}}guide/index.html">← 사용 가이드 홈</a>
    ${groups}
  </aside>`;
}

function guidePager(currentHref) {
  const i = guideFlat.findIndex((it) => it.href === currentHref);
  if (i < 0) return '';
  const prev = guideFlat[i - 1];
  const next = guideFlat[i + 1];
  return `<nav class="pager" aria-label="가이드 이전/다음">
    ${prev ? `<a class="pager-prev" href="{{root}}${prev.href}"><small>이전 · ${prev.group}</small><span>${prev.label}</span></a>` : '<span></span>'}
    <a class="btn btn-ghost" href="{{root}}guide/index.html">뒤로가기</a>
    ${next ? `<a class="pager-next" href="{{root}}${next.href}"><small>다음 · ${next.group}</small><span>${next.label}</span></a>` : '<span></span>'}
  </nav>`;
}

// /guide/index.html → /guide, /terms.html → /terms, /index.html → /
function cleanPath(p) {
  const out = p.replace(/\.html$/, '').replace(/\/index$/, '');
  return out || '/';
}

function layout({ meta, body, rel }) {
  const href = rel.split(path.sep).join('/');
  // 모든 링크는 루트 기준 절대경로(/...)로 출력하고, .html 은 아래 cleanUrl 에서 제거한다.
  const root = '/';
  const title = meta.title ? `${meta.title} | ${site.name}` : `${site.name} — ${site.tagline}`;
  const desc = meta.description || site.description;

  let main = body;
  if (meta.layout === 'guide') {
    main = `<div class="container guide-layout">${guideSidebar(href)}<article class="guide-article">${body}${guidePager(
      href
    )}</article></div>`;
  }

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${site.url}${cleanPath('/' + href)}">
<meta name="theme-color" content="#f0002d">
<link rel="icon" href="{{root}}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="{{root}}assets/css/style.css">
<script src="{{root}}assets/js/config.js" defer></script>
<script src="{{root}}assets/js/main.js" defer></script>
</head>
<body class="${meta.bodyClass || ''}">
${header(meta.nav)}
<main id="main">
${main}
</main>
${footer()}
</body>
</html>
`;
  return html
    .replaceAll('{{root}}', root)
    .replaceAll('{{email}}', site.email)
    .replace(/href="(\/[^"#?]*?)\.html([?#][^"]*)?"/g, (_, p, rest = '') => `href="${cleanPath(p + '.html')}${rest}"`);
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });

  const files = await walk(PAGES);
  for (const file of files) {
    const rel = path.relative(PAGES, file);
    const { meta, body } = parse(await readFile(file, 'utf8'));
    const dest = path.join(OUT, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, layout({ meta, body, rel }));
  }
  // 커스텀 도메인(GitHub Pages)
  if (site.cname) await writeFile(path.join(OUT, 'CNAME'), site.cname + '\n');
  await writeFile(path.join(OUT, '.nojekyll'), '');
  console.log(`✔ ${files.length}개 페이지를 dist/ 에 빌드했습니다.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
