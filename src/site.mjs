// 사이트 전역 설정 및 내비게이션 정의
export const site = {
  name: 'InventionDeck AI',
  tagline: '카드와 AI로 시작하는 비즈니스 아이디에이션',
  description:
    '인사이트가 담긴 아이디에이션 카드를 조합해 빠르게 발상하고, AI로 비즈니스 아이디어를 생성·고도화하세요. 사업계획서와 IR Deck 초안까지 한 번에.',
  url: 'https://inventiondeck.kr',
  // 커스텀 도메인으로 GitHub Pages 배포 시 'inventiondeck.kr' 로 설정하면 dist/CNAME 이 생성됩니다.
  cname: '',
  company: '(주)더인벤션랩',
  companyEn: 'The Invention Lab Inc.',
  ceo: '김진영',
  email: 'contact@roailab.com',
};

export const nav = [
  { key: 'home', label: '서비스 소개', href: 'index.html' },
  { key: 'guide', label: '사용 가이드', href: 'guide/index.html' },
  { key: 'template', label: '비즈니스 템플릿', href: 'template/index.html' },
  { key: 'program', label: '프로그램 소개', href: 'program.html' },
  { key: 'feedback', label: '피드백', href: 'feedback/index.html' },
];

export const guideGroups = [
  {
    title: 'Idea Generator',
    items: [
      { label: '카드 살펴보기', href: 'guide/cards.html' },
      { label: '카드 선택하기', href: 'guide/select-cards.html' },
      { label: 'AI 아이디어 생성하기', href: 'guide/generate-idea.html' },
      { label: '아이디어 보관하기', href: 'guide/archive-idea.html' },
    ],
  },
  {
    title: 'Idea Builder',
    items: [
      { label: '비즈니스 아이디어 템플릿 선택하기', href: 'guide/choose-template.html' },
      { label: '비즈니스 아이디어 구체화하기', href: 'guide/develop-idea.html' },
      { label: '다른 템플릿 사용하기', href: 'guide/other-templates.html' },
    ],
  },
  {
    title: 'Business Planner & Pitch Deck Builder',
    items: [
      { label: '사업계획서 작성하기', href: 'guide/business-plan.html' },
      { label: 'IR Deck 초안 작성하고 다운로드하기', href: 'guide/ir-deck.html' },
    ],
  },
  {
    title: 'My Idea Deck',
    items: [
      { label: 'Card Deck', href: 'guide/card-deck.html' },
      { label: 'My Idea Deck', href: 'guide/my-idea-deck.html' },
    ],
  },
  {
    title: 'Others',
    items: [
      { label: 'Edit Profile', href: 'guide/edit-profile.html' },
      { label: 'Guide & Feedback', href: 'guide/guide-feedback.html' },
      { label: 'AI에게 질문하기', href: 'guide/ask-ai.html' },
    ],
  },
];

export const footerLinks = [
  {
    title: '서비스',
    items: [
      { label: '서비스 소개', href: 'index.html' },
      { label: '사용 가이드', href: 'guide/index.html' },
      { label: '비즈니스 템플릿', href: 'template/index.html' },
      { label: '공지사항', href: 'notice.html' },
    ],
  },
  {
    title: '프로그램',
    items: [
      { label: '신사업 아이디어 발굴', href: 'program.html#tab-discovery' },
      { label: '린스타트업 코스', href: 'program.html#tab-lean' },
      { label: '사내벤처 코스', href: 'program.html#tab-venture' },
      { label: '프로그램 문의', href: 'program.html#program-inquiry' },
    ],
  },
  {
    title: '고객지원',
    items: [
      { label: '베타테스터 신청 · 문의', href: 'contact.html' },
      { label: '피드백 제출하기', href: 'feedback/index.html' },
      { label: '신규 카드 요청', href: 'feedback/index.html#tab-new-card' },
      { label: '카드 오류 제보', href: 'feedback/index.html#tab-card-error' },
      { label: '인벤션덱AI 오류 제보', href: 'feedback/index.html#tab-app-error' },
      { label: '의견 남기기', href: 'feedback/opinion.html' },
    ],
  },
];
