// Supabase(REST)에서 사례·포트폴리오·팀·뉴스를 읽어와 화면에 그린다.
// 불러오지 못하면 HTML 에 미리 넣어 둔 정적 내용이 그대로 보인다.
(function () {
  'use strict';
  var sb = (window.SITE_CONFIG || {}).supabase || {};
  if (!sb.url || !sb.anonKey) return;
  var API = sb.url.replace(/\/$/, '') + '/rest/v1/';
  var VS = '벤처스튜디오형 투자사례';
  var params = new URLSearchParams(location.search);
  var TIL = window.TIL || { lang: function () { return 'ko'; }, observe: function () {}, imgFallback: function () {}, relabel: function () {} };

  // ---------- helpers ----------
  function clean(v) {
    if (v === null || v === undefined) return '';
    v = String(v).trim();
    return /^(none|null|nan|undefined)$/i.test(v) ? '' : v;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function bi(ko, en) {
    ko = clean(ko); en = clean(en) || ko;
    if (!ko) ko = en;
    if (ko === en) return esc(ko);
    return '<span class="ko">' + esc(ko) + '</span><span class="en">' + esc(en) + '</span>';
  }
  function biHtml(ko, en) {
    if (!en || ko === en) return ko;
    return '<span class="ko">' + ko + '</span><span class="en">' + en + '</span>';
  }
  function f(row, key) { return bi(row[key], row[key + '_en']); }
  function para(text) {
    text = clean(text);
    if (!text) return '';
    return text.split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p.trim()).replace(/\r?\n/g, '<br>') + '</p>'; }).join('');
  }
  function enc(v) { return encodeURIComponent(v); }
  function kw(v) { return clean(v).replace(/[,()*"\\]/g, ' ').trim(); }
  function safeUrl(u) { u = clean(u); return /^https?:\/\//i.test(u) ? u : ''; }
  function date(v) { v = clean(v); return v ? v.slice(0, 10) : ''; }
  function t(ko, en) { return '<span class="ko">' + ko + '</span><span class="en">' + en + '</span>'; }
  function img(url, cls, fallback) {
    url = safeUrl(url);
    if (!url) return fallback ? '<div class="' + cls.replace('logo', 'logo-txt') + '">' + esc(fallback) + '</div>' : '';
    return '<img class="' + cls + '" src="' + esc(url) + '" alt="" loading="lazy" data-fallback="' + esc(fallback || '') + '">';
  }
  function initial(name) { name = clean(name); return name ? name.charAt(0).toUpperCase() : ''; }

  // GET + Range 헤더(페이지 단위). total 은 Content-Range 의 전체 개수(없으면 null).
  function get(path, from, to) {
    var headers = { apikey: sb.anonKey, Authorization: 'Bearer ' + sb.anonKey };
    if (from !== undefined) { headers['Range-Unit'] = 'items'; headers.Range = from + '-' + to; headers.Prefer = 'count=exact'; }
    return fetch(API + path, { headers: headers }).then(function (res) {
      if (!res.ok && res.status !== 206) throw new Error('HTTP ' + res.status);
      var cr = res.headers.get('content-range') || '';
      var total = /\/(\d+)$/.test(cr) ? Number(cr.split('/')[1]) : null;
      return res.json().then(function (rows) { return { rows: Array.isArray(rows) ? rows : [], total: total }; });
    });
  }
  function done(root) { TIL.imgFallback(root); TIL.observe(root); }

  // ---------- cards ----------
  function projectCard(r, opts) {
    opts = opts || {};
    var tag = opts.sector ? (clean(r.sector) ? esc(clean(r.sector)) : f(r, 'category')) : f(r, 'category');
    return '<a class="card" href="/cases/project?id=' + enc(r.id) + '">' +
      (opts.logo ? img(r.logo_url, 'logo', '') : '') +
      '<span class="tag">' + tag + '</span>' +
      '<h3>' + f(r, 'project_name') + '</h3>' +
      (clean(r.summary) ? '<p>' + f(r, 'summary') + '</p>' : '') +
      (opts.team && clean(r.team_name) ? '<span class="meta">' + esc(clean(r.team_name)) + '</span>' : '<span class="more">' + t('상세 보기', 'View Case') + '</span>') +
      '</a>';
  }
  function portfolioCard(r) {
    var name = clean(r.company_name) || clean(r.refine_name);
    var en = clean(r.refine_name) || name;
    var stage = clean(r.exit);
    var meta = [clean(r.business_field), clean(r.country_name)].filter(Boolean).map(esc).join(' · ');
    return '<a class="card" href="/cases/portfolio?id=' + enc(r.id) + '">' +
      '<div class="row">' + img(r.logo_url, 'logo', initial(en)) + (stage ? '<span class="badge' + (/exit/i.test(stage) ? ' solid' : '') + '">' + esc(stage) + '</span>' : '') + '</div>' +
      '<h3>' + bi(name, en) + '</h3>' +
      (en !== name ? '<p class="name-en ko">' + esc(en) + '</p>' : '') +
      (meta ? '<span class="meta">' + meta + '</span>' : '') +
      '</a>';
  }
  function newsItem(r) {
    var sec = clean(r.section);
    return '<li><a href="/insights/press?id=' + enc(r.id) + '">' +
      '<h3>' + esc(clean(r.title)) + '</h3>' +
      '<span class="sec">' + esc(sec) + '</span>' +
      '<time datetime="' + esc(date(r.published_date)) + '">' + esc(date(r.published_date)) + '</time>' +
      '</a></li>';
  }

  // ---------- 홈 / Cases: 벤처스튜디오 사례 ----------
  document.querySelectorAll('[data-vs-cases]').forEach(function (box) {
    var limit = box.getAttribute('data-limit');
    get('project?select=*&category=eq.' + enc(VS) + '&order=created_at.desc' + (limit ? '&limit=' + Number(limit) : ''))
      .then(function (d) {
        if (!d.rows.length) return;
        box.innerHTML = d.rows.map(function (r) { return projectCard(r, { sector: true, logo: true }); }).join('');
        done(box);
      }).catch(function () {});
  });

  // ---------- 목록 공통: 필터 + 검색 + 더보기 ----------
  function lister(root, o) {
    var list = root.querySelector('[data-list]');
    var more = root.querySelector('[data-more]');
    var note = root.querySelector('[data-note]');
    var offset = 0, seq = 0, timer = null;
    function load(reset) {
      if (reset) offset = 0;
      var my = ++seq;
      var path = o.path();
      if (more) more.disabled = true;
      get(path, offset, offset + o.size - 1).then(function (d) {
        if (my !== seq) return;
        var html = d.rows.map(o.item).join('');
        if (reset) list.innerHTML = html || '<div class="empty">' + t('조건에 맞는 결과가 없습니다.', 'No results found.') + '</div>';
        else list.insertAdjacentHTML('beforeend', html);
        offset += d.rows.length;
        var hasMore = d.total !== null ? offset < d.total : d.rows.length === o.size;
        if (more) { more.hidden = !hasMore; more.disabled = false; }
        if (note) note.hidden = true;
        done(list);
      }).catch(function () {
        if (my !== seq) return;
        if (more) more.disabled = false;
        if (note) note.hidden = false;
      });
    }
    root.querySelectorAll('select[data-f]').forEach(function (s) { s.addEventListener('change', function () { load(true); }); });
    root.querySelectorAll('input[data-f]').forEach(function (i) {
      i.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { load(true); }, 300); });
    });
    if (more) more.addEventListener('click', function () { load(false); });
    return { load: load };
  }
  function val(root, key) { var el = root.querySelector('[data-f="' + key + '"]'); return el ? el.value.trim() : ''; }
  function fillSelect(sel, items) {
    // items: [{value, ko, en}]
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.value;
      o.setAttribute('data-ko', it.ko);
      o.setAttribute('data-en', it.en || it.ko);
      o.textContent = it.ko;
      sel.appendChild(o);
    });
    TIL.relabel(sel);
  }
  function uniq(arr) { var seen = {}; return arr.filter(function (v) { if (!v || seen[v]) return false; seen[v] = 1; return true; }); }
  var collator = typeof Intl !== 'undefined' ? new Intl.Collator('ko') : null;
  function sortKo(a, b) { return collator ? collator.compare(a, b) : a < b ? -1 : 1; }

  // Cases › Portfolio (8개씩)
  document.querySelectorAll('[data-portfolio]').forEach(function (root) {
    var l = lister(root, {
      size: 8,
      item: portfolioCard,
      path: function () {
        var p = 'portfolio_companies?select=*&order=exit.desc.nullslast,id.desc';
        var field = val(root, 'field'), country = val(root, 'country'), q = kw(val(root, 'q'));
        if (field) p += '&business_field=ilike.' + enc('*' + kw(field) + '*');
        if (country) p += '&country_name=ilike.' + enc('*' + kw(country) + '*');
        if (q) p += '&or=' + enc('(company_name.ilike.*' + q + '*,business_field.ilike.*' + q + '*)');
        return p;
      },
    });
    get('portfolio_companies?select=business_field,country_name').then(function (d) {
      var fs = uniq(d.rows.map(function (r) { return clean(r.business_field); })).sort(sortKo);
      var cs = uniq(d.rows.map(function (r) { return clean(r.country_name); })).sort(sortKo);
      var fsel = root.querySelector('[data-f="field"]'), csel = root.querySelector('[data-f="country"]');
      if (fsel) fillSelect(fsel, fs.map(function (v) { return { value: v, ko: v }; }));
      if (csel) fillSelect(csel, cs.map(function (v) { return { value: v, ko: v }; }));
    }).catch(function () {});
    l.load(true);
  });

  // Cases › Our Projects (6개씩)
  document.querySelectorAll('[data-projects]').forEach(function (root) {
    var l = lister(root, {
      size: 6,
      item: function (r) { return projectCard(r, { team: true }); },
      path: function () {
        var p = 'project?select=*&category=neq.' + enc(VS) + '&order=created_at.desc';
        var team = val(root, 'team'), cat = val(root, 'category'), q = kw(val(root, 'q'));
        if (team) p += '&team_name=eq.' + enc(team);
        if (cat) p += '&category=eq.' + enc(cat);
        if (q) p += '&or=' + enc('(project_name.ilike.*' + q + '*,summary.ilike.*' + q + '*,project_name_en.ilike.*' + q + '*)');
        return p;
      },
    });
    get('project?select=category,category_en,team_name&category=neq.' + enc(VS)).then(function (d) {
      var cats = {}, teams = [];
      d.rows.forEach(function (r) {
        var c = clean(r.category);
        if (c && !cats[c]) cats[c] = clean(r.category_en) || c;
        teams.push(clean(r.team_name));
      });
      var tsel = root.querySelector('[data-f="team"]'), csel = root.querySelector('[data-f="category"]');
      if (tsel) fillSelect(tsel, uniq(teams).sort(sortKo).map(function (v) { return { value: v, ko: v }; }));
      if (csel) fillSelect(csel, Object.keys(cats).sort(sortKo).map(function (v) { return { value: v, ko: v, en: cats[v] }; }));
    }).catch(function () {});
    l.load(true);
  });

  // Insights › News (10개씩)
  document.querySelectorAll('[data-news]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-section]'));
    var section = params.get('section') || '';
    function select(s) {
      section = s;
      tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-section') === s)); });
    }
    if (!tabs.some(function (b) { return b.getAttribute('data-section') === section; })) section = '';
    select(section);
    var l = lister(root, {
      size: 10,
      item: newsItem,
      path: function () {
        var p = 'til_press?select=id,title,published_date,section&order=published_date.desc';
        var q = kw(val(root, 'q'));
        if (section) p += '&section=eq.' + enc(section);
        if (q) p += '&title=ilike.' + enc('*' + q + '*');
        return p;
      },
    });
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        select(b.getAttribute('data-section'));
        var u = new URL(location.href);
        if (section) u.searchParams.set('section', section); else u.searchParams.delete('section');
        history.replaceState(null, '', u.pathname + u.search);
        l.load(true);
      });
    });
    l.load(true);
  });

  // ---------- About › Teams ----------
  var dialog = null;
  function profile(m) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'profile';
      document.body.appendChild(dialog);
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    }
    function block(ko, en, key) {
      var a = clean(m[key]), b = clean(m[key + '_en']);
      if (!a && !b) return '';
      var lines = function (s) { return '<ul>' + s.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { return '<li>' + esc(x.replace(/^[-•·]\s*/, '')) + '</li>'; }).join('') + '</ul>'; };
      return '<h4>' + t(ko, en) + '</h4>' + biHtml(lines(a || b), b && b !== a ? lines(b) : '');
    }
    var intro = clean(m.introduction), introEn = clean(m.introduction_en);
    dialog.innerHTML = '<button class="profile-close" type="button" aria-label="Close">×</button><div class="profile-in">' +
      '<div class="ph">' + img(m.profile_image_url, '', '') + '</div>' +
      '<div><h2>' + f(m, 'name') + '</h2><p class="pos">' + f(m, 'position') + '</p>' +
      (intro || introEn ? biHtml(para(intro || introEn), introEn && introEn !== intro ? para(introEn) : '') : '') +
      block('학력', 'Education', 'education') + block('경력', 'Career', 'career') +
      '</div></div>';
    dialog.querySelector('.profile-close').addEventListener('click', function () { dialog.close(); });
    TIL.imgFallback(dialog);
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }
  document.querySelectorAll('[data-team]').forEach(function (box) {
    get('team?select=*&order=id.asc').then(function (d) {
      if (!d.rows.length) return;
      var groups = [], byName = {};
      d.rows.forEach(function (m) {
        var g = clean(m.team_name) || 'Team';
        if (!byName[g]) { byName[g] = []; groups.push(g); }
        byName[g].push(m);
      });
      box.innerHTML = groups.map(function (g) {
        return '<div class="team-group"><h3>' + esc(g) + '</h3><div class="members">' + byName[g].map(function (m) {
          return '<button class="member" type="button" data-id="' + esc(m.id) + '">' +
            '<div class="ph">' + img(m.profile_image_url, '', '') + '</div>' +
            '<strong>' + f(m, 'name') + '</strong><span>' + f(m, 'position') + '</span></button>';
        }).join('') + '</div></div>';
      }).join('');
      box.querySelectorAll('.member').forEach(function (b) {
        b.addEventListener('click', function () {
          var m = d.rows.filter(function (x) { return String(x.id) === b.getAttribute('data-id'); })[0];
          if (m) profile(m);
        });
      });
      done(box);
    }).catch(function () {});
  });

  // ---------- Capabilities: 사례 카드 → 프로젝트 상세 연결 ----------
  var caseLinks = Array.prototype.slice.call(document.querySelectorAll('[data-case]'));
  if (caseLinks.length) {
    var names = uniq(caseLinks.map(function (a) { return a.getAttribute('data-case'); }));
    var inList = names.map(function (n) { return '"' + n.replace(/"/g, '') + '"'; }).join(',');
    get('project?select=id,project_name&project_name=in.' + enc('(' + inList + ')')).then(function (d) {
      var map = {};
      d.rows.forEach(function (r) { map[clean(r.project_name)] = r.id; });
      caseLinks.forEach(function (a) {
        var id = map[a.getAttribute('data-case')];
        if (id !== undefined) a.href = '/cases/project?id=' + enc(id);
      });
    }).catch(function () {});
  }

  // ---------- 상세 페이지 ----------
  var detail = document.querySelector('[data-detail]');
  if (detail) {
    var kind = detail.getAttribute('data-detail');
    var id = clean(params.get('id'));
    var fail = function () {
      detail.innerHTML = '<div class="empty">' + t('내용을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'We couldn’t load this page. Please try again later.') +
        '<div class="btns" style="justify-content:center;margin-top:24px"><a class="btn btn-line" href="' + (kind === 'press' ? '/insights' : '/cases') + '">' + t('목록으로', 'Back to list') + '</a></div></div>';
    };
    if (!id) { fail(); return; }
    var table = { project: 'project', portfolio: 'portfolio_companies', press: 'til_press' }[kind];
    get(table + '?select=*&id=eq.' + enc(id)).then(function (d) {
      var r = d.rows[0];
      if (!r) throw new Error('not found');
      var render = { project: renderProject, portfolio: renderPortfolio, press: renderPress }[kind];
      render(r);
      done(detail);
    }).catch(fail);
  }

  function factsHtml(items) {
    items = items.filter(function (x) { return x[1]; });
    if (!items.length) return '';
    return '<dl class="facts">' + items.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>';
  }
  function section(ko, en, row, key) {
    var a = clean(row[key]), b = clean(row[key + '_en']);
    if (!a && !b) return '';
    return '<div class="prose-sec"><h2>' + t(ko, en) + '</h2><div class="prose">' + biHtml(para(a || b), b && b !== a ? para(b) : '') + '</div></div>';
  }
  function extLink(u, label) { u = safeUrl(u); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + label + ' ↗</a>' : ''; }
  function related(title, path, card, cls) {
    var box = document.createElement('section');
    box.className = 'related';
    detail.appendChild(box);
    get(path).then(function (d) {
      if (!d.rows.length) { box.remove(); return; }
      box.innerHTML = '<h2>' + title + '</h2><div class="grid ' + (cls || 'g2') + '">' + d.rows.map(card).join('') + '</div>';
      done(box);
    }).catch(function () { box.remove(); });
  }
  function setTitle(s) { s = clean(s); if (s) document.title = s + ' | The Invention Lab'; }

  function renderProject(r) {
    setTitle(r.project_name);
    var isVS = clean(r.category) === VS;
    detail.innerHTML = '<a class="back" href="/cases">Cases</a>' +
      '<div class="detail-head"><div><p class="eyebrow">' + f(r, 'category') + '</p><h1>' + f(r, 'project_name') + '</h1>' +
      (clean(r.summary) ? '<p class="sub">' + f(r, 'summary') + '</p>' : '') + '</div>' + img(r.logo_url, 'logo', '') + '</div>' +
      factsHtml([
        [t('담당 팀', 'Team'), esc(clean(r.team_name))],
        [t('연도', 'Year'), esc(clean(r.year))],
        [t('기간', 'Duration'), esc(clean(r.duration))],
        [t('참여 기업', 'Participants'), esc(clean(r.participant_count))],
        [t('분야', 'Sector'), esc(clean(r.sector))],
        [t('링크', 'Link'), extLink(r.main_url, t('바로가기', 'Visit'))],
        [t('결과물', 'Output'), extLink(r.output_url, t('보기', 'View'))],
      ]) +
      section('개요', 'Overview', r, 'overview') +
      section('진행 과정', 'Process', r, 'process') +
      section('핵심 포인트', 'Key Points', r, 'keypoint') +
      section('성과', 'Output', r, 'output');
    related(t('관련 사례', 'Related Cases'),
      'project?select=*&category=eq.' + enc(clean(r.category)) + '&id=neq.' + enc(r.id) + '&order=created_at.desc&limit=2',
      function (x) { return projectCard(x, isVS ? { sector: true, logo: true } : { team: true }); });
  }

  function renderPortfolio(r) {
    var name = clean(r.company_name) || clean(r.refine_name), en = clean(r.refine_name) || name;
    setTitle(name);
    var closed = clean(r.close);
    detail.innerHTML = '<a class="back" href="/cases#portfolio">Portfolio</a>' +
      '<div class="detail-head"><div><p class="eyebrow">' + esc(clean(r.business_field) || 'Portfolio') + '</p><h1>' + bi(name, en) + '</h1>' +
      (en !== name ? '<p class="sub ko">' + esc(en) + '</p>' : '') +
      (clean(r.service) ? '<p class="sub">' + esc(clean(r.service)) + '</p>' : '') + '</div>' + img(r.logo_url, 'logo', initial(en)) + '</div>' +
      factsHtml([
        [t('국가', 'Country'), esc(clean(r.country_name))],
        [t('사업 분야', 'Business Field'), esc(clean(r.business_field))],
        [t('단계', 'Stage'), esc(clean(r.exit))],
        [t('상태', 'Status'), closed && !/^(false|0|n|no)$/i.test(closed) ? t('종료', 'Closed') : ''],
        [t('홈페이지', 'Website'), extLink(r.homepage_url, esc(clean(r.homepage_url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')))],
      ]);
    related(t('다른 포트폴리오', 'More Portfolio'),
      'portfolio_companies?select=*&id=neq.' + enc(r.id) + '&order=exit.desc.nullslast,id.desc&limit=2', portfolioCard);
  }

  // 본문이 HTML 이면 위험 요소를 걷어내고, 아니면 문단으로 나눈다.
  function richText(s) {
    s = clean(s);
    if (!s) return '';
    if (!/<\/?(p|br|div|img|a|h\d|ul|ol|li|strong|em|b|i|span|figure|blockquote)\b/i.test(s) || !window.DOMParser) return para(s);
    var doc = new DOMParser().parseFromString(s, 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta').forEach(function (n) { n.remove(); });
    doc.body.querySelectorAll('*').forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var k = a.name.toLowerCase();
        if (k.indexOf('on') === 0 || k === 'style' || k === 'class' || k === 'id') n.removeAttribute(a.name);
        else if ((k === 'href' || k === 'src') && !/^(https?:|mailto:)/i.test(a.value.trim())) n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener'); }
    });
    return doc.body.innerHTML;
  }
  function relatedNews(v) {
    v = clean(v);
    if (!v) return '';
    var items = null;
    try { items = JSON.parse(v); } catch (e) {}
    if (items && !Array.isArray(items)) items = [items];
    var out = [];
    if (items) {
      items.forEach(function (it) {
        if (typeof it === 'string') { out.push(lineItem(it)); return; }
        if (!it || typeof it !== 'object') return;
        var title = clean(it.title || it.name || it.headline);
        var url = safeUrl(it.url || it.link || it.href);
        var media = clean(it.media || it.press || it.source || it.publisher);
        if (!title && !url) return;
        out.push('<li>' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(title || url) + ' ↗</a>' : esc(title)) + (media ? ' <span class="muted">— ' + esc(media) + '</span>' : '') + '</li>');
      });
    } else {
      v.split(/\r?\n/).forEach(function (line) { if (line.trim()) out.push(lineItem(line)); });
    }
    return out.length ? '<ul>' + out.join('') + '</ul>' : '';
  }
  function lineItem(s) {
    var m = s.match(/https?:\/\/\S+/);
    if (!m) return '<li>' + esc(s.trim()) + '</li>';
    var label = s.replace(m[0], '').replace(/[\s|,:–—-]+$/, '').replace(/^[\s|,:–—-]+/, '').trim();
    return '<li><a href="' + esc(m[0]) + '" target="_blank" rel="noopener">' + esc(label || m[0]) + ' ↗</a></li>';
  }

  function renderPress(r) {
    setTitle(r.title);
    var content = richText(r.content), rel = relatedNews(r.related_news), image = safeUrl(r.img);
    detail.innerHTML = '<a class="back" href="/insights">Insights</a>' +
      '<div class="detail-head"><div><p class="eyebrow">' + esc(clean(r.section) || 'News') + '</p><h1>' + esc(clean(r.title)) + '</h1>' +
      (clean(r.summary) ? '<p class="sub">' + esc(clean(r.summary)) + '</p>' : '') + '</div></div>' +
      factsHtml([
        [t('게시일', 'Published'), esc(date(r.published_date))],
        [t('태그', 'Tag'), esc(clean(r.tag))],
        [t('원문', 'Source'), extLink(r.url, t('원문 보기', 'Read original'))],
      ]) +
      (image ? '<img class="detail-img" src="' + esc(image) + '" alt="" data-fallback="">' : '') +
      (content ? '<div class="prose-sec"><h2>' + t('본문', 'Article') + '</h2><div class="prose">' + content + '</div></div>' : '') +
      (rel ? '<div class="prose-sec"><h2>' + t('관련 보도', 'Press Coverage') + '</h2><div class="prose">' + rel + '</div></div>' : '');
    related(t('최신 소식', 'Latest News'),
      'til_press?select=id,title,published_date,section&id=neq.' + enc(r.id) + '&order=published_date.desc&limit=2',
      function (x) {
        return '<a class="card" href="/insights/press?id=' + enc(x.id) + '"><span class="tag">' + esc(clean(x.section) || 'News') + '</span><h3>' + esc(clean(x.title)) + '</h3><span class="meta">' + esc(date(x.published_date)) + '</span></a>';
      });
  }
})();
