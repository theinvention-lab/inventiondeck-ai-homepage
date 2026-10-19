/*
 * 사이트 런타임 설정
 *
 * formEndpoint : 문의 양식을 JSON(POST)으로 받을 Google Apps Script 웹 앱 주소.
 *                비워두면 메일 앱(mailto)으로 내용을 작성해 contactEmail 로 보내도록 안내합니다.
 * supabase     : Cases·Insights·About 팀 목록을 읽어오는 Supabase 주소와 공개용(anon) 키.
 *                anon 키는 브라우저에 노출되는 공개 키입니다. service_role 키는 절대 넣지 마세요.
 */
window.SITE_CONFIG = {
  formEndpoint: 'https://script.google.com/macros/s/AKfycbymcljMDxjziQ7xDziiOFZnSoJPlY_Fy0kTK54tMVPlkI8Uw7jflWZd9ccXblHlSNQQLQ/exec',
  contactEmail: 'contact@roailab.com',
  supabase: {
    url: 'https://kvhpiybihrszxvgpiuxb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aHBpeWJpaHJzenh2Z3BpdXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDgzNDMsImV4cCI6MjA4MDkyNDM0M30.p9TyT_bGOPgbSodvrq955RBYCp1IZhu-h6AAMZLiss8',
  },
};
