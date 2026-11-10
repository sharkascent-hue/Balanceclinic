/* Payments.
   GET  /api/checkout                 -> { payments: true|false }  (is Stripe connected?)
   GET  /api/checkout?session_id=cs_… -> the order, for the thank-you page
   POST /api/checkout { items: [{ id, qty }] } -> { url } of Stripe's secure payment page
   Prices never come from the browser: every line is looked up in the catalogue build.py writes. */
'use strict';
const crypto = require('crypto');
const { stripe, stripeKey, siteUrl, body, send } = require('./_lib');
const CATALOG = require('./_catalog.json');

const MAX_LINES = 40, MAX_QTY = 20;

function orderNo() {
  const abc = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   /* no 0/O or 1/I, so it reads cleanly over the phone */
  let s = ''; const b = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += abc[b[i] % abc.length];
  return 'BC-' + s;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const sid = String((req.query && req.query.session_id) || '');
      if (!sid) return send(res, 200, { payments: !!stripeKey() });
      if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sid)) return send(res, 400, { error: 'bad_session' });
      const s = await stripe('GET', '/v1/checkout/sessions/' + sid, { expand: ['line_items'] });
      return send(res, 200, {
        paid: s.payment_status === 'paid',
        order: (s.metadata && s.metadata.order_no) || s.client_reference_id || '',
        total: s.amount_total, currency: s.currency,
        email: (s.customer_details && s.customer_details.email) || '',
        name: (s.customer_details && s.customer_details.name) || '',
        items: ((s.line_items && s.line_items.data) || []).map(function (li) { return { name: li.description, qty: li.quantity, amount: li.amount_total }; })
      });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method' }); }
    if (!stripeKey()) return send(res, 503, { error: 'not_connected' });

    const raw = body(req).items;
    if (!Array.isArray(raw) || !raw.length) return send(res, 400, { error: 'empty' });
    if (raw.length > MAX_LINES) return send(res, 400, { error: 'too_many' });

    const lines = [], missing = [], seen = {}; let badQty = false;
    raw.forEach(function (it) {
      const id = String((it && it.id) || ''), qty = Math.floor(+(it && it.qty));
      const c = Object.prototype.hasOwnProperty.call(CATALOG, id) ? CATALOG[id] : null;
      if (!c || seen[id]) { if (!c) missing.push(id); return; }
      if (!(qty >= 1 && qty <= MAX_QTY)) { badQty = true; return; }
      seen[id] = 1; lines.push({ id: id, qty: qty, c: c });
    });
    if (missing.length) return send(res, 400, { error: 'unavailable', ids: missing });
    if (badQty || !lines.length) return send(res, 400, { error: 'bad_quantity' });

    const base = siteUrl(req), no = orderNo();
    const summary = lines.map(function (l) { return l.qty + ' × ' + l.c.n; }).join('; ');
    const meta = { order_no: no, summary: summary.slice(0, 480), bc_status: 'new' };
    const session = await stripe('POST', '/v1/checkout/sessions', {
      mode: 'payment',
      client_reference_id: no,
      success_url: base + '/thank-you?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: base + '/basket?cancelled=1',
      line_items: lines.map(function (l) {
        const pd = { name: l.c.n };
        if (l.c.d) pd.description = l.c.d;
        return { quantity: l.qty, price_data: { currency: 'eur', unit_amount: l.c.p, product_data: pd } };
      }),
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      custom_fields: [{ key: 'notes', type: 'text', optional: true, label: { type: 'custom', custom: 'Preferred times, or who a voucher is for' } }],
      custom_text: { submit: { message: 'We will call you to arrange your appointment. Laser courses start with a patch test.' } },
      metadata: meta,
      payment_intent_data: { description: 'Balance Clinic order ' + no, metadata: meta }
    });
    return send(res, 200, { url: session.url });
  } catch (e) {
    return send(res, e.status || 500, { error: e.status === 503 ? 'not_connected' : 'failed' });
  }
};
