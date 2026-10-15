(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};

  // ---------- 헤더 / 모바일 메뉴 ----------
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var navEl = document.querySelector('[data-nav]');
  if (toggle && navEl) {
    toggle.addEventListener('click', function () {
      var open = navEl.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- 원격 이미지 로딩 실패 시 대체 표시 ----------
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    function fail() {
      var box = document.createElement('div');
      box.className = 'img-missing';
      box.textContent = img.getAttribute('alt') || '이미지를 불러올 수 없습니다';
      img.replaceWith(box);
    }
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });

  // ---------- 스크롤 등장 효과 ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- 탭 ----------
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        select(t);
        history.replaceState(null, '', '#' + t.id);
      });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    function fromHash() {
      return location.hash && root.querySelector(location.hash + '[role="tab"]');
    }
    select(fromHash() || tabs[0]);
    // 같은 페이지 안에서 #tab-... 링크를 눌렀을 때도 해당 탭으로 전환
    window.addEventListener('hashchange', function () {
      var t = fromHash();
      if (t) { select(t); t.scrollIntoView({ block: 'center' }); }
    });
  });

  // ---------- 양식 ----------
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var cssLink = document.querySelector('link[href$="assets/css/style.css"]');
  var root = cssLink ? cssLink.getAttribute('href').replace(/assets\/css\/style\.css$/, '') : '';

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var key = form.getAttribute('data-form');
    if ((cfg.closedForms || []).indexOf(key) !== -1) {
      location.replace(root + 'form-closed?state=closed');
      return;
    }
    var status = form.querySelector('[data-form-status]');

    function fieldsOf() { return Array.prototype.slice.call(form.querySelectorAll('.field')); }

    function validate(field) {
      var ok = true;
      var group = field.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      if (field.hasAttribute('data-required') && group.length) {
        ok = Array.prototype.some.call(group, function (i) { return i.checked; });
      }
      field.querySelectorAll('.input, .textarea, .select').forEach(function (el) {
        var v = el.value.trim();
        if (el.required && !v) ok = false;
        if (v && el.type === 'email' && !EMAIL_RE.test(v)) ok = false;
        if (v && el.type === 'tel' && !/^[0-9+\-\s()]{8,}$/.test(v)) ok = false;
      });
      field.classList.toggle('invalid', !ok);
      return ok;
    }

    fieldsOf().forEach(function (f) {
      f.addEventListener('change', function () { if (f.classList.contains('invalid')) validate(f); });
      f.addEventListener('input', function () { if (f.classList.contains('invalid')) validate(f); });
    });

    function collect() {
      var data = [];
      fieldsOf().forEach(function (f) {
        var label = f.getAttribute('data-label');
        if (!label) return;
        var values = [];
        f.querySelectorAll('input, textarea, select').forEach(function (el) {
          if ((el.type === 'radio' || el.type === 'checkbox')) { if (el.checked) values.push(el.value); }
          else if (el.value.trim()) values.push(el.value.trim());
        });
        data.push({ label: label, value: values.join(', ') });
      });
      return data;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = fieldsOf().filter(function (f) { return !validate(f); });
      if (invalid.length) {
        var first = invalid[0].querySelector('input, textarea, select');
        if (first) first.focus();
        if (status) status.textContent = '필수 항목을 확인해주세요.';
        return;
      }
      var data = collect();
      var thanks = root + 'thanks?form=' + encodeURIComponent(key);
      var title = form.getAttribute('data-title') || '문의하기';
      var submit = form.querySelector('[type="submit"]');

      if (cfg.formEndpoint) {
        if (submit) { submit.disabled = true; submit.textContent = '제출 중…'; }
        fetch(cfg.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            form: key, title: title, submittedAt: new Date().toISOString(), page: location.href,
            fields: data,
          }),
        }).then(function (res) {
          if (!res.ok) throw new Error(res.status);
          location.href = thanks;
        }).catch(function () {
          if (submit) { submit.disabled = false; submit.textContent = '제출하기'; }
          if (status) status.innerHTML = '제출 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 <a href="mailto:' + cfg.contactEmail + '">' + cfg.contactEmail + '</a> 로 연락주세요.';
        });
        return;
      }

      // 엔드포인트 미설정: 메일 앱으로 전송
      var body = data.map(function (d) { return '■ ' + d.label + '\n' + (d.value || '-'); }).join('\n\n');
      var href = 'mailto:' + cfg.contactEmail + '?subject=' + encodeURIComponent('[InventionDeck AI] ' + title) + '&body=' + encodeURIComponent(body);
      window.location.href = href;
      if (status) {
        status.innerHTML = '메일 앱에서 작성된 내용을 확인 후 전송해주세요. 메일 앱이 열리지 않으면 <a href="mailto:' + cfg.contactEmail + '">' + cfg.contactEmail + '</a> 로 보내주세요. <a href="' + thanks + '">전송을 마쳤어요 →</a>';
      }
    });
  });

  // ---------- 상태 페이지 문구 (?form=..., ?state=...) ----------
  var params = new URLSearchParams(location.search);
  document.querySelectorAll('[data-variants]').forEach(function (group) {
    var val = params.get(group.getAttribute('data-variants')) || '';
    var items = Array.prototype.slice.call(group.querySelectorAll('[data-when]'));
    var match = items.filter(function (el) { return el.getAttribute('data-when').split(',').indexOf(val) !== -1; })[0]
      || group.querySelector('[data-when="*"]');
    items.forEach(function (el) { el.hidden = el !== match; });
  });
})();
