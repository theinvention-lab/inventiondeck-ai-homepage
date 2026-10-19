// 사이트 전역 설정 · 메뉴 · 푸터
// 라벨은 { ko, en } 로 적고, 화면에서는 KR/EN 토글(localStorage `app_lang`)에 따라 한쪽만 보인다.
export const site = {
  name: 'The Invention Lab',
  nameKo: '더인벤션랩',
  tagline: 'Venture Studio for Startup & Corporates',
  description:
    '더인벤션랩은 새로운 사업을 설계하고 성장 단계까지 이끄는 벤처 스튜디오입니다. 신사업 디자인, 벤처 스케일업, 전략적 파트너십, 글로벌 확장까지 함께합니다.',
  // 공유 미리보기(og:url 등)에 쓰는 대표 주소. 도메인을 바꾸면 여기만 고치면 된다.
  url: 'https://inventiondeck.kr',
  cname: '',
  company: '(주)더인벤션랩',
  ceo: '김진영',
  email: 'contact@roailab.com',
  phone: '+82-2-508-0740',
};

// 외부 링크 — 비어 있는 값은 화면에서 링크 없이 글자만 보인다. 실제 주소가 정해지면 채워 넣으세요.
export const links = {
  inventiondeck: 'https://app.inventiondeck.kr/',
  startupVn: '',
  finedeal: '',
  youtube: '',
  facebook: '',
  blog: 'insights/index.html?section=Blog',
  sheVentures: '',
  acdc: '',
  partnershipSketch: '',
};

export const nav = [
  { key: 'about', label: { ko: 'About', en: 'About' }, href: 'about.html' },
  {
    key: 'capabilities',
    label: { ko: 'Capabilities', en: 'Capabilities' },
    href: 'capabilities/venture-studio.html',
    children: [
      { label: { ko: 'Venture Studio', en: 'Venture Studio' }, href: 'capabilities/venture-studio.html' },
      { label: { ko: 'New Business Design', en: 'New Business Design' }, href: 'capabilities/new-biz-design.html' },
      { label: { ko: 'Venture Scale-up & MGT', en: 'Venture Scale-up & MGT' }, href: 'capabilities/venture-building.html' },
      { label: { ko: 'Strategic Partnership', en: 'Strategic Partnership' }, href: 'capabilities/strategic-partnership.html' },
      { label: { ko: 'Global Expansion', en: 'Global Expansion' }, href: 'capabilities/global-expansion.html' },
    ],
  },
  { key: 'cases', label: { ko: 'Cases', en: 'Cases' }, href: 'cases/index.html' },
  { key: 'insights', label: { ko: 'Insights', en: 'Insights' }, href: 'insights/index.html' },
];
