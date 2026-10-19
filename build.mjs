// 의존성 없는 정적 사이트 빌더.
// src/pages/**/*.html 의 front matter + 본문을 공통 레이아웃(헤더·푸터)으로 감싸 dist/ 에 출력한다.
//
// 페이지 안에서 쓸 수 있는 표기
//   {{root}}            사이트 루트(/)
//   [[국문||English]]   KR/EN 토글에 따라 한쪽만 보이는 짧은 글
//   {{link:키}}         src/site.mjs 의 links 값 (비어 있으면 비활성 링크)
//   {{art:이름}}        src/art.mjs 의 선 일러스트(SVG)
import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, nav, links } from './src/site.mjs';
import { art } from './src/art.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// 공유 미리보기(og:url, og:image)는 절대주소가 필요하다.
// Vercel 빌드에서는 프로젝트 기본 주소를, 그 외(GitHub Pages 등)에서는 site.url 을 쓴다. SITE_URL 환경변수로 덮어쓸 수 있다.
const SITE_URL = (process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '')
  || site.url).replace(/\/$/, '');
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
const bi = (l) => `<span class="ko">${l.ko}</span><span class="en">${l.en}</span>`;

// /about.html → /about, /cases/index.html → /cases, /index.html → /
function cleanPath(p) {
  const out = p.replace(/\.html$/, '').replace(/\/index$/, '');
  return out || '/';
}

// 언어 설정을 첫 화면 그리기 전에 적용해 KR/EN 깜빡임을 막는다.
const LANG_HEAD = `<script>
(function () {
  var l = 'ko';
  try { l = localStorage.getItem('app_lang') === 'en' ? 'en' : 'ko'; } catch (e) {}
  document.documentElement.setAttribute('data-lang', l);
  document.documentElement.lang = l;
})();
</script>`;

const WORDMARK = `<span class="wm-the">The</span> Invention Lab`;

function header(current) {
  const items = nav
    .map((n) => {
      const on = n.key === current ? ' aria-current="page"' : '';
      if (!n.children) return `<li><a href="{{root}}${n.href}"${on}>${bi(n.label)}</a></li>`;
      const sub = n.children.map((c) => `<li><a href="{{root}}${c.href}">${bi(c.label)}</a></li>`).join('');
      return `<li class="has-sub"><a href="{{root}}${n.href}"${on}>${bi(n.label)}</a><ul class="sub">${sub}</ul></li>`;
    })
    .join('');
  return `
<a class="skip-link" href="#main">[[본문 바로가기||Skip to content]]</a>
<header class="site-header" data-header>
  <div class="wrap header-inner">
    <a class="wordmark" href="{{root}}index.html" aria-label="${site.name}">${WORDMARK}</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle><span class="sr-only">Menu</span><i></i><i></i></button>
    <nav id="site-nav" class="site-nav" aria-label="Main" data-nav>
      <ul class="menu">${items}</ul>
      <div class="nav-tools">
        <div class="lang" role="group" aria-label="Language">
          <button type="button" data-set-lang="ko">KR</button><span aria-hidden="true">/</span><button type="button" data-set-lang="en">EN</button>
        </div>
        <a class="btn btn-line btn-sm" href="{{root}}contact.html"${current === 'contact' ? ' aria-current="page"' : ''}>[[문의하기||Contact]]</a>
        <a class="btn btn-solid btn-sm" href="{{root}}contact.html?type=investment">[[투자 제안 요청||Pitch to Us]]</a>
      </div>
    </nav>
  </div>
</header>`;
}

