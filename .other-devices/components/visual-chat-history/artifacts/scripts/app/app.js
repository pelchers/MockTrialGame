/* visual-chat-history client. Plain JavaScript, no libraries, no network beyond its own server.
   Every piece of chat text is put on the page with textContent or text nodes, never innerHTML. */
(function () {
  'use strict';

  var D = document;
  var boot = readJson('vch-boot') || { mode: 'live', rawBase: 'raw/' };
  var STATIC = boot.mode === 'export';

  // ------------------------------------------------------------ small helpers

  function readJson(id) {
    var el = D.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function h(tag, attrs) {
    var el = D.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }

  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(kid instanceof Node ? kid : D.createTextNode(String(kid)));
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function fmtDate(iso, withDay) {
    if (!iso) return 'Undated';
    var d = new Date(iso);
    return (withDay ? DAYS[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function fmtTime(iso) { return iso ? iso.slice(11, 16) : ''; }
  function fmtStamp(e) {
    if (!e.ts) return e.tsRaw || 'Undated';
    return fmtDate(e.ts, true) + (e.hasTime ? ', ' + fmtTime(e.ts) + ' UTC' : '');
  }
  function localTitle(iso) {
    if (!iso) return '';
    try { return 'Your local time: ' + new Date(iso).toLocaleString(); } catch (e) { return ''; }
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  // ------------------------------------------------------------ entry analysis

  var SECTION_DEFS = {
    prompts: { title: 'Verbatim user prompts', short: 'Prompts', verbatim: true },
    replies: { title: 'Verbatim agent replies', short: 'Replies', verbatim: true },
    context: { title: 'Session context', short: 'Context' },
    intent: { title: 'User intent', short: 'Intent' },
    messages: { title: 'User messages', short: 'Messages' },
    references: { title: 'Reference files', short: 'References' },
    decisions: { title: 'Key decisions', short: 'Decisions' },
    report: { title: 'Agent report', short: 'Report' }
  };
  var HEADING_MAP = {
    'VERBATIM USER PROMPT': 'prompts', 'VERBATIM USER PROMPTS': 'prompts',
    'VERBATIM AGENT REPLY': 'replies', 'VERBATIM AGENT REPLIES': 'replies', 'VERBATIM AGENT REPLYS': 'replies',
    'SESSION CONTEXT': 'context', 'CONTEXT': 'context',
    'USER INTENT': 'intent', 'INTENT': 'intent',
    'USER MESSAGES': 'messages',
    'REFERENCE FILES': 'references', 'REFERENCES': 'references',
    'KEY DECISIONS': 'decisions', 'DECISIONS': 'decisions',
    'AGENT REPORT': 'report', 'AGENT RESPONSE': 'report', 'AGENT REPORTS': 'report'
  };
  var FILTER_KEYS = ['prompts', 'replies', 'intent', 'decisions', 'report', 'references', 'context'];
  var HEADING_RE = /^([A-Z][A-Z0-9 ()'\/&+-]{1,48}[A-Z)]):(?:\s+(.*))?$/;
  var HEADER_RE = /^\[([^\]\r\n]{4,40})\]\s*role=([A-Za-z][\w-]*)(.*)$/;
  var META_RE = /^(Authored by|Most recent commit|Device|Host|Branch):/i;
  var MARK_RE = /^<!--\s*\/?ENTRY\b.*-->\s*$/;

  function normHeading(s) { return s.replace(/\(S\)/g, '').replace(/\s+/g, ' ').trim(); }

  function opensFence(l) {
    var m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(l);
    if (!m) return null;
    if (m[1].charAt(0) === '`' && m[2].indexOf('`') >= 0) return null; // inline code on one line
    return { ch: m[1].charAt(0), len: m[1].length };
  }

  function closesFence(l, fence) {
    var m = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(l);
    return !!m && m[1].charAt(0) === fence.ch && m[1].length >= fence.len;
  }

  function analyze(e) {
    var lines = e.raw.replace(/\r/g, '').split('\n');
    var i = 0;
    var msg = [];
    while (i < lines.length && (MARK_RE.test(lines[i]) || !lines[i].trim())) i++;
    var head = HEADER_RE.exec(lines[i] || '');
    if (head) {
      var rest = head[3].replace(/^[\s:-]+/, '');
      if (rest) msg.push(rest);
      i++;
    }
    while (i < lines.length && META_RE.test(lines[i])) i++;
    var sections = [];
    var cur = null;
    var fence = null;
    var seenKnown = false;
    for (; i < lines.length; i++) {
      var l = lines[i];
      if (MARK_RE.test(l)) continue;
      if (fence) {
        if (closesFence(l, fence)) fence = null;
        (cur ? cur.lines : msg).push(l);
        continue;
      }
      var f = opensFence(l);
      if (f) { fence = f; (cur ? cur.lines : msg).push(l); continue; }
      var m = HEADING_RE.exec(l);
      if (m) {
        var name = normHeading(m[1]);
        var key = HEADING_MAP[name];
        if (key || (seenKnown && name.length >= 3)) {
          if (key) seenKnown = true;
          cur = { key: key || 'other', title: key ? SECTION_DEFS[key].title : titleCase(name), lines: [] };
          if (m[2]) cur.lines.push(m[2]);
          sections.push(cur);
          continue;
        }
      }
      (cur ? cur.lines : msg).push(l);
    }
    var out = { message: trimLines(msg).join('\n'), sections: [], has: {} };
    sections.forEach(function (s) {
      var text = trimLines(s.lines).join('\n');
      var sec = { key: s.key, title: s.title, text: text };
      if (s.key === 'prompts' || s.key === 'replies') sec.items = splitItems(stripFence(text));
      out.sections.push(sec);
      if (text.trim()) out.has[s.key] = true;
    });
    var p = out.sections.filter(function (s) { return s.key === 'prompts'; })[0];
    out.promptCount = p && p.items ? p.items.filter(function (x) { return x.label; }).length : 0;
    return out;
  }

  function titleCase(s) {
    return s.toLowerCase().replace(/(^|\s)([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); });
  }

  function trimLines(arr) {
    var a = 0, b = arr.length;
    while (a < b && !arr[a].trim()) a++;
    while (b > a && !arr[b - 1].trim()) b--;
    return arr.slice(a, b);
  }

  function stripFence(text) {
    var ls = text.split('\n');
    var t = trimLines(ls);
    if (t.length && /^ {0,3}(`{3,}|~{3,})/.test(t[0])) {
      t = t.slice(1);
      if (t.length && /^ {0,3}(`{3,}|~{3,})\s*$/.test(t[t.length - 1])) t = t.slice(0, -1);
    }
    return t.join('\n');
  }

  var ITEM_RE = /^\[(\d+[a-z]?|reply to [^\]]{1,60})\]\s*(?:\(([^)]{1,60})\))?\s?(.*)$/i;
  function splitItems(text) {
    var items = [];
    var cur = null;
    text.split('\n').forEach(function (l) {
      var m = ITEM_RE.exec(l);
      if (m) {
        cur = { label: m[1], when: m[2] || '', lines: [m[3]] };
        items.push(cur);
      } else if (cur) {
        cur.lines.push(l);
      } else {
        cur = { label: '', when: '', lines: [l] };
        items.push(cur);
      }
    });
    return items.map(function (x) { return { label: x.label, when: x.when, text: trimLines(x.lines).join('\n') }; })
      .filter(function (x) { return x.text || x.label; });
  }

  // ------------------------------------------------------------ search

  var FIELD_WEIGHT = { message: 3, prompts: 3, replies: 2, intent: 2, decisions: 2, report: 1.5, context: 1, references: 1, messages: 2, other: 1, meta: 1 };
  var TOKEN_RE = /[\p{L}\p{N}][\p{L}\p{N}_'-]*/gu;

  function buildIndex(entries) {
    var tokens = new Map();
    entries.forEach(function (e, idx) {
      var A = e.a;
      var fields = { message: A.message, meta: [e.machine, e.sessionMachine, e.author, e.role, e.session, e.tsRaw, e.commit ? e.commit.hash + ' ' + e.commit.subject : ''].join(' ') };
      A.sections.forEach(function (s) {
        var k = FIELD_WEIGHT[s.key] ? s.key : 'other';
        fields[k] = (fields[k] ? fields[k] + '\n' : '') + s.text;
      });
      e.fields = {};
      Object.keys(fields).forEach(function (k) { e.fields[k] = String(fields[k] || '').toLowerCase(); });
      var all = Object.keys(e.fields).map(function (k) { return e.fields[k]; }).join('\n');
      e.all = all;
      var seen = new Set(all.match(TOKEN_RE) || []);
      seen.forEach(function (t) {
        if (t.length < 2) return;
        var s = tokens.get(t);
        if (!s) { s = []; tokens.set(t, s); }
        s.push(idx);
      });
    });
    return tokens;
  }

  function parseQuery(q) {
    var terms = [];
    var re = /"([^"]+)"|(\S+)/g;
    var m;
    while ((m = re.exec(q))) {
      var t = (m[1] || m[2]).toLowerCase().trim();
      if (t) terms.push({ text: t, phrase: !!m[1] });
    }
    return terms;
  }

  // optimal string alignment distance, stopping early once it passes max
  function osa(a, b, max) {
    var n = a.length, m = b.length;
    if (Math.abs(n - m) > max) return max + 1;
    var prev2 = null, prev = new Array(m + 1), cur;
    for (var j = 0; j <= m; j++) prev[j] = j;
    for (var i = 1; i <= n; i++) {
      cur = new Array(m + 1);
      cur[0] = i;
      var rowMin = cur[0];
      for (var k = 1; k <= m; k++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(k - 1) ? 0 : 1;
        var v = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + cost);
        if (i > 1 && k > 1 && a.charCodeAt(i - 1) === b.charCodeAt(k - 2) && a.charCodeAt(i - 2) === b.charCodeAt(k - 1)) v = Math.min(v, prev2[k - 2] + 1);
        cur[k] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev;
      prev = cur;
    }
    return prev[m];
  }

  function isSubseq(a, b) {
    var j = 0;
    for (var i = 0; i < b.length && j < a.length; i++) if (b.charCodeAt(i) === a.charCodeAt(j)) j++;
    return j === a.length;
  }

  // 0 when the token does not match the term, else a score up to 1
  function fuzzyScore(term, tok) {
    var n = term.length, m = tok.length;
    if (n < 3) return 0;
    var max = n <= 4 ? 1 : n <= 9 ? 1 : 2;
    if (n === 3) max = 0;
    if (max > 0) {
      var d = osa(term, tok, max);
      if (d <= max) return 1 - d / (n + 1);
      if (m > n) {
        var d2 = osa(term, tok.slice(0, n), max);
        if (d2 <= max) return 0.8 - d2 / (n + 1);
      }
    }
    if (m <= n + 4 && tok.charCodeAt(0) === term.charCodeAt(0) && isSubseq(term, tok)) return 0.45;
    return 0;
  }

  function isBoundary(text, i) {
    if (i <= 0) return true;
    return !/[\p{L}\p{N}]/u.test(text.charAt(i - 1));
  }

  var searchCache = { q: null, result: null };
  function runSearch(q) {
    if (searchCache.q === q) return searchCache.result;
    var terms = parseQuery(q);
    if (!terms.length) { searchCache = { q: q, result: null }; return null; }
    var total = null;
    var hlExact = [], hlFuzzy = [];
    terms.forEach(function (term) {
      var scores = new Map();
      S.entries.forEach(function (e, idx) {
        var best = 0;
        Object.keys(e.fields).forEach(function (k) {
          var at = e.fields[k].indexOf(term.text);
          if (at >= 0) best += FIELD_WEIGHT[k] * (isBoundary(e.fields[k], at) ? 1 : 0.7);
        });
        if (best) scores.set(idx, best);
      });
      hlExact.push(term.text);
      if (!term.phrase && /^[\p{L}\p{N}]+$/u.test(term.text) && term.text.length >= 3) {
        var found = [];
        S.tokens.forEach(function (list, tok) {
          if (tok.indexOf(term.text) >= 0) return;
          var sc = fuzzyScore(term.text, tok);
          if (sc > 0) found.push([tok, sc, list]);
        });
        found.sort(function (a, b) { return b[1] - a[1] || a[0].length - b[0].length; });
        found.slice(0, 400).forEach(function (f) {
          if (hlFuzzy.length < 80) hlFuzzy.push(f[0]);
          f[2].forEach(function (idx) {
            var s = 0.6 * f[1];
            if ((scores.get(idx) || 0) < s) scores.set(idx, (scores.get(idx) || 0) + s);
          });
        });
      }
      if (total === null) total = scores;
      else {
        var next = new Map();
        total.forEach(function (v, idx) { if (scores.has(idx)) next.set(idx, v + scores.get(idx)); });
        total = next;
      }
    });
    var result = { terms: terms, scores: total || new Map(), re: buildHighlighter(hlExact, hlFuzzy) };
    searchCache = { q: q, result: result };
    return result;
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function buildHighlighter(exact, fuzzy) {
    var parts = exact.map(escRe).concat(fuzzy.map(function (t) { return '(?<![\\p{L}\\p{N}])' + escRe(t) + '(?![\\p{L}\\p{N}])'; }));
    if (!parts.length) return null;
    parts.sort(function (a, b) { return b.length - a.length; });
    try { return new RegExp(parts.join('|'), 'giu'); } catch (e) { return null; }
  }

  // ------------------------------------------------------------ text rendering (safe)

  function marked(text, re) {
    var frag = D.createDocumentFragment();
    if (!re || !text) { frag.appendChild(D.createTextNode(text)); return frag; }
    re.lastIndex = 0;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0].length) { re.lastIndex++; continue; }
      if (m.index > last) frag.appendChild(D.createTextNode(text.slice(last, m.index)));
      frag.appendChild(h('mark', null, m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(D.createTextNode(text.slice(last)));
    return frag;
  }

  var URL_RE = /https?:\/\/[^\s<>"'`)\]]+/g;
  // one line of prose: `code` spans and http(s) links, everything else as text
  function inline(line, re) {
    var frag = D.createDocumentFragment();
    var parts = line.split(/(`[^`\n]+`)/);
    parts.forEach(function (p) {
      if (!p) return;
      if (p.length > 2 && p.charAt(0) === '`' && p.charAt(p.length - 1) === '`') {
        frag.appendChild(h('code', null, marked(p.slice(1, -1), re)));
        return;
      }
      var last = 0, m;
      URL_RE.lastIndex = 0;
      while ((m = URL_RE.exec(p))) {
        if (m.index > last) frag.appendChild(marked(p.slice(last, m.index), re));
        var url = m[0].replace(/[.,;:]+$/, '');
        frag.appendChild(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, marked(url, re)));
        last = m.index + url.length;
        URL_RE.lastIndex = last;
      }
      if (last < p.length) frag.appendChild(marked(p.slice(last), re));
    });
    return frag;
  }

  function prose(text, re) {
    var box = h('div', { class: 'prose' });
    var lines = text.split('\n');
    var inFence = false, pre = null;
    lines.forEach(function (l) {
      if (/^ {0,3}(`{3,}|~{3,})/.test(l)) {
        if (!inFence) { inFence = true; pre = h('pre', { class: 'code' }); box.appendChild(pre); }
        else { inFence = false; pre = null; }
        return;
      }
      if (inFence) { pre.appendChild(marked(l + '\n', re)); return; }
      var cls = 'ln';
      var bullet = /^(\s*)([-*]|\d+[.)])\s+/.exec(l);
      if (!l.trim()) cls += ' blank';
      else if (/^\s*(Initial|Final) Response:\s*$/.test(l) || /^\s{0,4}[A-Z][\w ()/-]{1,40}:\s*$/.test(l)) cls += ' sub';
      else if (bullet) cls += ' li';
      var div = h('div', { class: cls });
      if (bullet) {
        var depth = Math.min(4, Math.floor(bullet[1].length / 2));
        if (depth) div.classList.add('d' + depth);
        div.appendChild(h('span', { class: 'bullet' }, bullet[2].length > 1 ? bullet[2] : ''));
        div.appendChild(inline(l.slice(bullet[0].length), re));
      } else {
        div.appendChild(inline(l, re));
      }
      box.appendChild(div);
    });
    return box;
  }

  // ------------------------------------------------------------ state

  var S = {
    data: null, entries: [], byId: new Map(), sessions: [], sessionById: new Map(), tokens: new Map(),
    session: 'all', entry: null, q: '', sort: store.get('vch-sort', 'newest'),
    from: '', to: '', machine: '', author: '', has: new Set(),
    fresh: new Set(), changed: new Set(), showLimit: 200, lastVisible: []
  };
  var collapsed = new Set(store.get('vch-collapsed', []));

  var el = {
    q: D.getElementById('q'), tabs: D.getElementById('tabs'), list: D.getElementById('list'),
    detail: D.getElementById('detail'), sort: D.getElementById('sort'), from: D.getElementById('from'),
    to: D.getElementById('to'), machine: D.getElementById('machine'), author: D.getElementById('author'),
    machineField: D.getElementById('machine-field'), authorField: D.getElementById('author-field'),
    chips: D.getElementById('has-chips'), clear: D.getElementById('clear'), count: D.getElementById('count'),
    live: D.getElementById('live'), repo: D.getElementById('repo-name'), theme: D.getElementById('theme-btn'),
    help: D.getElementById('help'), helpBtn: D.getElementById('help-btn'), toast: D.getElementById('toast')
  };

  function applyData(data, isUpdate) {
    var oldRaw = new Map();
    S.entries.forEach(function (e) { oldRaw.set(e.id, e.raw); });
    S.data = data;
    S.entries = data.entries.map(function (e) { e.a = analyze(e); return e; });
    S.byId = new Map(S.entries.map(function (e) { return [e.id, e]; }));
    S.sessions = data.sessions;
    S.sessionById = new Map(S.sessions.map(function (s) { return [s.id, s]; }));
    S.tokens = buildIndex(S.entries);
    searchCache = { q: null, result: null };
    var added = [];
    if (isUpdate) {
      S.entries.forEach(function (e) {
        if (!oldRaw.has(e.id)) { S.fresh.add(e.id); added.push(e); }
        else if (oldRaw.get(e.id) !== e.raw) S.changed.add(e.id);
      });
    }
    el.repo.textContent = data.repo + (data.chatDir ? '  /  ' + data.chatDir : '');
    D.title = data.repo + ' chat history';
    buildFilterOptions();
    if (S.session !== 'all' && !S.sessionById.has(S.session)) S.session = 'all';
    if (S.entry && !S.byId.has(S.entry)) S.entry = null;
    render();
    if (isUpdate) {
      if (added.length) {
        var newest = added[added.length - 1];
        toast(plural(added.length, 'new entry', 'new entries') + ' just arrived.', 'Show', function () { go({ session: newest.session, entry: newest.id }); });
      } else if (S.changed.size) {
        toast('An entry was updated.');
      }
    }
  }

  function buildFilterOptions() {
    var machines = new Map(), authors = new Map();
    S.entries.forEach(function (e) {
      var m = e.sessionMachine || e.machine || 'not recorded';
      machines.set(m, (machines.get(m) || 0) + 1);
      var a = e.author || 'not recorded';
      authors.set(a, (authors.get(a) || 0) + 1);
    });
    fillSelect(el.machine, 'All machines', machines, S.machine);
    fillSelect(el.author, 'All authors', authors, S.author);
    el.machineField.hidden = machines.size < 2;
    el.authorField.hidden = authors.size < 2;
    if (!machines.has(S.machine)) S.machine = '';
    if (!authors.has(S.author)) S.author = '';
    clear(el.chips);
    FILTER_KEYS.forEach(function (k) {
      var n = S.entries.filter(function (e) { return e.a.has[k]; }).length;
      if (!n) return;
      el.chips.appendChild(h('button', {
        type: 'button', class: 'chip-btn k-' + k, 'aria-pressed': S.has.has(k) ? 'true' : 'false',
        title: 'Only entries with ' + SECTION_DEFS[k].title.toLowerCase() + ' (' + n + ')',
        onclick: function () { if (S.has.has(k)) S.has.delete(k); else S.has.add(k); this.setAttribute('aria-pressed', S.has.has(k) ? 'true' : 'false'); S.showLimit = 200; render(); }
      }, SECTION_DEFS[k].short));
    });
  }

  function fillSelect(sel, allLabel, map, current) {
    clear(sel);
    sel.appendChild(h('option', { value: '' }, allLabel));
    Array.from(map.keys()).sort().forEach(function (k) {
      sel.appendChild(h('option', { value: k, selected: k === current }, k + ' (' + map.get(k) + ')'));
    });
    sel.value = map.has(current) ? current : '';
  }

  // ------------------------------------------------------------ filtering

  function passesFilters(e) {
    if (S.from && (!e.date || e.date < S.from)) return false;
    if (S.to && (!e.date || e.date > S.to)) return false;
    if (S.machine && (e.sessionMachine || e.machine || 'not recorded') !== S.machine) return false;
    if (S.author && (e.author || 'not recorded') !== S.author) return false;
    var ok = true;
    S.has.forEach(function (k) { if (!e.a.has[k]) ok = false; });
    return ok;
  }

  function computeVisible() {
    var search = runSearch(S.q);
    var base = [];
    S.entries.forEach(function (e, idx) {
      if (!passesFilters(e)) return;
      if (search && !search.scores.has(idx)) return;
      base.push({ e: e, score: search ? search.scores.get(idx) : 0 });
    });
    var perSession = new Map();
    base.forEach(function (x) { perSession.set(x.e.session, (perSession.get(x.e.session) || 0) + 1); });
    var list = S.session === 'all' ? base : base.filter(function (x) { return x.e.session === S.session; });
    var order = S.entries.reduce(function (m, e, i) { m.set(e.id, i); return m; }, new Map());
    list.sort(function (a, b) {
      if (S.sort === 'match' && search) return b.score - a.score || order.get(b.e.id) - order.get(a.e.id);
      return S.sort === 'oldest' ? order.get(a.e.id) - order.get(b.e.id) : order.get(b.e.id) - order.get(a.e.id);
    });
    return { list: list.map(function (x) { return x.e; }), perSession: perSession, search: search, filtered: base.length };
  }

  function filtersActive() {
    return !!(S.q.trim() || S.from || S.to || S.machine || S.author || S.has.size);
  }

  // ------------------------------------------------------------ render

  function render() {
    var v = computeVisible();
    S.lastVisible = v.list;
    renderTabs(v);
    renderList(v);
    renderDetail(v);
    var total = S.entries.length;
    el.count.textContent = filtersActive()
      ? v.filtered + ' of ' + plural(total, 'entry', 'entries') + ' match'
      : plural(total, 'entry', 'entries') + ' in ' + plural(S.sessions.length, 'session');
    el.clear.hidden = !(S.from || S.to || S.machine || S.author || S.has.size);
  }

  function sessionLabel(s) {
    if (s.id === 'undated') return { main: 'Undated', sub: '' };
    var d = new Date(s.date + 'T00:00:00Z');
    var part = /-(\d+)$/.exec(s.id.slice(s.date.length));
    return { main: DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + (part ? ' (' + part[1] + ')' : ''), sub: s.machine || '' };
  }

  function orderedSessions() {
    var list = S.sessions.slice();
    if (S.sort !== 'oldest') list.reverse();
    return list;
  }

  function renderTabs(v) {
    var keepScroll = el.tabs.scrollLeft;
    clear(el.tabs);
    var active = filtersActive();
    function tab(id, main, sub, count, matches) {
      var selected = S.session === id;
      var b = h('a', {
        role: 'tab', class: 'tab' + (selected ? ' on' : '') + (active && !matches ? ' empty' : ''), href: hashFor({ session: id }),
        'aria-selected': selected ? 'true' : 'false', 'data-session': id,
        title: id === 'all' ? 'Every session' : 'Session ' + id
      },
      h('span', { class: 'tab-main' }, main),
      h('span', { class: 'tab-sub' }, sub ? h('span', { class: 'tab-machine' }, sub) : null,
        h('span', { class: 'tab-count' }, active ? matches + '/' + count : String(count))));
      el.tabs.appendChild(b);
      return b;
    }
    var allMatches = 0;
    v.perSession.forEach(function (n) { allMatches += n; });
    tab('all', 'All sessions', '', S.entries.length, allMatches);
    var activeTab = null;
    orderedSessions().forEach(function (s) {
      var lab = sessionLabel(s);
      var t = tab(s.id, lab.main, lab.sub, s.count, v.perSession.get(s.id) || 0);
      if (S.session === s.id) activeTab = t;
    });
    el.tabs.scrollLeft = keepScroll;
    if (activeTab && S.scrollTab) {
      S.scrollTab = false;
      activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function snippetFor(e, search) {
    var A = e.a;
    var prompts = A.sections.filter(function (s) { return s.key === 'prompts'; })[0];
    var main = A.message || (prompts ? stripFence(prompts.text) : '') || (A.sections[0] ? A.sections[0].text : '');
    if (search && search.re) {
      var texts = [main].concat(A.sections.map(function (s) { return s.text; }));
      for (var i = 0; i < texts.length; i++) {
        search.re.lastIndex = 0;
        var m = search.re.exec(texts[i]);
        if (m) {
          var t = texts[i];
          var a = Math.max(0, m.index - 70), b = Math.min(t.length, m.index + 170);
          return (a > 0 ? '...' : '') + t.slice(a, b).replace(/\s+/g, ' ') + (b < t.length ? '...' : '');
        }
      }
    }
    var flat = main.replace(/\s+/g, ' ').trim();
    return flat.length > 240 ? flat.slice(0, 240) + '...' : flat;
  }

  function renderList(v) {
    var keep = el.list.scrollTop;
    clear(el.list);
    if (S.session !== 'all') {
      var s = S.sessionById.get(S.session);
      if (s) el.list.appendChild(sessionHead(s));
    }
    if (!S.entries.length) {
      el.list.appendChild(h('div', { class: 'empty-state' },
        h('h2', null, 'No chat history yet'),
        h('p', null, 'Nothing was found in ' + (S.data ? S.data.chatDir : '.chat-history') + '. This page fills in on its own when entries are added.')));
      return;
    }
    if (!v.list.length) {
      el.list.appendChild(h('div', { class: 'empty-state' },
        h('h2', null, 'Nothing matches'),
        h('p', null, 'Try fewer words, another tab, or clear the filters.'),
        h('button', { type: 'button', class: 'text-btn', onclick: function () { resetFilters(true); } }, 'Clear search and filters')));
      return;
    }
    var ol = h('ol', { class: 'cards' });
    v.list.slice(0, S.showLimit).forEach(function (e) {
      var A = e.a;
      var badges = FILTER_KEYS.filter(function (k) { return A.has[k]; }).map(function (k) {
        var label = SECTION_DEFS[k].short;
        if (k === 'prompts' && A.promptCount > 1) label = A.promptCount + ' prompts';
        return h('span', { class: 'badge k-' + k }, label);
      });
      var sel = S.entry === e.id;
      var li = h('li', null, h('a', {
        class: 'card' + (sel ? ' on' : ''), href: hashFor({ session: S.session, entry: e.id }), 'data-entry': e.id,
        'aria-current': sel ? 'true' : null
      },
      h('div', { class: 'card-top' },
        h('time', { datetime: e.ts || '', title: localTitle(e.ts) }, fmtStamp(e)),
        S.fresh.has(e.id) ? h('span', { class: 'flag new' }, 'new') : S.changed.has(e.id) ? h('span', { class: 'flag upd' }, 'updated') : null,
        S.session === 'all' ? h('span', { class: 'card-session' }, e.sessionMachine || e.machine || '') : null),
      h('p', { class: 'card-snippet' }, marked(snippetFor(e, v.search), v.search && v.search.re)),
      h('div', { class: 'card-badges' }, badges)));
      ol.appendChild(li);
    });
    el.list.appendChild(ol);
    if (v.list.length > S.showLimit) {
      el.list.appendChild(h('button', { type: 'button', class: 'more-btn', onclick: function () { S.showLimit += 200; render(); } },
        'Show ' + Math.min(200, v.list.length - S.showLimit) + ' more of ' + (v.list.length - S.showLimit)));
    }
    el.list.scrollTop = keep;
    if (S.scrollCard) {
      S.scrollCard = false;
      var c = el.list.querySelector('.card.on');
      if (c) c.scrollIntoView({ block: 'nearest' });
    }
  }

  function sessionHead(s) {
    var span = s.date ? (fmtTime(s.start) === fmtTime(s.end) ? fmtTime(s.start) : fmtTime(s.start) + ' to ' + fmtTime(s.end)) + ' UTC' : '';
    return h('div', { class: 'session-head' },
      h('div', { class: 'sh-title' }, h('h2', null, s.id === 'undated' ? 'Undated entries' : fmtDate(s.start, true)),
        h('p', null, [s.machine || 'Machine not recorded', plural(s.count, 'entry', 'entries'), span].filter(Boolean).join(', '))),
      h('div', { class: 'sh-actions' },
        s.hasFile ? h('a', { class: 'text-btn', href: boot.rawBase + 'sessions/' + encodeURIComponent(s.file), target: '_blank', rel: 'noopener' }, 'Open session file') : null,
        copyButton('Copy link', function () { return linkFor({ session: s.id }); })));
  }

  function copyButton(label, getText) {
    return h('button', {
      type: 'button', class: 'text-btn', onclick: function () {
        var b = this, text = getText();
        var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = label; }, 1400); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this link', text); });
        else window.prompt('Copy this link', text);
      }
    }, label);
  }

  function renderDetail(v) {
    clear(el.detail);
    D.body.classList.toggle('has-entry', !!S.entry);
    if (!S.entry) { el.detail.appendChild(overview(v)); return; }
    var e = S.byId.get(S.entry);
    if (!e) { el.detail.appendChild(overview(v)); return; }
    var re = v.search && v.search.re;
    var s = S.sessionById.get(e.session);
    var inSession = s ? s.entries.indexOf(e.id) : -1;
    var idx = v.list.indexOf(e);
    var prev = idx > 0 ? v.list[idx - 1] : null;
    var next = idx >= 0 && idx < v.list.length - 1 ? v.list[idx + 1] : null;
    var chips = [
      e.sessionMachine || e.machine ? h('span', { class: 'chip', title: e.machine ? 'Machine' : 'Machine (taken from the session)' }, e.sessionMachine || e.machine) : null,
      e.author ? h('span', { class: 'chip' }, e.author) : null,
      e.role && e.role !== 'user' ? h('span', { class: 'chip' }, 'role ' + e.role) : null,
      e.commit ? h('span', { class: 'chip commit', title: e.commit.subject }, h('code', null, e.commit.hash), e.commit.subject ? ' ' + e.commit.subject : '') : null
    ];
    var art = h('article', { class: 'entry' },
      h('div', { class: 'entry-nav' },
        h('a', { class: 'back text-btn', href: hashFor({ session: S.session }) }, 'Back to list'),
        h('span', { class: 'spacer' }),
        h('a', { class: 'text-btn' + (prev ? '' : ' disabled'), href: prev ? hashFor({ session: S.session, entry: prev.id }) : null, 'aria-disabled': prev ? null : 'true', title: 'Previous (k)' }, 'Previous'),
        h('a', { class: 'text-btn' + (next ? '' : ' disabled'), href: next ? hashFor({ session: S.session, entry: next.id }) : null, 'aria-disabled': next ? null : 'true', title: 'Next (j)' }, 'Next')),
      h('header', { class: 'entry-head' },
        h('p', { class: 'crumb' },
          s ? h('a', { href: hashFor({ session: s.id }) }, s.id === 'undated' ? 'Undated' : 'Session ' + s.id) : null,
          inSession >= 0 && s ? ', entry ' + (inSession + 1) + ' of ' + s.count : ''),
        h('h2', { title: localTitle(e.ts) }, fmtStamp(e)),
        h('div', { class: 'chips-row' }, chips),
        h('div', { class: 'entry-actions' },
          copyButton('Copy link', function () { return linkFor({ session: e.session, entry: e.id }); }),
          h('button', { type: 'button', class: 'text-btn', onclick: function () { setAll(true); } }, 'Collapse all'),
          h('button', { type: 'button', class: 'text-btn', onclick: function () { setAll(false); } }, 'Expand all'))));
    if (e.a.message) art.appendChild(section('message', 'Message', null, prose(e.a.message, re)));
    e.a.sections.forEach(function (sec) {
      var body;
      if (sec.items && sec.items.length) {
        body = h('div', { class: 'items' }, sec.items.map(function (it) {
          return h('div', { class: 'item' },
            it.label || it.when ? h('div', { class: 'item-head' }, it.label ? h('span', { class: 'item-n' }, it.label) : null, it.when ? h('span', { class: 'item-when' }, it.when) : null) : null,
            h('pre', { class: 'verbatim' }, marked(it.text, re)));
        }));
      } else if (sec.key === 'prompts' || sec.key === 'replies') {
        body = h('pre', { class: 'verbatim' }, marked(stripFence(sec.text), re));
      } else {
        body = prose(sec.text, re);
      }
      var note = sec.items && sec.items.filter(function (x) { return x.label; }).length > 1 ? sec.items.filter(function (x) { return x.label; }).length + '' : null;
      art.appendChild(section(sec.key, sec.title, note, body));
    });
    art.appendChild(section('raw', 'Raw entry text', null, h('pre', { class: 'verbatim raw' }, marked(e.raw, re)), true));
    art.appendChild(h('p', { class: 'sources' }, 'Found in ' + e.sources.join(', ')));
    el.detail.appendChild(art);
    el.detail.scrollTop = 0;
  }

  function section(key, title, note, body, defaultClosed) {
    var closed = collapsed.has(key) || (defaultClosed && !collapsed.has('!' + key));
    var d = h('details', { class: 'sec k-' + key, 'data-key': key, open: !closed },
      h('summary', null, h('span', { class: 'sec-title' }, title), note ? h('span', { class: 'sec-note' }, note) : null),
      h('div', { class: 'sec-body' }, body));
    d.addEventListener('toggle', function () {
      if (key === 'raw') { if (d.open) collapsed.add('!raw'); else collapsed.delete('!raw'); }
      else if (d.open) collapsed.delete(key); else collapsed.add(key);
      store.set('vch-collapsed', Array.from(collapsed));
    });
    return d;
  }

  function setAll(close) {
    el.detail.querySelectorAll('details.sec').forEach(function (d) { d.open = !close; });
  }

  function overview(v) {
    var box = h('div', { class: 'overview' });
    if (S.session !== 'all') {
      var s = S.sessionById.get(S.session);
      if (!s) return box;
      box.appendChild(h('h2', null, s.id === 'undated' ? 'Undated entries' : 'Session ' + s.id));
      box.appendChild(h('p', { class: 'lede' }, 'Pick an entry on the left, or one of these.'));
      var ol = h('ol', { class: 'ov-list' });
      s.entries.forEach(function (id) {
        var e = S.byId.get(id);
        if (!e) return;
        ol.appendChild(h('li', null, h('a', { href: hashFor({ session: s.id, entry: id }) },
          h('span', { class: 'ov-time' }, e.hasTime ? fmtTime(e.ts) : (e.tsRaw || '')), h('span', { class: 'ov-text' }, snippetFor(e, null)))));
      });
      box.appendChild(ol);
      return box;
    }
    var d = S.data;
    box.appendChild(h('h2', null, 'Every session'));
    box.appendChild(h('p', { class: 'lede' }, plural(S.entries.length, 'entry', 'entries') + ' in ' + plural(S.sessions.length, 'session') +
      '. Sessions are grouped by UTC date and machine; a gap of more than ' + d.gapHours + ' hours starts a new one.'));
    if (d.sessionsFolder && d.sessionsFolder.stale) {
      box.appendChild(h('p', { class: 'notice' }, 'The ', h('code', null, 'sessions/'), ' folder is behind the history. Run ',
        h('code', null, 'node .claude/skills/chat-history-convention/scripts/split-sessions.mjs'), ' to refresh it.'));
    }
    var grid = h('div', { class: 'ov-grid' });
    orderedSessions().forEach(function (s) {
      var first = S.byId.get(s.entries[0]);
      var n = v.perSession.get(s.id) || 0;
      grid.appendChild(h('a', { class: 'ov-card' + (filtersActive() && !n ? ' dim' : ''), href: hashFor({ session: s.id }) },
        h('span', { class: 'ov-date' }, s.id === 'undated' ? 'Undated' : fmtDate(s.start, true)),
        h('span', { class: 'ov-meta' }, [s.machine || 'machine not recorded', plural(s.count, 'entry', 'entries'), s.date ? fmtTime(s.start) + ' to ' + fmtTime(s.end) + ' UTC' : ''].filter(Boolean).join(', ')),
        first ? h('span', { class: 'ov-first' }, snippetFor(first, null)) : null,
        filtersActive() ? h('span', { class: 'ov-match' }, n + ' matching') : null));
    });
    box.appendChild(grid);
    var main = d.sources.filter(function (x) { return x.kind !== 'session'; });
    var sessionFiles = d.sources.length - main.length;
    var src = h('p', { class: 'sources' }, 'Read from ', main.map(function (x, i) {
      return [i ? ', ' : '', h('a', { href: boot.rawBase + x.name.split('/').map(encodeURIComponent).join('/'), target: '_blank', rel: 'noopener' }, x.name), ' (' + x.entries + ')'];
    }), sessionFiles ? (main.length ? ' and ' : '') + plural(sessionFiles, 'session file') + ' in sessions/' : '',
    STATIC && d.generatedAt ? '. Exported ' + d.generatedAt.replace('T', ' ').slice(0, 16) + ' UTC.' : '.');
    box.appendChild(src);
    (d.warnings || []).forEach(function (w) { box.appendChild(h('p', { class: 'notice' }, w)); });
    return box;
  }

  // ------------------------------------------------------------ navigation (URL hash)

  function hashFor(o) {
    var p = new URLSearchParams();
    if (o.session && o.session !== 'all') p.set('session', o.session);
    if (o.entry) p.set('entry', o.entry);
    if (S.q.trim()) p.set('q', S.q.trim());
    var s = p.toString();
    return '#' + s;
  }

  function linkFor(o) {
    var p = new URLSearchParams();
    if (o.session && o.session !== 'all') p.set('session', o.session);
    if (o.entry) p.set('entry', o.entry);
    return location.href.split('#')[0] + '#' + p.toString();
  }

  function go(o) {
    var target = hashFor(o);
    if (location.hash === target) readHash();
    else location.hash = target;
  }

  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#/, ''));
    var session = p.get('session') || 'all';
    var entry = p.get('entry');
    var q = p.get('q') || '';
    if (entry && !p.get('session') && S.byId.has(entry)) session = 'all';
    var changedSession = session !== S.session;
    S.session = S.sessionById.has(session) ? session : 'all';
    S.entry = entry && S.byId.has(entry) ? entry : null;
    if (q !== S.q) { S.q = q; el.q.value = q; }
    if (changedSession) { S.showLimit = 200; S.scrollTab = true; el.list.scrollTop = 0; }
    S.scrollCard = true;
    render();
  }

  function replaceHash() {
    var target = hashFor({ session: S.session, entry: S.entry });
    if (location.hash !== target) history.replaceState(null, '', target || '#');
  }

  function resetFilters(alsoSearch) {
    S.from = S.to = S.machine = S.author = '';
    S.has.clear();
    el.from.value = el.to.value = '';
    el.machine.value = el.author.value = '';
    el.chips.querySelectorAll('[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (alsoSearch) { S.q = ''; el.q.value = ''; replaceHash(); }
    render();
  }

  function step(dir) {
    var list = S.lastVisible;
    if (!list.length) return;
    var i = S.entry ? list.findIndex(function (e) { return e.id === S.entry; }) : -1;
    var j = i < 0 ? (dir > 0 ? 0 : list.length - 1) : Math.max(0, Math.min(list.length - 1, i + dir));
    go({ session: S.session, entry: list[j].id });
  }

  function stepTab(dir) {
    var ids = ['all'].concat(orderedSessions().map(function (s) { return s.id; }));
    var i = ids.indexOf(S.session);
    var j = Math.max(0, Math.min(ids.length - 1, i + dir));
    if (j !== i) go({ session: ids[j] });
  }

  // ------------------------------------------------------------ chrome: theme, toast, help, live

  var THEMES = ['auto', 'light', 'dark'];
  function setTheme(t) {
    if (t === 'auto') D.documentElement.removeAttribute('data-theme');
    else D.documentElement.setAttribute('data-theme', t);
    el.theme.textContent = t === 'auto' ? 'Auto' : t === 'light' ? 'Light' : 'Dark';
    el.theme.setAttribute('aria-label', 'Theme: ' + el.theme.textContent + '. Click to change.');
    store.set('vch-theme', t);
  }

  var toastTimer = null;
  function toast(text, actionLabel, action) {
    clear(el.toast);
    el.toast.appendChild(h('span', null, text));
    if (actionLabel) el.toast.appendChild(h('button', { type: 'button', class: 'text-btn', onclick: function () { el.toast.hidden = true; action(); } }, actionLabel));
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 15000);
  }

  function setLive(state, text) {
    el.live.className = 'live ' + state;
    el.live.querySelector('.live-text').textContent = text;
  }

  function connect() {
    if (STATIC || typeof EventSource === 'undefined') return;
    var es = new EventSource('api/events');
    var version = S.data ? S.data.version : null;
    es.addEventListener('hello', function (ev) {
      setLive('on', 'Live');
      try { var v = JSON.parse(ev.data).version; if (version && v !== version) refresh(); version = v; } catch (e) { /* ignore */ }
    });
    es.addEventListener('update', function (ev) {
      try { version = JSON.parse(ev.data).version; } catch (e) { /* ignore */ }
      refresh();
    });
    es.onerror = function () { setLive('wait', 'Reconnecting'); };
  }

  function refresh() {
    return fetch('api/data', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (S.data && d.version === S.data.version) return;
      applyData(d, true);
      setLive('on', 'Live, updated ' + new Date().toTimeString().slice(0, 5));
    }).catch(function () { setLive('wait', 'Reconnecting'); });
  }

  // ------------------------------------------------------------ events

  var qTimer = null;
  el.q.addEventListener('input', function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      S.q = el.q.value;
      S.showLimit = 200;
      replaceHash();
      render();
    }, 120);
  });
  el.sort.value = ['newest', 'oldest', 'match'].indexOf(S.sort) >= 0 ? S.sort : 'newest';
  el.sort.addEventListener('change', function () { S.sort = el.sort.value; store.set('vch-sort', S.sort); render(); });
  el.from.addEventListener('change', function () { S.from = el.from.value; render(); });
  el.to.addEventListener('change', function () { S.to = el.to.value; render(); });
  el.machine.addEventListener('change', function () { S.machine = el.machine.value; render(); });
  el.author.addEventListener('change', function () { S.author = el.author.value; render(); });
  el.clear.addEventListener('click', function () { resetFilters(false); });
  el.theme.addEventListener('click', function () {
    var cur = store.get('vch-theme', 'auto');
    setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
  });
  el.helpBtn.addEventListener('click', function () { toggleHelp(); });
  el.tabs.addEventListener('wheel', function (ev) {
    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { el.tabs.scrollLeft += ev.deltaY; ev.preventDefault(); }
  }, { passive: false });
  window.addEventListener('hashchange', readHash);

  function toggleHelp(force) {
    var show = force != null ? force : el.help.hidden;
    el.help.hidden = !show;
    el.helpBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  D.addEventListener('keydown', function (ev) {
    var t = ev.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ((ev.key === 'k' || ev.key === 'K') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); el.q.focus(); el.q.select(); return; }
    if (ev.key === 'Escape') {
      if (!el.help.hidden) { toggleHelp(false); return; }
      if (t === el.q && el.q.value) { el.q.value = ''; S.q = ''; replaceHash(); render(); return; }
      if (t === el.q) { el.q.blur(); return; }
      if (S.entry && window.matchMedia('(max-width: 900px)').matches) { go({ session: S.session }); return; }
      return;
    }
    if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === '/') { ev.preventDefault(); el.q.focus(); el.q.select(); }
    else if (ev.key === 'j') step(1);
    else if (ev.key === 'k') step(-1);
    else if (ev.key === ']') stepTab(1);
    else if (ev.key === '[') stepTab(-1);
    else if (ev.key === 'a') go({ session: 'all' });
    else if (ev.key === '?') toggleHelp();
  });

  // ------------------------------------------------------------ start

  setTheme(store.get('vch-theme', 'auto'));
  function start(data) {
    applyData(data, false);
    readHash();
    if (STATIC) setLive('off', 'Static export');
    else connect();
  }
  if (STATIC) {
    var embedded = readJson('vch-data');
    start(embedded || { repo: '', chatDir: '', entries: [], sessions: [], sources: [], gapHours: 6, warnings: ['The embedded data could not be read.'] });
  } else {
    fetch('api/data', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(start).catch(function (err) {
      setLive('wait', 'Server not answering');
      clear(el.list);
      el.list.appendChild(h('div', { class: 'empty-state' }, h('h2', null, 'Could not load the history'), h('p', null, String(err))));
    });
  }
})();
