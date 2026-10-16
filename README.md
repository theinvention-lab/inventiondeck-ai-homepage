# InventionDeck AI 홈페이지

slashpage(inventiondeck-ai) 콘텐츠를 옮겨 만든 정적 웹사이트입니다. 외부 의존성이 없으며 Node.js 18+ 만 있으면 됩니다.

```bash
npm run dev     # 빌드 후 http://localhost:4173 미리보기
npm run build   # dist/ 생성
npm run check   # 빌드 + 내부 링크 검사
```

## 구조
- `src/pages/` — 페이지 본문(front matter: `title`, `description`, `nav`, `layout: guide`)
- `src/site.mjs` — 회사 정보, 상단 메뉴, 가이드 목차, 푸터 링크
- `src/assets/` — CSS / JS / 아이콘
- `build.mjs` — 공통 헤더·푸터·가이드 사이드바를 입혀 `dist/`로 출력

주소에는 `.html`이 붙지 않습니다(예: `/guide/cards`). 빌드할 때 링크에서 `.html`을 빼고, Vercel의 `cleanUrls` 설정이 `/guide/cards` 요청에 `guide/cards.html` 파일을 보여줍니다.

| 원본 페이지 | 경로 (소스 파일) |
|---|---|
| Home | `index.html` |
| InventionDeck Guide + 하위 14개 | `guide/` |
| Business Template + 템플릿 6종 | `template/` |
| 프로그램 소개 + 문의하기(프로그램) | `program.html` (`#program-inquiry`) |
| 문의하기(베타테스터) | `contact.html` |
| 피드백 제출하기 / 신규 카드 요청 / 카드 오류 제보 / 인벤션덱AI 오류 제보 | `feedback/index.html` (탭으로 양식 전환, `/feedback#tab-card-error` 등) |
| 의견 남기기 | `feedback/opinion.html` |
| 공지사항 | `notice.html` |
| 양식 제출 완료 / 마감 안내 | `thanks.html?form=…`, `form-closed.html?state=closed` |
| 서비스이용약관 / 개인정보처리방침 | `terms.html`, `privacy.html` |

## 양식 데이터 연결 (Google 스프레드시트)
홈페이지의 모든 양식(문의하기, 프로그램 문의, 피드백, 신규 카드 요청, 카드 오류 제보, 인벤션덱AI 오류 제보, 의견 남기기)은 하나의 스프레드시트에 양식별 탭으로 저장됩니다.

1. Google 드라이브에서 새 스프레드시트를 만듭니다 (예: `InventionDeck 홈페이지 접수`).
2. 메뉴 **확장 프로그램 → Apps Script**를 열고, 기본 코드를 지운 뒤 `integrations/google-apps-script.gs` 내용을 붙여넣고 저장합니다.
   알림 메일을 받으려면 맨 위 `NOTIFY_EMAIL`에 주소를 넣습니다.
3. **배포 → 새 배포 → 유형 선택(톱니바퀴) → 웹 앱**
   - 다음 사용자 인증 정보로 실행: **나**
   - 액세스 권한이 있는 사용자: **모든 사용자**
4. **배포**를 누르고 권한을 승인합니다. ("Google에서 확인하지 않은 앱" 경고가 나오면 **고급 → (프로젝트 이름)(으)로 이동**)
5. 표시된 **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`)을 `src/assets/js/config.js`의 `formEndpoint`에 넣고 푸시합니다.
6. 사이트에서 양식을 하나씩 제출해 시트에 탭과 행이 생기는지 확인합니다.

- 스크립트를 수정한 뒤에는 **배포 → 배포 관리 → 연필(편집) → 버전: 새 버전 → 배포**를 해야 반영됩니다. URL은 그대로입니다.
- 질문 문구를 바꾸면 시트 오른쪽에 새 열이 추가되고, 기존 열은 그대로 남습니다.
- 알림 메일은 Gmail 계정 기준 하루 약 100건까지 보낼 수 있습니다(Google Workspace는 더 많음).
- 숨김 칸으로 간단한 스팸 봇을 거르고, `=`·`+`·`-`·`@`로 시작하는 값은 수식으로 실행되지 않게 처리합니다.

## 양식 설정 (`src/assets/js/config.js`)
- `formEndpoint`: 위 Apps Script 웹 앱 URL. 양식 내용을 JSON 문자열(`text/plain`)로 POST하고 `{"ok": true}` 응답을 받으면 완료 화면으로 이동합니다. 비워두면 메일 앱(mailto)으로 `contactEmail`에 보냅니다.
- `closedForms`: 마감할 양식 키 목록 → 해당 페이지 접속 시 마감 안내 화면으로 이동.

## 배포 (GitHub Pages)
기본 브랜치(`claude/pensive-hamilton-qugp86`) 또는 `main`에 푸시하면 `.github/workflows/deploy.yml`이 빌드·검사 후 GitHub Pages로 배포합니다(저장소 Settings → Pages → Source: **GitHub Actions**).
GitHub Pages도 `/guide/cards` 같은 주소를 `guide/cards.html`로 연결해 주므로 `.html` 없는 주소가 그대로 동작합니다.
커스텀 도메인을 쓰려면 `src/site.mjs`의 `cname`을 `inventiondeck.kr`로 설정하세요. 링크가 `/`로 시작하는 절대경로라서, `사용자.github.io/저장소명/` 같은 하위 경로가 아니라 도메인 최상위에 배포해야 합니다.

## 참고
- 이미지는 원본 slashpage CDN(upload.cafenono.com) 주소를 그대로 사용합니다. 불러오지 못하면 대체 박스가 표시됩니다. 장기 운영 시 `src/assets/img/`로 옮기는 것을 권장합니다.
- 원본 수집본에 선택지 문구가 없던 양식 항목(choice)은 맥락에 맞게 작성했습니다. 실제 문구에 맞게 수정하세요.

### Vercel
`vercel.json`에 빌드 설정이 들어 있어 저장소를 연결하면 그대로 배포됩니다(빌드 `npm run build`, 출력 폴더 `dist`).
