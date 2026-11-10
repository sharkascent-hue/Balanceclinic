/* Admin back office. Talks only to /api/admin; orders themselves live in Stripe. */
(function () {
  'use strict';
  var API = '/api/admin';
  var STATUSES = [['new', 'To action'], ['contacted', 'Contacted'], ['booked', 'Booked'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
  var LABEL = {}; STATUSES.forEach(function (s) { LABEL[s[0]] = s[1]; });
  var TITLES = { dashboard: 'Dashboard', orders: 'Orders', customers: 'Customers', setup: 'Set-up' };
  var $ = function (id) { return document.getElementById(id); };
  var orders = [], filter = 'all', sample = false, state = {}, current = null, pick = 'new', pickSent = false;

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function euro(cents) { var n = cents / 100; return '€' + (n % 1 ? n.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString('en-IE')); }
  var TZ = 'Europe/Dublin', nowS = function () { return Date.now() / 1000; };
  function day(ts) { return new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: TZ }); }                 /* 2026-11-10, in Irish time */
  function shortDay(ts) { return new Date(ts * 1000).toLocaleDateString('en-IE', { timeZone: TZ, day: 'numeric', month: 'short' }); }
  function when(ts) {
    var t = new Date(ts * 1000).toLocaleTimeString('en-IE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    if (day(ts) === day(nowS())) return 'Today, ' + t;
    if (day(ts) === day(nowS() - 86400)) return 'Yesterday, ' + t;
    var y = new Date(ts * 1000).getFullYear();
    return shortDay(ts) + (y !== new Date().getFullYear() ? ' ' + y : '') + ', ' + t;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function screen(id) { ['v-load', 'v-login', 'v-locked', 'v-app'].forEach(function (v) { $(v).hidden = v !== id; }); }
  function api(method, query, body) {
    return fetch(API + (query || ''), { method: method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
  }
  var paid = function (o) { return o.total - o.refunded; };
  var toSend = function (o) { return !!o.toSend && !o.sent && o.status !== 'cancelled'; };
  var todo = function (o) { return o.status === 'new' || toSend(o); };

  /* ---------- start ---------- */
  function boot() {
    screen('v-load');
    api('GET').then(function (r) {
      if (!r.ok) throw new Error();
      state = r.d;
      if (!state.password) return screen('v-locked');
      if (!state.authed) { screen('v-login'); $('pw').focus(); return; }
      enter();
    }).catch(function () { state = { offline: true }; enter(); });   /* no server (a preview copy): show the panel with sample orders */
  }
  function enter() {
    screen('v-app'); route();
    sample = !state.stripe;
    if (!sample) return load();
    orders = sampleOrders();
    banner(state.offline ? 'Preview with sample orders. On the live site this page asks for the password and shows real orders.'
      : 'Stripe is not connected yet, so these are sample orders to show how the page works. None are real, and changes are not saved. See Set-up.', false);
    route(); render();
  }
  function load() {
    $('refresh').classList.add('spinning');
    return api('GET', '?orders=1&days=' + encodeURIComponent($('days').value)).then(function (r) {
      $('refresh').classList.remove('spinning');
      if (r.status === 401) { state.authed = false; screen('v-login'); return; }
      if (!r.ok) { orders = []; banner('Could not load orders from Stripe. Check the Stripe key in Vercel, then refresh.', true); return render(); }
      orders = r.d.orders || [];
      var warn = !!state.live && !!state.starter;
      banner(r.d.truncated ? 'Showing the most recent ' + orders.length + ' orders. Choose a shorter period to see everything in it.'
        : warn ? 'You are signed in with the starter password. Set your own before real orders arrive: see Set-up.'
        : !state.live ? 'Stripe is in test mode: these are practice orders, and no real money has moved.' : '', warn);
      render();
    }).catch(function () { $('refresh').classList.remove('spinning'); banner('Could not reach the server. Check your connection and refresh.', true); render(); });
  }
  function banner(text, warn) { var b = $('banner'); b.textContent = text; b.hidden = !text; b.classList.toggle('warn', !!warn); }

  /* ---------- pages ---------- */
  function route() {
    var v = (location.hash || '#dashboard').slice(1); if (!TITLES[v]) v = 'dashboard';
    Object.keys(TITLES).forEach(function (k) { $('p-' + k).hidden = k !== v; });
    $('title').textContent = TITLES[v];
    document.querySelectorAll('#nav a, #tabs a').forEach(function (a) { var on = a.getAttribute('data-v') === v; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('days').hidden = $('refresh').hidden = v === 'setup' || sample;
    window.scrollTo(0, 0);
  }

  function pillStatus(o) { return '<span class="pill ' + o.status + '">' + LABEL[o.status] + '</span>'; }
  function pillSend(o) { return !o.toSend ? '<span class="dash" title="Nothing to post or email">–</span>' : o.sent ? '<span class="pill sent">Sent ' + esc(shortDay(o.sent)) + '</span>' : '<span class="pill tosend">To send</span>'; }
  function orderRow(o) {
    return '<button type="button" class="tr o-cols" data-id="' + esc(o.id) + '">' +
      '<span class="c-ord"><b>' + esc(o.no) + '</b><small>' + esc(when(o.created)) + '</small></span>' +
      '<span class="c-who"><b>' + esc(o.name || 'No name given') + '</b><small>' + esc(o.phone || o.email) + '</small></span>' +
      '<span class="c-eir mono">' + esc(o.eircode || '–') + '</span>' +
      '<span class="c-items items">' + esc(o.summary) + '</span>' +
      '<span class="c-total num">' + euro(o.total) + '</span>' +
      '<span class="c-st">' + pillStatus(o) + '</span><span class="c-dl">' + pillSend(o) + '</span></button>';
  }
  var ORDER_HEAD = '<div class="tr th o-cols"><span>Order</span><span>Customer</span><span class="c-eir">Eircode</span><span>Items</span><span class="num">Total</span><span>Status</span><span>Delivery</span></div>';

  function matches(o, q) {
    if (!q) return true;
    var digits = q.replace(/\D/g, '').replace(/^0+/, '');                                                     /* 087… finds +353 87… */
    return [o.no, o.name, o.email, o.phone, o.eircode, o.summary, o.request, o.note].join(' ').toLowerCase().indexOf(q) > -1 ||
      (o.eircode || '').replace(/\s/g, '').toLowerCase().indexOf(q.replace(/\s/g, '')) > -1 ||
      (digits.length > 2 && (o.phone || '').replace(/\D/g, '').indexOf(digits) > -1);
  }

  function render() {
    var live = orders.filter(function (o) { return o.status !== 'cancelled'; });
    var sum = function (list) { return list.reduce(function (n, o) { return n + paid(o); }, 0); };
    var tNew = orders.filter(function (o) { return o.status === 'new'; }), tSend = orders.filter(toSend);
    var today = day(nowS()), tDay = live.filter(function (o) { return day(o.created) === today; }), tWeek = live.filter(function (o) { return o.created >= nowS() - 7 * 86400; });

    var n = orders.filter(todo).length;
    ['n-orders', 't-orders'].forEach(function (id) { $(id).textContent = n; $(id).hidden = !n; });
    $('n-setup').hidden = !!state.stripe && state.starter === false;

    $('tiles').innerHTML =
      '<button type="button" class="tile hot" data-go="new"><span class="k">To action</span><b>' + tNew.length + '</b><small>' + (tNew.length === 1 ? 'order needs a call' : 'orders need a call') + '</small></button>' +
      '<button type="button" class="tile" data-go="tosend"><span class="k">To send</span><b>' + tSend.length + '</b><small>' + (tSend.length === 1 ? 'order to post or email' : 'orders to post or email') + '</small></button>' +
      '<div class="tile"><span class="k">Today</span><b>' + euro(sum(tDay)) + '</b><small>' + plural(tDay.length, 'order', 'orders') + '</small></div>' +
      '<div class="tile"><span class="k">Last 7 days</span><b>' + euro(sum(tWeek)) + '</b><small>' + plural(tWeek.length, 'order', 'orders') + '</small></div>' +
      '<div class="tile"><span class="k">' + esc(sample ? 'All sample orders' : $('days').selectedOptions[0].textContent) + '</span><b>' + euro(sum(live)) + '</b><small>' + plural(live.length, 'order', 'orders') + '</small></div>';
    var list = orders.filter(todo).slice(0, 6);
    $('todo').innerHTML = list.length ? list.map(function (o) {
      return '<button type="button" data-id="' + esc(o.id) + '"><b>' + esc(o.name || o.no) + '</b><small>' + esc(o.status === 'new' ? 'Call to arrange · ' + (o.phone || o.email) : 'Send: ' + o.toSend) + '</small>' + (o.status === 'new' ? pillStatus(o) : pillSend(o)) + '</button>';
    }).join('') : '<p class="none">Nothing waiting. Every order has been dealt with.</p>';
    chart(live);
    $('latest').innerHTML = orders.length ? ORDER_HEAD + orders.slice(0, 6).map(orderRow).join('') : '<p class="none">No orders yet. They appear here as soon as someone pays.</p>';

    renderOrders(); renderCustomers(); renderSetup();
  }

  function chart(live) {
    var days = [], by = {}, max = 0, total = 0;
    live.forEach(function (o) { var d = day(o.created); by[d] = (by[d] || 0) + paid(o); });
    for (var i = 13; i >= 0; i--) { var ts = nowS() - i * 86400, v = by[day(ts)] || 0; days.push({ ts: ts, v: v }); max = Math.max(max, v); total += v; }
    $('chart').innerHTML = days.map(function (d, i) {
      return '<div title="' + esc(shortDay(d.ts) + ': ' + euro(d.v)) + '"><i class="' + (d.v ? (i === 13 ? 'today' : '') : 'zero') + '" style="height:' + (d.v ? Math.max(4, Math.round(d.v / max * 100)) : 0) + '%"></i><span>' + (i % 2 ? esc(shortDay(d.ts).split(' ')[0]) : '') + '</span></div>';
    }).join('');
    $('chart').setAttribute('aria-label', 'Takings for each of the last 14 days, ' + euro(total) + ' in total');
    $('chart-sum').textContent = euro(total);
  }

  function renderOrders() {
    var counts = { all: orders.length, tosend: orders.filter(toSend).length }; STATUSES.forEach(function (s) { counts[s[0]] = 0; }); orders.forEach(function (o) { counts[o.status]++; });
    var tabs = [['all', 'All'], ['new', 'To action'], ['tosend', 'To send'], ['contacted', 'Contacted'], ['booked', 'Booked'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
    $('chips').innerHTML = tabs.map(function (s) { return '<button type="button" class="chip' + (filter === s[0] ? ' on' : '') + '" role="tab" aria-selected="' + (filter === s[0]) + '" data-f="' + s[0] + '">' + s[1] + '<i>' + counts[s[0]] + '</i></button>'; }).join('');
    var q = $('q').value.trim().toLowerCase();
    var list = orders.filter(function (o) { return (filter === 'all' || (filter === 'tosend' ? toSend(o) : filter === 'todo' ? todo(o) : o.status === filter)) && matches(o, q); });
    $('orders').innerHTML = list.length ? ORDER_HEAD + list.map(orderRow).join('') : ''; $('orders').hidden = !list.length;
    var e = $('orders-empty'); e.hidden = !!list.length;
    e.textContent = !orders.length ? 'No orders in this period yet. They appear here as soon as someone pays.' : q ? 'No orders match that search.' : filter === 'new' ? 'Nothing waiting. Every order has been dealt with.' : filter === 'tosend' ? 'Nothing to send. Everything has gone out.' : 'No orders here.';
  }

  function customers() {
    var map = {}, out = [];
    orders.forEach(function (o) {
      var key = (o.email || o.phone || o.name || o.id).toLowerCase();
      var c = map[key]; if (!c) { c = map[key] = { name: o.name, email: o.email, phone: o.phone, eircode: o.eircode, n: 0, spent: 0, last: 0 }; out.push(c); }
      c.n++; if (o.status !== 'cancelled') c.spent += paid(o);
      if (o.created > c.last) { c.last = o.created; c.name = o.name || c.name; c.phone = o.phone || c.phone; c.eircode = o.eircode || c.eircode; }
    });
    return out.sort(function (a, b) { return b.last - a.last; });
  }
  function renderCustomers() {
    var q = $('cq').value.trim().toLowerCase();
    var list = customers().filter(function (c) { return !q || [c.name, c.email, c.phone, c.eircode].join(' ').toLowerCase().indexOf(q) > -1; });
    $('customers').innerHTML = list.length ? '<div class="tr th c-cols"><span>Customer</span><span>Phone</span><span>Email</span><span class="c-eir">Eircode</span><span class="num">Orders</span><span class="num">Spent</span><span class="c-last">Last order</span></div>' + list.map(function (c) {
      return '<button type="button" class="tr c-cols" data-find="' + esc(c.email || c.phone || c.name) + '"><span class="c-name"><b>' + esc(c.name || 'No name given') + '</b></span><span class="c-phone">' + esc(c.phone || '–') + '</span><span class="c-email">' + esc(c.email || '–') + '</span>' +
        '<span class="c-eir mono">' + esc(c.eircode || '–') + '</span><span class="c-orders num">' + c.n + '<i>' + (c.n === 1 ? ' order' : ' orders') + '</i></span><span class="c-spent num">' + euro(c.spent) + '</span><span class="c-last">' + esc(when(c.last)) + '</span></button>';
    }).join('') : ''; $('customers').hidden = !list.length;
    var e = $('customers-empty'); e.hidden = !!list.length; e.textContent = q ? 'No customers match that search.' : 'Customers appear here after their first order.';
  }

  function renderSetup() {
    var pay = $('su-pay-pill'), pw = $('su-pw-pill'), own = state.starter === false;
    pay.className = 'pill ' + (state.live ? 'ok' : state.stripe ? 'test' : 'off'); pay.textContent = state.live ? 'Live' : state.stripe ? 'Test mode' : 'Not connected';
    $('su-pay-text').textContent = state.live ? 'Stripe is connected and taking real payments.' : state.stripe ? 'Stripe is connected in test mode. Payments are practice ones: swap the key for the one starting sk_live_ to take real money.' : 'Customers cannot pay online yet. The basket offers to send a booking request instead. Three steps switch payments on:';
    $('su-pay-steps').hidden = !!state.stripe;
    pw.className = 'pill ' + (own ? 'ok' : 'test'); pw.textContent = own ? 'Your own' : 'Starter password';
    $('su-pw-text').textContent = own ? 'This page is protected by the password set in Vercel.' : 'This page uses the starter password. It is fine for looking around, but choose a stronger one of your own before real customer orders arrive:';
    $('su-pw-steps').hidden = own;
  }

  /* ---------- one order ---------- */
  function open(id) {
    current = orders.filter(function (o) { return o.id === id; })[0]; if (!current) return;
    var o = current; pick = o.status; pickSent = !!o.sent;
    $('o-no').textContent = o.no || 'Order'; $('o-date').textContent = when(o.created);
    $('o-name').textContent = o.name || 'Not given';
    link($('o-phone'), o.phone, o.phone ? 'tel:' + o.phone.replace(/[^\d+]/g, '') : '');
    link($('o-email'), o.email, o.email ? 'mailto:' + o.email : '');
    $('o-eir').textContent = o.eircode || 'Not given'; var map = $('o-map'); map.hidden = !o.eircode; if (o.eircode) map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.eircode);
    $('o-req').hidden = !o.request; $('o-req-t').textContent = o.request;
    $('o-total').textContent = euro(o.total);
    var rf = $('o-refund'); rf.hidden = !o.refunded; rf.textContent = o.refunded ? (o.refunded >= o.total ? 'Fully refunded' : euro(o.refunded) + ' refunded') : '';
    $('o-note').value = o.note; $('o-err').hidden = true;
    var st = $('o-stripe'); st.hidden = sample || !o.payment; if (o.payment) st.href = 'https://dashboard.stripe.com/' + (o.test ? 'test/' : '') + 'payments/' + encodeURIComponent(o.payment);
    statusButtons(); delivery();
    $('o-items').innerHTML = '<div class="muted"><span>' + esc(o.summary || 'Loading…') + '</span></div>';
    if (sample) items(o.items || []);
    else api('GET', '?order=' + encodeURIComponent(o.id)).then(function (r) { if (r.ok && current === o) items(r.d.items || []); });
    $('sheet').classList.add('open'); $('sheet').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function link(a, text, href) { a.textContent = text || 'Not given'; if (href) a.href = href; else a.removeAttribute('href'); }
  function items(list) { if (list.length) $('o-items').innerHTML = list.map(function (it) { return '<div><span>' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><span>' + euro(it.amount) + '</span></div>'; }).join(''); }
  function statusButtons() { $('o-status').innerHTML = STATUSES.map(function (s) { return '<button type="button" data-s="' + s[0] + '" class="' + (pick === s[0] ? 'on' : '') + '" aria-pressed="' + (pick === s[0]) + '">' + s[1] + '</button>'; }).join(''); }
  function delivery() {
    var o = current, what = $('o-deliv-what'), st = $('o-deliv-state'), btn = $('o-sent');
    if (!o.toSend) { what.textContent = 'Nothing to post or email. This order is for an appointment.'; st.hidden = true; btn.hidden = true; return; }
    what.textContent = 'To send: ' + o.toSend; st.hidden = false; btn.hidden = false;
    st.className = 'd-state ' + (pickSent ? 'done' : 'wait');
    st.textContent = pickSent ? (o.sent ? 'Sent ' + when(o.sent) : 'Marked as sent. Save to keep it.') : 'Not sent yet';
    btn.textContent = pickSent ? 'Undo: not sent' : 'Mark as sent'; btn.className = 'btn sm' + (pickSent ? ' ghost' : '');
  }
  function close() { $('sheet').classList.remove('open'); $('sheet').setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; current = null; }
  function saveOrder() {
    if (!current) return;
    var o = current, btn = $('o-save'), note = $('o-note').value.trim();
    function ok(sentAt) { o.status = pick; o.note = note; o.sent = pickSent ? (sentAt || o.sent || Math.floor(nowS())) : 0; close(); render(); }
    if (sample) return ok();
    var idle = function () { btn.disabled = false; btn.textContent = 'Save changes'; };
    var fail = function (msg) { idle(); $('o-err').textContent = msg; $('o-err').hidden = false; };
    btn.disabled = true; btn.textContent = 'Saving…'; $('o-err').hidden = true;
    api('POST', '', { action: 'update', id: o.id, status: pick, note: note, sent: pickSent }).then(function (r) {
      if (r.status === 401) { idle(); close(); state.authed = false; screen('v-login'); return; }
      if (!r.ok) return fail('That did not save. Please try again.');
      idle(); ok(r.d.sent);
    }).catch(function () { fail('That did not save. Check your connection and try again.'); });
  }

  /* ---------- export ---------- */
  function csv() {
    /* never let a spreadsheet run a cell as a formula; plain numbers and phone numbers are left alone */
    var cell = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v) && !/^[+\-]?[\d\s().-]+$/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var stamp = function (ts) { return ts ? new Date(ts * 1000).toLocaleString('en-IE', { timeZone: TZ }) : ''; };
    var rows = [['Order', 'Date', 'Name', 'Phone', 'Email', 'Eircode', 'Items', 'Paid (EUR)', 'Refunded (EUR)', 'Status', 'To send', 'Sent', 'Customer note', 'Clinic note']].concat(orders.map(function (o) {
      return [o.no, stamp(o.created), o.name, o.phone, o.email, o.eircode, o.summary, (o.total / 100).toFixed(2), (o.refunded / 100).toFixed(2), LABEL[o.status], o.toSend, stamp(o.sent), o.request, o.note];
    }));
    var blob = new Blob(['﻿' + rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'balance-orders-' + day(nowS()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ---------- sample orders, shown until Stripe is connected ---------- */
  function sampleOrders() {
    var now = Math.floor(nowS()), h = 3600, d = 24 * h;
    var mk = function (i, ago, name, phone, eir, st, list, req, clinicNote, extra) {
      extra = extra || {};
      var total = list.reduce(function (n, x) { return n + x[2] * x[1]; }, 0), send = list.filter(function (x) { return /voucher/i.test(x[0]); }).map(function (x) { return x[1] + ' × ' + x[0]; }).join('; ');
      return { id: 'sample_' + i, no: 'BC-SAMPL' + i, created: now - ago, total: total, currency: 'eur', name: name, email: name.split(' ')[0].toLowerCase() + '@example.com', phone: phone, eircode: eir,
        request: req || '', note: clinicNote || '', status: st, refunded: extra.refunded || 0, payment: '', test: true, toSend: send, sent: extra.sentAgo ? now - extra.sentAgo : 0,
        summary: list.map(function (x) { return x[1] + ' × ' + x[0]; }).join('; '), items: list.map(function (x) { return { name: x[0], qty: x[1], amount: x[2] * x[1] }; }) };
    };
    return [
      mk(1, 1 * h, 'Aoife Sample', '087 000 0001', 'C15 SMP1', 'new', [['Laser: Lip & chin (women, 6 sessions)', 1, 25900]], 'Weekday mornings suit best'),
      mk(2, 3 * h, 'Niamh Sample', '086 000 0002', 'C15 SMP2', 'new', [['Alumier MD peels & facials: Luxury Facial', 1, 17500], ['Eyebrows: Eyebrow tint', 1, 1000]], ''),
      mk(3, 7 * h, 'Ciara Sample', '085 000 0003', 'A82 SMP3', 'contacted', [['Gift voucher €100', 1, 10000]], 'For my mum, Mary. Please post it to me.'),
      mk(4, 26 * h, 'Sean Sample', '083 000 0004', 'C15 SMP4', 'contacted', [['Laser: Full back & shoulders (men, 3 sessions)', 1, 26800]], 'After 6pm if possible', 'Left a voicemail Tue 10am'),
      mk(5, 30 * h, 'Emma Sample', '087 000 0005', 'C15 SMP5', 'booked', [['Bikini: Brazilian (25 min)', 1, 5100], ['Bikini wax (10 min)', 1, 2000]], '', 'Booked Thu 2pm with Anna'),
      mk(6, 2 * d, 'Kate Sample', '086 000 0010', 'C15 SMP6', 'completed', [['Gift voucher €50', 2, 5000]], 'Email both to me please', 'Emailed both vouchers', { sentAgo: 2 * d - 3 * h }),
      mk(7, 3 * d, 'Orla Sample', '089 000 0006', 'A92 SMP7', 'booked', [['Laser: Full legs, any bikini & underarms (women, 6 sessions)', 1, 55000]], 'Saturdays only', 'Patch test Sat 11am'),
      mk(8, 5 * d, 'Grace Sample', '086 000 0007', 'C15 SMP8', 'completed', [['CACI Ultimate Anti-Ageing', 1, 13500]], ''),
      mk(9, 6 * d, 'Aoife Sample', '087 000 0001', 'C15 SMP1', 'completed', [['Bikini wax (10 min)', 1, 2000]], ''),
      mk(10, 9 * d, 'Mark Sample', '085 000 0008', 'C15 SMP9', 'completed', [['Laser: Full beard & neck (men, 1 session)', 1, 8795]], ''),
      mk(11, 12 * d, 'Laura Sample', '087 000 0009', 'K32 SMP0', 'cancelled', [['Microneedling', 1, 16000]], '', 'Not suitable after consultation, refunded', { refunded: 16000 })
    ];
  }

  /* ---------- events ---------- */
  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button'), err = $('login-err'); btn.disabled = true; btn.textContent = 'Signing in…'; err.hidden = true;
    var done = function (msg) { btn.disabled = false; btn.textContent = 'Sign in'; if (msg) { err.textContent = msg; err.hidden = false; } };
    api('POST', '', { action: 'login', password: $('pw').value }).then(function (r) {
      if (!r.ok) return done(r.d.error === 'wrong' ? 'That password is not right.' : 'Could not sign in. Please try again.');
      done(); $('pw').value = ''; state.authed = true; enter();
    }).catch(function () { done('Could not sign in. Check your connection.'); });
  });
  $('signout').addEventListener('click', function () { orders = []; api('POST', '', { action: 'logout' }).then(boot, boot); });
  $('refresh').addEventListener('click', function () { if (!sample) load(); });
  $('days').addEventListener('change', function () { if (!sample) load(); });
  $('q').addEventListener('input', renderOrders);
  $('cq').addEventListener('input', renderCustomers);
  $('csv').addEventListener('click', csv);
  window.addEventListener('hashchange', route);
  document.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-close]')) return close();
    if ((t = e.target.closest('[data-f]'))) { filter = t.getAttribute('data-f'); return renderOrders(); }
    if ((t = e.target.closest('[data-go]'))) { filter = t.getAttribute('data-go'); $('q').value = ''; renderOrders(); if (t.tagName !== 'A') location.hash = '#orders'; return; }
    if ((t = e.target.closest('[data-find]'))) { filter = 'all'; $('q').value = t.getAttribute('data-find'); renderOrders(); location.hash = '#orders'; return; }
    if ((t = e.target.closest('[data-s]'))) { pick = t.getAttribute('data-s'); return statusButtons(); }
    if ((t = e.target.closest('[data-id]'))) return open(t.getAttribute('data-id'));
  });
  $('o-sent').addEventListener('click', function () { pickSent = !pickSent; delivery(); });
  $('o-save').addEventListener('click', saveOrder);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  boot();
})();
