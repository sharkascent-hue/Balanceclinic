/* Gift vouchers.
   GET /api/voucher?s=cs_…              -> the vouchers in a paid order (the thank-you page and the admin use this)
   GET /api/voucher?o=BC-XXXXXX&t=token -> the same, from the private link in the buyer's receipt
   Only paid orders give a voucher. A fully refunded order shows as cancelled. Values come from the catalogue, never the browser. */
'use strict';
const crypto = require('crypto');
const { stripe, send } = require('./_lib');
const CATALOG = require('./_catalog.json');

/* voucher name on the receipt -> face value in euro ("Black Friday gift voucher, €50 value" -> 50) */
const VALUE = {};
Object.keys(CATALOG).forEach(function (id) { if (CATALOG[id].v) VALUE[CATALOG[id].n] = CATALOG[id].v; });
const YEARS_VALID = 5;

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function sessionFor(q) {
  const expand = ['line_items', 'payment_intent.latest_charge'];
  if (q.s) {
    if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(q.s)) return null;
    return stripe('GET', '/v1/checkout/sessions/' + q.s, { expand: expand });
  }
  if (!/^BC-[A-Z0-9]{6}$/.test(q.o || '') || !/^[a-f0-9]{18}$/.test(q.t || '')) return null;
  const found = await stripe('GET', '/v1/payment_intents/search', { query: "metadata['order_no']:'" + q.o + "'", limit: 1 });
  const pi = found.data && found.data[0];
  if (!pi || !pi.metadata || !same(pi.metadata.vtok || '', q.t)) return null;
  const list = await stripe('GET', '/v1/checkout/sessions', { payment_intent: pi.id, limit: 1, expand: expand.map(function (e) { return 'data.' + e; }) });
  return (list.data && list.data[0]) || null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'method' }); }
  try {
    const q = req.query || {};
    const s = await sessionFor({ s: String(q.s || ''), o: String(q.o || '').toUpperCase(), t: String(q.t || '').toLowerCase() });
    if (!s || s.payment_status !== 'paid') return send(res, 404, { error: 'not_found' });

    const values = [];
    ((s.line_items && s.line_items.data) || []).forEach(function (li) {
      const v = VALUE[li.description];
      if (v) for (let i = 0; i < li.quantity; i++) values.push(v);
    });
    if (!values.length) return send(res, 404, { error: 'no_voucher' });

    const pi = s.payment_intent || {}, charge = (pi && pi.latest_charge) || {};
    const refunded = !!charge.refunded || (charge.amount_refunded && charge.amount_refunded >= charge.amount);
    const field = function (key) { const f = (s.custom_fields || []).filter(function (x) { return x.key === key; })[0]; return (f && f.text && f.text.value) || ''; };
    const no = (s.metadata && s.metadata.order_no) || s.client_reference_id || '';
    const bought = new Date(s.created * 1000), until = new Date(bought); until.setFullYear(until.getFullYear() + YEARS_VALID);

    return send(res, 200, {
      order: no,
      bought: bought.toISOString(),
      expires: until.toISOString(),
      from: (s.customer_details && s.customer_details.name) || '',
      to: field('vfor'),
      message: field('notes'),
      cancelled: refunded,
      test: s.livemode === false,
      vouchers: values.map(function (v, i) { return { code: values.length > 1 ? no + '-' + (i + 1) : no, value: v }; })
    });
  } catch (e) {
    return send(res, e.status === 503 ? 503 : 502, { error: e.status === 503 ? 'not_connected' : 'failed' });
  }
};