function footer() {
  const ext = (key, label) => `<li><a href="{{link:${key}}}">${label}</a></li>`;
  return `
<footer class="site-footer">
  <section class="wrap footer-cta">
    <h2>Start Your Venture Project<br>with Us!</h2>
    <p>[[더인벤션랩과 함께 비즈니스의 새로운 가능성을 설계하세요.||Design new possibilities for your business with The Invention Lab.]]</p>
    <a class="btn btn-line" href="{{root}}contact.html">[[문의하기||Contact Us]] <span aria-hidden="true">→</span></a>
  </section>
  <div class="wrap footer-grid">
    <a class="wordmark" href="{{root}}index.html">${WORDMARK}</a>
    <div class="footer-col">
      <h3>Insights</h3>
      <ul>
        <li><a href="{{root}}insights/index.html">News</a></li>
        ${ext('youtube', 'Youtube')}
        ${ext('blog', 'Blog')}
      </ul>
    </div>
    <div class="footer-col">
      <h3>Family Companies</h3>
      <ul>
        ${ext('sheVentures', 'SheVentures')}
        ${ext('acdc', 'AC:DC')}
      </ul>
    </div>
    <div class="footer-col">
      <h3>Contact</h3>
      <ul>
        <li><a href="mailto:${site.email}">${site.email}</a></li>
        <li><a href="tel:${site.phone.replace(/[^+\d]/g, '')}">${site.phone}</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© 2025 The Invention Lab. All rights reserved.</p>
    <ul class="social">${ext('facebook', 'Facebook')}${ext('youtube', 'Youtube')}</ul>
  </div>
</footer>`;
}

function layout({ meta, body, rel }) {
  const href = rel.split(path.sep).join('/');
  const title = meta.title ? `${meta.title} | ${site.name}` : `${site.name} — ${site.tagline}`;
  const desc = meta.description || site.description;
  const pageUrl = `${SITE_URL}${cleanPath('/' + href)}`;
  const scripts = (meta.scripts || '').split(',').map((s) => s.trim()).filter(Boolean);

  const html = `<!doctype html>
<html lang="ko" data-lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:locale" content="ko_KR">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="${SITE_URL}/assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_URL}/assets/img/og-image.png">
<link rel="canonical" href="${pageUrl}">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="{{root}}assets/img/favicon.png" type="image/png" sizes="36x36">
<link rel="shortcut icon" href="{{root}}favicon.ico">
<link rel="apple-touch-icon" href="{{root}}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="{{root}}assets/css/style.css">
${LANG_HEAD}
<script src="{{root}}assets/js/config.js" defer></script>
<script src="{{root}}assets/js/main.js" defer></script>
${scripts.includes('data') ? '<script src="{{root}}assets/js/data.js" defer></script>' : ''}
</head>
<body class="${meta.bodyClass || ''}">
${header(meta.nav)}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>
`;
  return html
    .replace(/\{\{art:(\w+)\}\}/g, (_, k) => {
      if (!art[k]) throw new Error(`알 수 없는 일러스트: ${k} (${href})`);
      return art[k]();
    })
    .replace(/\[\[([\s\S]*?)\|\|([\s\S]*?)\]\]/g, '<span class="ko">$1</span><span class="en">$2</span>')
    .replace(/href="\{\{link:(\w+)\}\}"/g, (_, k) => {
      const v = links[k];
      if (!v) return 'href="#" aria-disabled="true" data-pending';
      if (/^https?:/.test(v)) return `href="${v}" target="_blank" rel="noopener"`;
      return `href="{{root}}${v}"`;
    })
    .replaceAll('{{root}}', '/')
    .replaceAll('{{email}}', site.email)
    .replaceAll('{{phone}}', site.phone)
    .replace(/href="(\/[^"#?]*?)\.html([?#][^"]*)?"/g, (_, p, rest = '') => `href="${cleanPath(p + '.html')}${rest}"`);
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });
  await cp(path.join(SRC, 'assets', 'favicon.ico'), path.join(OUT, 'favicon.ico'));

  const files = await walk(PAGES);
  for (const file of files) {
    const rel = path.relative(PAGES, file);
    const { meta, body } = parse(await readFile(file, 'utf8'));
    const dest = path.join(OUT, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, layout({ meta, body, rel }));
  }
  if (site.cname) await writeFile(path.join(OUT, 'CNAME'), site.cname + '\n');
  await writeFile(path.join(OUT, '.nojekyll'), '');
  console.log(`✔ ${files.length}개 페이지를 dist/ 에 빌드했습니다.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
