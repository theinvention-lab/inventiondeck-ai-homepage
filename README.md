# The Invention Lab 홈페이지

더인벤션랩(The Invention Lab) 회사 홈페이지입니다. 외부 의존성이 없는 정적 사이트이며 Node.js 18+ 만 있으면 됩니다.

```bash
npm run dev     # 빌드 후 http://localhost:4173 미리보기
npm run build   # dist/ 생성
npm run check   # 빌드 + 내부 링크 검사
```

## 구조
- `src/pages/` — 페이지 본문 (front matter: `title`, `description`, `nav`, `scripts: data`, `bodyClass`)
- `src/site.mjs` — 회사 정보, 상단 메뉴, 외부 링크(`links`)
- `src/art.mjs` — 얇은 선 일러스트(SVG). 페이지에서 `{{art:globe}}` 처럼 넣습니다.
- `src/assets/css/style.css` — 흰 배경 · 검은 글자 · 1px 선 중심의 스타일
- `src/assets/js/main.js` — KR/EN 전환, 메뉴, 홈 인트로 스크롤 애니메이션, 문의 양식
- `src/assets/js/data.js` — Supabase 데이터(사례·포트폴리오·팀·뉴스) 표시
- `src/assets/js/config.js` — 양식 접수 주소, Supabase 주소/공개 키
- `build.mjs` — 공통 헤더·푸터를 입혀 `dist/`로 출력

| 주소 | 페이지 | 데이터 |
|---|---|---|
| `/` | 홈 (인트로 → Journey → What We Do → How We Do → Featured Cases) | project |
| `/about` | About · 팀 | team |
| `/capabilities/venture-studio` | Venture Studio | – |
| `/capabilities/new-biz-design` | New Business Design | project (사례 카드 연결) |
| `/capabilities/venture-building` | Venture Scale-up & MGT | – |
| `/capabilities/strategic-partnership` | Strategic Partnership | project (사례 카드 연결) |
| `/capabilities/global-expansion` | Global Expansion & SEA | – |
| `/cases` | 벤처스튜디오 사례 · Portfolio · Our Projects | project, portfolio_companies |
| `/cases/project?id=…` · `/cases/portfolio?id=…` | 상세 | project, portfolio_companies |
| `/insights` (`?section=Blog` 등) · `/insights/press?id=…` | 뉴스 목록 · 상세 | til_press |
| `/contact` (`?type=investment` → '투자 제안 요청' 선택) | 문의하기 | – |

## 국문 / 영문
상단 KR / EN 버튼으로 바꾸며, 선택은 `localStorage`의 `app_lang`에 저장됩니다.
페이지 본문에서는 `[[국문||English]]` 로 짧은 글을, 긴 글은 `<span class="ko">…</span><span class="en">…</span>` 으로 씁니다.
DB 데이터는 `_en` 컬럼을 쓰고, 비어 있으면 국문 값을 보여줍니다.

## 데이터 (Supabase)
`data.js`가 브라우저에서 Supabase REST API를 공개용(anon) 키로 읽습니다. 불러오지 못하면 페이지에 미리 넣어 둔 내용이 그대로 보입니다.
- 행을 추가·수정하면 새로 빌드하지 않아도 바로 반영됩니다.
- anon 키는 공개 키입니다. Supabase 대시보드 › Authentication › Policies에서 anon에 **읽기만** 열려 있는지 확인하세요. `service_role` 키는 절대 코드에 넣지 마세요.
- Capabilities 사례 카드는 `project_name`이 정확히 일치해야 상세 페이지로 연결됩니다(일치하지 않으면 Cases 목록으로 이동).

## 외부 링크
`src/site.mjs`의 `links`에 Youtube, Facebook, SheVentures, AC:DC, Startup-VN, FINEDEAL, Partnership Sketch 주소를 넣으면 됩니다. 비어 있는 링크는 흐리게 표시되고 눌리지 않습니다.

## 문의 양식 (Google 스프레드시트)
문의 양식은 `config.js`의 `formEndpoint`(Google Apps Script 웹 앱)로 전송되어 스프레드시트의 '문의하기' 탭에 쌓입니다. 스크립트는 `integrations/google-apps-script.gs`에 있습니다.
스크립트를 수정한 뒤에는 **배포 → 배포 관리 → 편집 → 새 버전 → 배포**를 해야 반영됩니다.

## 링크 공유 미리보기
모든 페이지에 Open Graph / Twitter 카드 태그가 들어갑니다. 이미지는 `src/assets/img/og-image.png`(1200×630)입니다.
절대주소는 `SITE_URL` 환경변수 → Vercel 프로젝트 주소 → `src/site.mjs`의 `url` 순으로 정합니다.

## 배포
- GitHub Pages: `main` 또는 `claude/pensive-hamilton-qugp86`에 푸시하면 `.github/workflows/deploy.yml`이 빌드·검사 후 배포합니다. 커스텀 도메인은 `src/site.mjs`의 `cname`에 넣습니다.
- Vercel: `vercel.json`에 설정(빌드 `npm run build`, 출력 `dist`, `cleanUrls`)이 있습니다.
- 주소에는 `.html`이 붙지 않습니다(예: `/about`). 링크가 `/`로 시작하므로 도메인 최상위에 배포해야 합니다.
