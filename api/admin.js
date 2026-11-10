/* Orders panel. Orders live in Stripe (each paid checkout is an order), so there is no database to run.
   GET  /api/admin                       -> { password, stripe, authed }   what is set up, and are you signed in
   GET  /api/admin?orders=1&days=90      -> { orders: [...] }              (signed in)
   GET  /api/admin?order=cs_…            -> { items: [...] }               (signed in)
   POST /api/admin { action: 'login', password } | { action: 'logout' }
   POST /api/admin { action: 'update', id, status, note }                  (signed in)
   The clinic's own status and note for an order are kept on the Stripe payment's metadata. */
'use strict';
const { stripe, stripeKey, adminPassword, adminReady, makeCookie, clearCookie, isAdmin, safeEqual, body, send } = require('./_lib');

const STATUSES = ['new', 'contacted', 'booked', 'completed', 'cancelled'];
const MAX_PAGES = 10;                       /* 10 × 100 orders per load */
const wait = (ms) => new Promise(function (r) { setTimeout(r, ms); });

function toOrder(s) {
  const pi = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent : null;
  const ch = pi && pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
  const md = Object.assign({}, s.metadata || {}, (pi && pi.metadata) || {});
  const cd = s.customer_details || {};
  const cf = (s.custom_fields || []).filter(function (f) { return f.key === 'notes'; })[0];
  return {
    id: s.id, no: md.order_no || s.client_reference_id || '', created: s.created,
    total: s.amount_total || 0, currency: s.currency || 'eur',
    name: cd.name || '', email: cd.email || '', phone: cd.phone || '',
    request: (cf && cf.text && cf.text.value) || '',
    summary: md.summary || '',
    status: STATUSES.indexOf(md.bc_status) > -1 ? md.bc_status : 'new',
    note: md.bc_note || '',
    refunded: ch ? ch.amount_refunded || 0 : 0,
    payment: pi ? pi.id : (typeof s.payment_intent === 'string' ? s.payment_intent : ''),
    test: s.livemode === false
  };
}

module.exports = async function handler(req, res) {
  try {
    const state = { password: adminReady(), stripe: !!stripeKey(), authed: isAdmin(req) };

    if (req.method === 'GET') {
      const q = req.query || {};
      if (!q.orders && !q.order) return send(res, 200, state);
      if (!state.authed) return send(res, 401, { error: 'signin' });
      if (!state.stripe) return send(res, 503, { error: 'not_connected' });

      if (q.order) {
        if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(String(q.order))) return send(res, 400, { error: 'bad_order' });
        const li = await stripe('GET', '/v1/checkout/sessions/' + q.order + '/line_items', { limit: 100 });
        return send(res, 200, { items: (li.data || []).map(function (x) { return { name: x.description, qty: x.quantity, amount: x.amount_total }; }) });
      }

      const days = Math.max(1, Math.min(3650, parseInt(q.days, 10) || 90));
      const since = Math.floor(Date.now() / 1000) - days * 86400;
      const orders = []; let after = null, more = false;
      for (let page = 0; page < MAX_PAGES; page++) {
        const params = { limit: 100, status: 'complete', created: { gte: since }, expand: ['data.payment_intent.latest_charge'] };
        if (after) params.starting_after = after;
        const r = await stripe('GET', '/v1/checkout/sessions', params);
        (r.data || []).forEach(function (s) { if (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') orders.push(toOrder(s)); });
        more = !!r.has_more;
        if (!more || !r.data || !r.data.length) break;
        after = r.data[r.data.length - 1].id;
      }
      return send(res, 200, { orders: orders, days: days, truncated: more });
    }

    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method' }); }
    const b = body(req);

    if (b.action === 'login') {
      if (!state.password) return send(res, 503, { error: 'no_password' });
      if (!safeEqual(String(b.password || ''), adminPassword())) { await wait(900); return send(res, 401, { error: 'wrong' }); }
      res.setHeader('Set-Cookie', makeCookie(req, 12));
      return send(res, 200, { ok: true });
    }
    if (b.action === 'logout') { res.setHeader('Set-Cookie', clearCookie()); return send(res, 200, { ok: true }); }

    if (b.action === 'update') {
      if (!state.authed) return send(res, 401, { error: 'signin' });
      if (!state.stripe) return send(res, 503, { error: 'not_connected' });
      const id = String(b.id || ''), status = String(b.status || ''), note = String(b.note || '').slice(0, 480);
      if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id) || STATUSES.indexOf(status) < 0) return send(res, 400, { error: 'bad_update' });
      const s = await stripe('GET', '/v1/checkout/sessions/' + id);
      const pi = typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent && s.payment_intent.id);
      if (!pi) return send(res, 400, { error: 'no_payment' });
      await stripe('POST', '/v1/payment_intents/' + pi, { metadata: { bc_status: status, bc_note: note } });
      return send(res, 200, { ok: true, status: status, note: note });
    }
    return send(res, 400, { error: 'action' });
  } catch (e) {
    return send(res, e.status || 500, { error: e.status === 503 ? 'not_connected' : 'failed' });
  }
};
