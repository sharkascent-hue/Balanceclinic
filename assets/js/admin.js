/* Orders panel. Talks only to /api/admin; orders themselves live in Stripe. */
(function () {
  'use strict';
  var API = '/api/admin';
  var STATUSES = [['new', 'To action'], ['contacted', 'Contacted'], ['booked', 'Booked'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
  var LABEL = {}; STATUSES.forEach(function (s) { LABEL[s[0]] = s[1]; });
  var $ = function (id) { return document.getElementById(id); };
  var orders = [], filter = 'new', sample = false, state = {}, current = null, pick = 'new';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function euro(cents) { var n = cents / 100; return '€' + (n % 1 ? n.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString('en-IE')); }
  var TZ = 'Europe/Dublin';
  function day(ts) { return new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: TZ }); }                 /* 2026-11-10, in Irish time */
  function when(ts) {
    var d = new Date(ts * 1000), t = d.toLocaleTimeString('en-IE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    var today = day(Date.now() / 1000), y = day(Date.now() / 1000 - 86400);
    if (day(ts) === today) return 'Today, ' + t;
    if (day(ts) === y) return 'Yesterday, ' + t;
    return d.toLocaleDateString('en-IE', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + t;
  }
  function show(id) { ['v-load', 'v-login', 'v-setup', 'v-orders'].forEach(function (v) { $(v).hidden = v !== id; }); $('top-actions').hidden = id !== 'v-orders' || sample; }
  function api(method, query, body) {
    return fetch(API + (query || ''), { method: method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
  }

  /* ---------- which screen ---------- */
  function boot() {
    show('v-load');
    api('GET').then(function (r) {
      if (!r.ok) throw new Error();
      state = r.d;
      if (!state.password) return setup();
      if (!state.authed) { show('v-login'); $('pw').focus(); return; }
      if (!state.stripe) return setup();
      load();
    }).catch(function () { state = {}; setup(true); });
  }
  function setup(offline) {
    $('step-pw').classList.toggle('done', !!state.password);
    $('step-stripe').classList.toggle('done', !!state.stripe);
    $('setup-title').textContent = state.password && !state.stripe ? 'Connect Stripe' : 'Finish setting up';
    if (offline) $('setup-lead').textContent = 'The orders service is not reachable from this page. On the live site, two settings switch on payments and this page, under the Vercel project\'s Settings → Environment Variables.';
    show('v-setup');
  }

  /* ---------- orders ---------- */
  function load() {
    $('refresh').classList.add('spinning');
    return api('GET', '?orders=1&days=' + encodeURIComponent($('days').value)).then(function (r) {
      $('refresh').classList.remove('spinning');
      if (r.status === 401) { state.authed = false; show('v-login'); return; }
      if (!r.ok) { banner('Could not load orders from Stripe. Check the Stripe key in Vercel, then refresh.', true); orders = []; show('v-orders'); return render(); }
      orders = r.d.orders || [];
      var test = orders.some(function (o) { return o.test; });
      banner(r.d.truncated ? 'Showing the most recent ' + orders.length + ' orders. Choose a shorter period to see everything in it.' : test ? 'Stripe is in test mode: these are practice orders, and no real money has moved.' : '', false);
      show('v-orders'); render();
    }).catch(function () { $('refresh').classList.remove('spinning'); banner('Could not reach the server. Check your connection and refresh.', true); show('v-orders'); render(); });
  }
  function banner(text, warn) { var b = $('banner'); b.textContent = text; b.hidden = !text; b.classList.toggle('warn', !!warn); }

  function matches(o) {
    var q = $('q').value.trim().toLowerCase();
    if (!q) return true;
    return [o.no, o.name, o.email, o.phone, o.summary, o.request, o.note].join(' ').toLowerCase().indexOf(q) > -1 || (o.phone || '').replace(/\D/g, '').indexOf(q.replace(/\D/g, '').replace(/^0+/, '') || '~') > -1;   /* 087… finds +353 87… */
  }
  function render() {
    var today = day(Date.now() / 1000), week = Date.now() / 1000 - 7 * 86400;
    var sum = function (list) { return list.reduce(function (n, o) { return n + o.total - o.refunded; }, 0); };
    var live = orders.filter(function (o) { return o.status !== 'cancelled'; });
    var tNew = orders.filter(function (o) { return o.status === 'new'; }), tDay = live.filter(function (o) { return day(o.created) === today; }), tWeek = live.filter(function (o) { return o.created >= week; });
    $('tiles').innerHTML =
      '<div class="tile hot"><span class="k">To action</span><b>' + tNew.length + '</b><small>' + (tNew.length === 1 ? 'order needs a call' : 'orders need a call') + '</small></div>' +
      '<div class="tile"><span class="k">Today</span><b>' + euro(sum(tDay)) + '</b><small>' + tDay.length + (tDay.length === 1 ? ' order' : ' orders') + '</small></div>' +
      '<div class="tile"><span class="k">Last 7 days</span><b>' + euro(sum(tWeek)) + '</b><small>' + tWeek.length + (tWeek.length === 1 ? ' order' : ' orders') + '</small></div>' +
      '<div class="tile"><span class="k">' + esc($('days').selectedOptions[0].textContent) + '</span><b>' + euro(sum(live)) + '</b><small>' + live.length + (live.length === 1 ? ' order' : ' orders') + '</small></div>';

    var counts = { all: orders.length }; STATUSES.forEach(function (s) { counts[s[0]] = 0; }); orders.forEach(function (o) { counts[o.status]++; });
    $('chips').innerHTML = STATUSES.concat([['all', 'All']]).map(function (s) {
      return '<button type="button" class="chip' + (filter === s[0] ? ' on' : '') + '" role="tab" aria-selected="' + (filter === s[0]) + '" data-f="' + s[0] + '">' + s[1] + '<i>' + counts[s[0]] + '</i></button>';
    }).join('');

    var list = orders.filter(function (o) { return (filter === 'all' || o.status === filter) && matches(o); });
    $('list').innerHTML = list.map(function (o) {
      return '<button type="button" class="row" data-id="' + esc(o.id) + '">' +
        '<span class="a"><b>' + esc(o.name || 'No name given') + '</b><small>' + esc(o.no) + ' · ' + esc(when(o.created)) + '</small></span>' +
        '<span class="s">' + esc(o.summary) + '</span>' +
        '<span class="t">' + euro(o.total) + '</span>' +
        '<span class="p"><span class="pill ' + o.status + '">' + LABEL[o.status] + '</span></span></button>';
    }).join('');
    var e = $('empty'); e.hidden = !!list.length;
    e.textContent = !orders.length ? 'No orders in this period yet. They appear here as soon as someone pays.' : $('q').value.trim() ? 'No orders match that search.' : filter === 'new' ? 'Nothing waiting. Every order has been dealt with.' : 'No orders with this status.';
  }

  /* ---------- one order ---------- */
  function open(id) {
    current = orders.filter(function (o) { return o.id === id; })[0]; if (!current) return;
    var o = current; pick = o.status;
    $('o-no').textContent = o.no || 'Order'; $('o-date').textContent = when(o.created);
    $('o-name').textContent = o.name || 'No name given';
    var ph = $('o-phone'), em = $('o-email');
    ph.textContent = o.phone; ph.hidden = !o.phone; if (o.phone) ph.href = 'tel:' + o.phone.replace(/[^\d+]/g, '');
    em.textContent = o.email; em.hidden = !o.email; if (o.email) em.href = 'mailto:' + o.email;
    $('o-req').hidden = !o.request; $('o-req-t').textContent = o.request;
    $('o-total').textContent = euro(o.total);
    var rf = $('o-refund'); rf.hidden = !o.refunded; rf.textContent = o.refunded ? (o.refunded >= o.total ? 'Fully refunded' : euro(o.refunded) + ' refunded') : '';
    $('o-note').value = o.note; $('o-err').hidden = true;
    var st = $('o-stripe'); st.hidden = sample || !o.payment; if (o.payment) st.href = 'https://dashboard.stripe.com/' + (o.test ? 'test/' : '') + 'payments/' + encodeURIComponent(o.payment);
    statusButtons();
    $('o-items').innerHTML = '<div class="muted"><span>' + esc(o.summary || 'Loading…') + '</span></div>';
    if (sample) items(o.items || []);
    else api('GET', '?order=' + encodeURIComponent(o.id)).then(function (r) { if (r.ok && current === o) items(r.d.items || []); });
    $('sheet').classList.add('open'); $('sheet').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function items(list) { if (list.length) $('o-items').innerHTML = list.map(function (it) { return '<div><span>' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><span>' + euro(it.amount) + '</span></div>'; }).join(''); }
  function statusButtons() { $('o-status').innerHTML = STATUSES.map(function (s) { return '<button type="button" data-s="' + s[0] + '" class="' + (pick === s[0] ? 'on' : '') + '" aria-pressed="' + (pick === s[0]) + '">' + s[1] + '</button>'; }).join(''); }
  function close() { $('sheet').classList.remove('open'); $('sheet').setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; current = null; }
  function saveOrder() {
    if (!current) return;
    var o = current, note = $('o-note').value.trim(), btn = $('o-save');
    function ok() { o.status = pick; o.note = note; close(); render(); }
    if (sample) return ok();
    btn.disabled = true; btn.textContent = 'Saving…'; $('o-err').hidden = true;
    api('POST', '', { action: 'update', id: o.id, status: pick, note: note }).then(function (r) {
      btn.disabled = false; btn.textContent = 'Save';
      if (r.status === 401) { close(); state.authed = false; show('v-login'); return; }
      if (!r.ok) { $('o-err').textContent = 'That did not save. Please try again.'; $('o-err').hidden = false; return; }
      ok();
    }).catch(function () { btn.disabled = false; btn.textContent = 'Save'; $('o-err').textContent = 'That did not save. Check your connection and try again.'; $('o-err').hidden = false; });
  }

  /* ---------- export ---------- */
  function csv() {
    var cell = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v) && !/^[+\-]?[\d\s().-]+$/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };   /* never let a spreadsheet run a cell as a formula */
    var rows = [['Order', 'Date', 'Name', 'Phone', 'Email', 'Items', 'Paid (EUR)', 'Refunded (EUR)', 'Status', 'Customer note', 'Clinic note']].concat(orders.map(function (o) {
      return [o.no, new Date(o.created * 1000).toLocaleString('en-IE', { timeZone: TZ }), o.name, o.phone, o.email, o.summary, (o.total / 100).toFixed(2), (o.refunded / 100).toFixed(2), LABEL[o.status], o.request, o.note];
    }));
    var blob = new Blob(['﻿' + rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'balance-orders-' + day(Date.now() / 1000) + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ---------- sample orders, so the page can be seen before Stripe is connected ---------- */
  function sampleOrders() {
    var now = Math.floor(Date.now() / 1000), h = 3600;
    var mk = function (i, ago, name, phone, st, list, req, note, refunded) {
      var total = list.reduce(function (n, x) { return n + x[2] * x[1]; }, 0);
      return { id: 'sample_' + i, no: 'BC-SAMPLE' + i, created: now - ago, total: total, currency: 'eur', name: name, email: name.split(' ')[0].toLowerCase() + '@example.com', phone: phone,
        request: req || '', note: note || '', status: st, refunded: refunded || 0, payment: '', test: true,
        summary: list.map(function (x) { return x[1] + ' × ' + x[0]; }).join('; '), items: list.map(function (x) { return { name: x[0], qty: x[1], amount: x[2] * x[1] }; }) };
    };
    return [
      mk(1, 1 * h, 'Aoife Sample', '087 000 0001', 'new', [['Laser: Lip & chin (women, 6 sessions)', 1, 25900]], 'Weekday mornings suit best'),
      mk(2, 3 * h, 'Niamh Sample', '086 000 0002', 'new', [['Alumier MD peels & facials: Luxury Facial', 1, 17500], ['Eyebrows: Eyebrow tint', 1, 1000]], ''),
      mk(3, 7 * h, 'Ciara Sample', '085 000 0003', 'new', [['Gift voucher €100', 1, 10000]], 'Voucher is for my mum, Mary. Please email it to me.'),
      mk(4, 26 * h, 'Sean Sample', '083 000 0004', 'contacted', [['Laser: Full back & shoulders (men, 3 sessions)', 1, 26800]], 'After 6pm if possible', 'Left a voicemail Tue 10am'),
      mk(5, 30 * h, 'Emma Sample', '087 000 0005', 'booked', [['Bikini: Brazilian (25 min)', 1, 5100], ['Bikini wax (10 min)', 1, 2000]], '', 'Booked Thu 2pm with Anna'),
      mk(6, 3 * 24 * h, 'Orla Sample', '089 000 0006', 'booked', [['Laser: Full legs, any bikini & underarms (women, 6 sessions)', 1, 55000]], 'Saturdays only', 'Patch test Sat 11am'),
      mk(7, 5 * 24 * h, 'Grace Sample', '086 000 0007', 'completed', [['CACI Ultimate Anti-Ageing', 1, 13500]], ''),
      mk(8, 9 * 24 * h, 'Mark Sample', '085 000 0008', 'completed', [['Laser: Full beard & neck (men, 1 session)', 1, 8795]], ''),
      mk(9, 12 * 24 * h, 'Laura Sample', '087 000 0009', 'cancelled', [['Microneedling', 1, 16000]], '', 'Not suitable after consultation, refunded', 16000)
    ];
  }

  /* ---------- events ---------- */
  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button'), err = $('login-err'); btn.disabled = true; err.hidden = true;
    api('POST', '', { action: 'login', password: $('pw').value }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) { err.textContent = r.d.error === 'wrong' ? 'That password is not right.' : 'Could not sign in. Please try again.'; err.hidden = false; return; }
      $('pw').value = ''; state.authed = true; if (!state.stripe) return setup(); load();
    }).catch(function () { btn.disabled = false; err.textContent = 'Could not sign in. Check your connection.'; err.hidden = false; });
  });
  $('signout').addEventListener('click', function () { api('POST', '', { action: 'logout' }).then(boot, boot); });
  $('refresh').addEventListener('click', load);
  $('days').addEventListener('change', function () { if (sample) render(); else load(); });
  $('q').addEventListener('input', render);
  $('csv').addEventListener('click', csv);
  $('sample').addEventListener('click', function () {
    sample = true; orders = sampleOrders(); filter = 'new';
    banner('Sample orders, so you can see how this page works. None of these are real, and changes here are not saved.', false);
    show('v-orders'); render();
  });
  $('chips').addEventListener('click', function (e) { var c = e.target.closest('[data-f]'); if (c) { filter = c.getAttribute('data-f'); render(); } });
  $('list').addEventListener('click', function (e) { var r = e.target.closest('[data-id]'); if (r) open(r.getAttribute('data-id')); });
  $('o-status').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (b) { pick = b.getAttribute('data-s'); statusButtons(); } });
  $('o-save').addEventListener('click', saveOrder);
  $('sheet').addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  boot();
})();
