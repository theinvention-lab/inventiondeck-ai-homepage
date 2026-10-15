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

| 원본 페이지 | 경로 |
|---|---|
| Home | `index.html` |
| InventionDeck Guide + 하위 14개 | `guide/` |
| Business Template + 템플릿 6종 | `template/` |
| 프로그램 소개 + 문의하기(프로그램) | `program.html` (`#program-inquiry`) |
| 문의하기(베타테스터) | `contact.html` |
| 피드백 제출하기 / 신규 카드 요청 / 카드 오류 제보 / 인벤션덱AI 오류 제보 / 의견 남기기 | `feedback/` |
| 공지사항 | `notice.html` |
| 양식 제출 완료 / 마감 안내 | `thanks.html?form=…`, `form-closed.html?state=closed` |
| 서비스이용약관 / 개인정보처리방침 | `terms.html`, `privacy.html` |

## 양식 설정 (`src/assets/js/config.js`)
- `formEndpoint`: JSON POST를 받을 주소(Formspree, Google Apps Script 등). 비워두면 메일 앱(mailto)으로 `contactEmail`에 보냅니다.
- `closedForms`: 마감할 양식 키 목록 → 해당 페이지 접속 시 마감 안내 화면으로 이동.

## 배포
`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다(저장소 Settings → Pages → Source: GitHub Actions).
커스텀 도메인을 쓰려면 `src/site.mjs`의 `cname`을 `inventiondeck.kr`로 설정하세요.

## 참고
- 이미지는 원본 slashpage CDN(upload.cafenono.com) 주소를 그대로 사용합니다. 불러오지 못하면 대체 박스가 표시됩니다. 장기 운영 시 `src/assets/img/`로 옮기는 것을 권장합니다.
- 원본 수집본에 선택지 문구가 없던 양식 항목(choice)은 맥락에 맞게 작성했습니다. 실제 문구에 맞게 수정하세요.
