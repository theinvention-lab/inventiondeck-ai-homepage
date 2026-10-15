/*
 * 사이트 런타임 설정
 *
 * formEndpoint : 양식 데이터를 JSON(POST)으로 받을 엔드포인트 (예: Formspree, Google Apps Script, 자체 API).
 *                비워두면 메일 앱(mailto)으로 내용을 작성해 contactEmail 로 보내도록 안내합니다.
 * closedForms  : 접수를 마감한 양식 키 목록. 해당 양식 페이지에 접속하면 '양식 마감 안내' 화면으로 이동합니다.
 *                사용 가능한 키: contact, program, feedback, new-card, card-error, app-error, opinion
 */
window.SITE_CONFIG = {
  formEndpoint: '',
  contactEmail: 'contact@roailab.com',
  closedForms: [],
};
