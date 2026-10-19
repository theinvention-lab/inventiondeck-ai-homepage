(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var docEl = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 언어 (KR / EN) ----------
  function currentLang() { return docEl.getAttribute('data-lang') === 'en' ? 'en' : 'ko'; }
  function syncLangButtons() {
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === currentLang()));
    });
  }
  function setLang(l) {
    l = l === 'en' ? 'en' : 'ko';
    try { localStorage.setItem('app_lang', l); } catch (e) {}
    docEl.setAttribute('data-lang', l);
    docEl.lang = l;
    syncLangButtons();
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  // <option>·placeholder 처럼 span 을 넣을 수 없는 곳은 data-ko / data-en 값으로 바꿔 끼운다.
  function relabel(root) {
    var en = currentLang() === 'en';
    (root || document).querySelectorAll('[data-ko][data-en]').forEach(function (el) {
      var v = el.getAttribute(en ? 'data-en' : 'data-ko');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = v;
      else el.textContent = v;
    });
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang')); });
  });
  document.addEventListener('langchange', function () { relabel(); });
  syncLangButtons();
  relabel();
  window.TIL = { lang: currentLang, setLang: setLang, relabel: relabel };

  // ---------- 헤더 / 모바일 메뉴 ----------
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var navEl = document.querySelector('[data-nav]');
  function closeNav() {
    if (!navEl) return;
    navEl.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && navEl) {
    toggle.addEventListener('click', function () {
      var open = navEl.classList.toggle('open');
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) closeNav(); });
  }
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- 스크롤 등장 효과 (.reveal, .draw) ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function observe(root) {
    (root || document).querySelectorAll('.reveal:not(.in), .draw:not(.in)').forEach(function (el) {
      if (io && !reduceMotion) io.observe(el); else el.classList.add('in');
    });
  }
  observe();
  window.TIL.observe = observe;

  // ---------- 홈 인트로: 가운데 뜬 타이틀이 스크롤에 따라 제자리로 ----------
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var title = hero.querySelector('[data-hero-title]');
    var burst = hero.querySelector('.hero-burst');
    var after = Array.prototype.slice.call(hero.querySelectorAll('.hero-after'));
    var cue = hero.querySelector('.scroll-cue');
    if (burst) requestAnimationFrame(function () { burst.classList.add('in'); });

    // 'We build new ventures with ______' — 빈칸에 키워드가 타이핑되듯 쓰였다 지워진다(스크롤을 시작하면 시작).
    var slot = hero.querySelector('[data-typer]');
    var typed = slot && slot.querySelector('[data-typed]');
    var sizeSlot = function () {};
    if (slot && typed) {
      var words = slot.getAttribute('data-words').split(',');
      sizeSlot = function () {
        var probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
        slot.appendChild(probe);
        var w = 0;
        words.forEach(function (wd) { probe.textContent = wd; w = Math.max(w, probe.getBoundingClientRect().width); });
        probe.remove();
        slot.style.width = Math.ceil(w + 4) + 'px';
      };
      sizeSlot();
      if (reduceMotion) {
        typed.textContent = words[1] || words[0];
      } else {
        typed.textContent = '';
        var wi = 0, ci = 0, deleting = false, started = false;
        var tick = function () {
          var word = words[wi];
          slot.classList.add('typing');
          if (!deleting) {
            ci++;
            typed.textContent = word.slice(0, ci);
            if (ci === word.length) { deleting = true; slot.classList.remove('typing'); return setTimeout(tick, 1700); }
            return setTimeout(tick, 70 + Math.random() * 60);
          }
          ci--;
          typed.textContent = word.slice(0, ci);
          if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; slot.classList.remove('typing'); return setTimeout(tick, 380); }
          setTimeout(tick, 38);
        };
        var begin = function () {
          if (started || window.scrollY < 4) return;
          started = true;
          window.removeEventListener('scroll', begin);
          setTimeout(tick, 150);
        };
        window.addEventListener('scroll', begin, { passive: true });
        begin();
      }
    }

    if (!reduceMotion && title) {
      hero.classList.add('is-live');
      var start = { x: 0, y: 0, s: 1 };
      var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

      var measure = function () {
        sizeSlot();
        title.style.transform = 'none';
        // 줄바꿈된 제목은 상자보다 글자 폭이 좁으므로 실제 글자 영역을 기준으로 가운데를 잡는다.
        var range = document.createRange();
        range.selectNodeContents(title);
        var r = range.getBoundingClientRect();
        var box = title.getBoundingClientRect();
        title.style.transformOrigin = (r.left + r.width / 2 - box.left).toFixed(1) + 'px ' + (r.top + r.height / 2 - box.top).toFixed(1) + 'px';
        var sticky = hero.querySelector('.hero-sticky').getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = sticky.height || window.innerHeight;
        var s = Math.min(1.04, (vw - 32) / r.width);
        start.s = Math.max(s, 0.9);
        start.x = vw / 2 - (r.left + r.width / 2);
        start.y = sticky.top + vh / 2 - (r.top + r.height / 2);
        frame();
      };

      var frame = function () {
        var total = hero.offsetHeight - window.innerHeight;
        var p = total > 0 ? clamp(-hero.getBoundingClientRect().top / total) : 1;
        var m = ease(clamp(p / 0.6));            // 타이틀 이동 (0 → 60%)
        var a = ease(clamp((p - 0.4) / 0.45));    // 아래 내용 등장 (40% → 85%)
        var k = 1 - m;
        title.style.transform = 'translate3d(' + (start.x * k).toFixed(1) + 'px,' + (start.y * k).toFixed(1) + 'px,0) scale(' + (1 + (start.s - 1) * k).toFixed(4) + ')';
        after.forEach(function (el) {
          el.style.opacity = a.toFixed(3);
          el.style.transform = 'translateY(' + ((1 - a) * 24).toFixed(1) + 'px)';
          el.style.pointerEvents = a > 0.6 ? '' : 'none';
        });
        if (burst) {
          burst.style.opacity = (1 - 0.82 * m).toFixed(3);
          burst.style.transform = 'translate(-50%, -50%) scale(' + (1 + 0.35 * m).toFixed(4) + ') rotate(' + (m * 12).toFixed(2) + 'deg)';
        }
        if (cue) cue.style.opacity = (1 - clamp(p / 0.15)).toFixed(3);
      };

      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; frame(); });
      }, { passive: true });
      window.addEventListener('resize', measure);
      document.addEventListener('langchange', measure);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      measure();
    }
  }

  // ---------- 원격 이미지 로딩 실패 시 숨김 ----------
  window.TIL.imgFallback = function (root) {
    (root || document).querySelectorAll('img[data-fallback]').forEach(function (img) {
      function fail() {
        var txt = img.getAttribute('data-fallback');
        if (txt) {
          var box = document.createElement('div');
          box.className = img.className.replace(/\blogo\b/, 'logo-txt');
          box.textContent = txt;
          img.replaceWith(box);
        } else { img.remove(); }
      }
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener('error', fail, { once: true });
    });
  };
  window.TIL.imgFallback();

  // ---------- 양식 ----------
  var params = new URLSearchParams(location.search);
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function t(ko, en) { return currentLang() === 'en' ? en : ko; }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var key = form.getAttribute('data-form');
    var status = form.querySelector('[data-form-status]');

    // ?type=investment → 문의 유형 미리 선택
    var type = params.get('type');
    if (type) {
      var pre = form.querySelector('input[data-type="' + type.replace(/[^\w-]/g, '') + '"]');
      if (pre) pre.checked = true;
    }

    // 스팸 봇 방지용 숨김 칸
    var trap = document.createElement('input');
    trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(trap);

    function fieldsOf() { return Array.prototype.slice.call(form.querySelectorAll('.field')); }
    function validate(field) {
      var ok = true;
      var group = field.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      if (field.hasAttribute('data-required') && group.length) {
        ok = Array.prototype.some.call(group, function (i) { return i.checked; });
      }
      field.querySelectorAll('.input, .textarea').forEach(function (el) {
        var v = el.value.trim();
        if (el.required && !v) ok = false;
        if (v && el.type === 'email' && !EMAIL_RE.test(v)) ok = false;
        if (v && el.type === 'tel' && !/^[0-9+\-\s()]{8,}$/.test(v)) ok = false;
      });
      field.classList.toggle('invalid', !ok);
      return ok;
    }
    fieldsOf().forEach(function (f) {
      ['change', 'input'].forEach(function (ev) {
        f.addEventListener(ev, function () { if (f.classList.contains('invalid')) validate(f); });
      });
    });
    function collect() {
      var data = [];
      fieldsOf().forEach(function (f) {
        var label = f.getAttribute('data-label');
        if (!label) return;
        var values = [];
        f.querySelectorAll('input, textarea').forEach(function (el) {
          if (el.type === 'radio' || el.type === 'checkbox') { if (el.checked) values.push(el.value); }
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
        var first = invalid[0].querySelector('input, textarea');
        if (first) first.focus();
        if (status) status.textContent = t('필수 항목을 확인해주세요.', 'Please check the required fields.');
        return;
      }
      var data = collect();
      var thanks = '/thanks';
      var title = form.getAttribute('data-title') || '문의하기';
      var submit = form.querySelector('[type="submit"]');
      var label = submit ? submit.innerHTML : '';

      if (trap.value) { location.href = thanks; return; }

      if (cfg.formEndpoint) {
        if (submit) { submit.disabled = true; submit.textContent = t('보내는 중…', 'Sending…'); }
        // text/plain 으로 보내야 Google Apps Script 웹 앱이 CORS 사전 요청 없이 받을 수 있다.
        fetch(cfg.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ form: key, title: title, submittedAt: new Date().toISOString(), page: location.href, fields: data }),
        }).then(function (res) {
          if (!res.ok) throw new Error(res.status);
          return res.json().catch(function () { return { ok: true }; });
        }).then(function (result) {
          if (result && result.ok === false) throw new Error(result.error);
          location.href = thanks;
        }).catch(function () {
          if (submit) { submit.disabled = false; submit.innerHTML = label; }
          if (status) status.innerHTML = t('전송 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 ', 'Something went wrong. Please try again or email ') + '<a href="mailto:' + cfg.contactEmail + '">' + cfg.contactEmail + '</a>' + t(' 로 연락주세요.', '.');
        });
        return;
      }

      // 엔드포인트 미설정: 메일 앱으로 전송
      var body = data.map(function (d) { return '■ ' + d.label + '\n' + (d.value || '-'); }).join('\n\n');
      location.href = 'mailto:' + cfg.contactEmail + '?subject=' + encodeURIComponent('[The Invention Lab] ' + title) + '&body=' + encodeURIComponent(body);
    });
  });
})();
