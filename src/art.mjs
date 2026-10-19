// 얇은 선 일러스트(SVG). 페이지에서 {{art:이름}} 으로 넣는다.
// 모든 선에 pathLength="1" 을 붙여 .draw 클래스로 그려지는 애니메이션을 쓴다.
const P = 'pathLength="1"';
const r2 = (n) => Math.round(n * 100) / 100;

// 결정적 의사난수 — 빌드마다 같은 그림이 나오도록
function rand(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const svg = (vb, body, cls = '') => `<svg class="line-art draw ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;

// 홈 인트로: 가운데에서 퍼져나가는 선
function burst() {
  const rnd = rand(7);
  const rays = [];
  const N = 96;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rnd() * 0.02;
    const r0 = 300 + rnd() * 40;
    const r1 = r0 + 80 + rnd() * (i % 3 === 0 ? 360 : 200);
    const d = `${(0.4 + rnd() * 1.4).toFixed(2)}s`;
    rays.push(`<line ${P} style="transition-delay:${d}" x1="${r2(Math.cos(a) * r0)}" y1="${r2(Math.sin(a) * r0)}" x2="${r2(Math.cos(a) * r1)}" y2="${r2(Math.sin(a) * r1)}"/>`);
  }
  const rings = [
    `<circle ${P} class="lf" r="260"/>`,
    `<circle ${P} class="lf" r="690" style="transition-delay:.6s"/>`,
  ];
  const dots = [];
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, r = 420 + rnd() * 260;
    dots.push(`<circle class="dot" r="${(1.5 + rnd() * 1.5).toFixed(1)}" cx="${r2(Math.cos(a) * r)}" cy="${r2(Math.sin(a) * r)}"/>`);
  }
  return svg('-760 -760 1520 1520', rings.join('') + rays.join('') + dots.join(''), 'hero-burst');
}

// 동심원 + 궤도 점
function orbit() {
  const c = [70, 120, 170, 220].map((r, i) => `<circle ${P} cx="250" cy="250" r="${r}" style="transition-delay:${i * 0.15}s"/>`).join('');
  return svg('0 0 500 500', `${c}<ellipse ${P} cx="250" cy="250" rx="240" ry="90" transform="rotate(-24 250 250)"/><circle class="dot" cx="470" cy="155" r="5"/><circle class="dot" cx="250" cy="250" r="3"/>`);
}

// 지구본
function globe() {
  const m = [0, 40, 80, 120].map((rx, i) => `<ellipse ${P} cx="250" cy="250" rx="${rx || 1}" ry="200" style="transition-delay:${i * 0.12}s"/>`).join('');
  const p = [-130, -70, 0, 70, 130].map((y) => {
    const w = Math.sqrt(200 * 200 - y * y);
    return `<line ${P} x1="${r2(250 - w)}" y1="${250 + y}" x2="${r2(250 + w)}" y2="${250 + y}"/>`;
  }).join('');
  return svg('0 0 500 500', `<circle ${P} cx="250" cy="250" r="200"/>${m}${p}<path ${P} d="M60 360 C 160 470, 360 470, 470 300" class="lf"/><circle class="dot" cx="352" cy="148" r="5"/><circle class="dot" cx="186" cy="304" r="5"/>`);
}

// 연결망
function network() {
  const pts = [[250, 250], [90, 110], [410, 90], [440, 330], [120, 400], [260, 70], [300, 440], [60, 260]];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 5], [5, 2], [2, 3], [3, 6], [6, 4], [4, 7], [7, 1]];
  const l = edges.map(([a, b], i) => `<line ${P} ${i > 6 ? 'class="lf"' : ''} x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`).join('');
  const n = pts.map(([x, y], i) => (i ? `<circle ${P} cx="${x}" cy="${y}" r="14"/><circle class="dot" cx="${x}" cy="${y}" r="3"/>` : `<circle ${P} cx="${x}" cy="${y}" r="40"/><circle class="dot" cx="${x}" cy="${y}" r="5"/>`)).join('');
  return svg('0 0 500 500', l + n);
}

// 계단처럼 오르는 성장선
function steps() {
  const s = [];
  let x = 40, y = 440;
  for (let i = 0; i < 6; i++) {
    s.push(`<rect ${P} x="${x}" y="${y - (i + 1) * 60}" width="70" height="${(i + 1) * 60}" style="transition-delay:${i * 0.12}s"/>`);
    x += 72;
  }
  return svg('0 0 500 500', `${s.join('')}<line ${P} x1="20" y1="440" x2="480" y2="440"/><path ${P} d="M40 400 Q 250 380, 470 40"/><circle class="dot" cx="470" cy="40" r="5"/>`);
}

// 겹치는 원 (아이디어 → 사업)
function venn() {
  return svg('0 0 500 500', `<circle ${P} cx="190" cy="200" r="120"/><circle ${P} cx="310" cy="200" r="120" style="transition-delay:.15s"/><circle ${P} cx="250" cy="305" r="120" style="transition-delay:.3s"/><circle class="dot" cx="250" cy="236" r="5"/><line ${P} class="lf" x1="250" y1="20" x2="250" y2="480"/>`);
}

// 모듈이 쌓인 공장(벤처 스튜디오)
function factory() {
  const b = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if ((r + c) % 3 === 2) continue;
    b.push(`<rect ${P} x="${70 + c * 92}" y="${70 + r * 92}" width="80" height="80" style="transition-delay:${(r + c) * 0.08}s"/>`);
  }
  return svg('0 0 500 500', `${b.join('')}<circle ${P} cx="296" cy="296" r="30"/><circle class="dot" cx="296" cy="296" r="4"/>`);
}

// 위로 뻗어가는 선 (사례)
function rise() {
  const rnd = rand(3);
  const l = [];
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 32, h = 60 + rnd() * 300 + i * 6;
    l.push(`<line ${P} x1="${x}" y1="460" x2="${x}" y2="${r2(460 - h)}" style="transition-delay:${i * 0.06}s"/>`);
  }
  return svg('0 0 500 500', `${l.join('')}<line ${P} x1="20" y1="460" x2="480" y2="460"/><circle class="dot" cx="456" cy="60" r="5"/><circle ${P} cx="456" cy="60" r="18"/>`);
}

// 글줄 (인사이트)
function lines() {
  const l = [];
  [380, 300, 420, 260, 400, 320, 200].forEach((w, i) => l.push(`<line ${P} x1="40" y1="${80 + i * 52}" x2="${40 + w}" y2="${80 + i * 52}" style="transition-delay:${i * 0.1}s"/>`));
  return svg('0 0 500 500', `${l.join('')}<circle ${P} cx="400" cy="400" r="60"/><line ${P} x1="442" y1="442" x2="480" y2="480"/>`);
}

// 두 점이 만나는 선 (문의)
function meet() {
  return svg('0 0 500 500', `<path ${P} d="M30 380 C 150 380, 160 120, 250 120"/><path ${P} d="M470 380 C 350 380, 340 120, 250 120" style="transition-delay:.2s"/><circle ${P} cx="250" cy="120" r="34"/><circle class="dot" cx="250" cy="120" r="5"/><circle class="dot" cx="30" cy="380" r="5"/><circle class="dot" cx="470" cy="380" r="5"/><line ${P} class="lf" x1="20" y1="420" x2="480" y2="420"/>`);
}

// 홈: 2017 → PRESENT 여정
function journey() {
  return svg('0 0 400 400', `<line ${P} x1="20" y1="360" x2="380" y2="360"/><path ${P} d="M30 350 C 120 340, 140 260, 200 230 S 300 120, 370 40"/><circle ${P} cx="80" cy="330" r="12"/><circle ${P} cx="200" cy="230" r="12" style="transition-delay:.3s"/><circle ${P} cx="300" cy="120" r="12" style="transition-delay:.6s"/><circle class="dot" cx="370" cy="40" r="5"/>`);
}

// 홈: Studio Core Platform 다이어그램
function core() {
  const nodes = [
    ['CAPITAL', 'Blended Financing', 280, 70],
    ['TALENT', 'Operator Pool', 490, 280],
    ['INFRA', 'Validation System', 280, 490],
    ['NETWORK', 'LP & Cross-border', 70, 280],
  ];
  const n = nodes.map(([a, b, x, y], i) => `<circle ${P} cx="${x}" cy="${y}" r="62" style="transition-delay:${0.2 + i * 0.15}s"/><text x="${x}" y="${y - 4}" text-anchor="middle">${a}</text><text class="t-sub" x="${x}" y="${y + 16}" text-anchor="middle">${b}</text>`).join('');
  const links = nodes.map(([, , x, y]) => {
    const dx = 280 - x, dy = 280 - y, d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d;
    return `<line ${P} x1="${r2(x + ux * 62)}" y1="${r2(y + uy * 62)}" x2="${r2(280 - ux * 96)}" y2="${r2(280 - uy * 96)}"/>`;
  }).join('');
  return svg('0 0 560 560', `<circle ${P} class="lf" cx="280" cy="280" r="210"/>${links}<circle ${P} cx="280" cy="280" r="96"/><circle ${P} class="lf" cx="280" cy="280" r="104"/><text class="t-core" x="280" y="262" text-anchor="middle">STUDIO</text><text class="t-core" x="280" y="286" text-anchor="middle">CORE</text><text class="t-core" x="280" y="310" text-anchor="middle">PLATFORM</text>${n}`, 'core-diagram');
}

// 홈 인트로 배경: 떠다니는 붉은 빛 (큰 번짐 + 작은 불씨). 움직임은 CSS 애니메이션.
function glow() {
  const rnd = rand(11);
  const pct = (n) => `${Math.round(n * 1000) / 10}%`;
  const px = (n) => `${Math.round(n)}px`;
  const items = [];
  const add = (cls, size, dur) => {
    const v = [
      `--x:${pct(0.05 + rnd() * 0.9)}`, `--y:${pct(0.08 + rnd() * 0.84)}`, `--s:${px(size)}`,
      `--d:${(dur + rnd() * dur * 0.6).toFixed(1)}s`, `--delay:-${(rnd() * dur).toFixed(1)}s`,
      ...['a', 'b', 'c'].flatMap((k) => [`--${k}x:${px((rnd() - 0.5) * (cls === 'blob' ? 520 : 760))}`, `--${k}y:${px((rnd() - 0.5) * (cls === 'blob' ? 360 : 520))}`]),
    ];
    items.push(`<i class="${cls}" style="${v.join(';')}"></i>`);
  };
  for (let i = 0; i < 5; i++) add('blob', 220 + rnd() * 260, 16);
  for (let i = 0; i < 12; i++) add('spark', 4 + rnd() * 6, 9);
  return `<div class="hero-glow" aria-hidden="true">${items.join('')}</div>`;
}

export const art = { glow, burst, orbit, globe, network, steps, venn, factory, rise, lines, meet, journey, core };
