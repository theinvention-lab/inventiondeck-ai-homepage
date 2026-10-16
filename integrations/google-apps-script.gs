/**
 * InventionDeck AI 홈페이지 양식 → Google 스프레드시트 저장
 *
 * 설치 방법은 README의 "양식 데이터 연결" 항목을 참고하세요.
 * 양식마다 시트 탭이 자동으로 만들어지고, 질문이 열(column)로, 제출 1건이 행(row)으로 쌓입니다.
 */

// 새 제출이 들어올 때 알림 메일을 받을 주소 (여러 명이면 쉼표로 구분, 비우면 알림 없음)
const NOTIFY_EMAIL = '';

// 홈페이지 양식 키 → 시트 탭 이름
const SHEET_NAMES = {
  contact: '문의하기',
  program: '프로그램 문의',
  feedback: '피드백',
  'new-card': '신규 카드 요청',
  'card-error': '카드 오류 제보',
  'app-error': '인벤션덱AI 오류 제보',
  opinion: '의견 남기기',
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data || !Array.isArray(data.fields)) throw new Error('잘못된 요청입니다.');
    if (!Object.prototype.hasOwnProperty.call(SHEET_NAMES, data.form)) throw new Error('알 수 없는 양식입니다.');

    const name = SHEET_NAMES[data.form];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);

    // 머리글: 기존 열을 유지하고, 새 질문이 생기면 오른쪽에 추가
    const lastCol = sheet.getLastColumn();
    const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : ['접수 시각', '페이지'];
    data.fields.forEach(function (f) {
      const label = clean(f.label, 200);
      if (label && headers.indexOf(label) === -1) headers.push(label);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    const values = {};
    data.fields.forEach(function (f) { values[clean(f.label, 200)] = clean(f.value, 5000); });
    const row = headers.map(function (h) {
      if (h === '접수 시각') return new Date();
      if (h === '페이지') return clean(data.page, 500);
      return values[h] || '';
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '[InventionDeck AI] 새 ' + name + ' 접수',
        body: data.fields.map(function (f) { return '■ ' + clean(f.label, 200) + '\n' + (clean(f.value, 5000) || '-'); }).join('\n\n')
          + '\n\n스프레드시트: ' + ss.getUrl(),
      });
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// 문자열로 바꾸고 길이를 제한한다. =, +, -, @ 로 시작하면 수식으로 실행되지 않게 앞에 ' 를 붙인다.
function clean(v, max) {
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
