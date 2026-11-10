/* Shared helpers for the payment and admin functions. Files starting with "_" are not routes. */
'use strict';
const crypto = require('crypto');

const STRIPE_BASE = process.env.STRIPE_API_BASE || 'https://api.stripe.com';
const stripeKey = () => (process.env.STRIPE_SECRET_KEY || '').trim();
const adminPassword = () => (process.env.ADMIN_PASSWORD || '').trim();
/* The starter password is kept only as a one-way fingerprint (this repository is public).
   Setting ADMIN_PASSWORD in Vercel replaces it; a replacement shorter than 10 characters locks the panel. */
const STARTER = 'd8f41c818b1942e0fbb2ad0ce9fb3edcaca2e25726179d19fe4b0ebb9cd83700';
const SALT = 'bc-admin-v1';
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const tokenFor = (pw) => crypto.scryptSync(String(pw).slice(0, 200), SALT, 32).toString('hex');
let own = null;
function expected() {
  const pw = adminPassword();
  if (!pw) return STARTER;
  if (!own || own.pw !== pw) own = { pw: pw, h: sha(tokenFor(pw)) };
  return own.h;
}
const adminReady = () => !adminPassword() || adminPassword().length >= 10;
const starterPassword = () => !adminPassword();

/* Stripe takes form-encoded bodies with bracketed keys: line_items[0][price_data][currency]=eur */
function encode(obj, prefix, out) {
  out = out || [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k], key = prefix ? prefix + '[' + k + ']' : k;
    if (v === undefined || v === null) return;
    if (typeof v === 'object') encode(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  });
  return out;
}

async function stripe(method, path, params) {
  const key = stripeKey();
  if (!key) { const e = new Error('Stripe is not connected'); e.status = 503; throw e; }
  let url = STRIPE_BASE + path;
  const opts = { method: method, headers: { Authorization: 'Bearer ' + key } };
  const body = params ? encode(params).join('&') : '';
  if (method === 'GET') { if (body) url += (url.indexOf('?') > -1 ? '&' : '?') + body; }
  else { opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'; opts.body = body; }
  const r = await fetch(url, opts);
  const data = await r.json().catch(function () { return {}; });
  if (!r.ok) {
    const e = new Error((data.error && data.error.message) || 'Stripe request failed');
    e.status = r.status === 401 ? 503 : 502; e.stripe = data.error || null;
    throw e;
  }
  return data;
}

function siteUrl(req) {
  const fixed = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (fixed) return fixed;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const proto = /^(localhost|127\.)/.test(host) ? 'http' : 'https';
  return proto + '://' + host;
}

/* ----- admin session -----
   Signing in turns the password into a long token (scrypt) that only the right password can produce.
   The browser keeps it in an HttpOnly cookie; the server only ever compares its fingerprint. Nothing is stored server-side. */
const COOKIE = 'bc_admin';
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function login(req, password, hours) {
  if (!adminReady()) return null;
  const tok = tokenFor(password);
  if (!safeEqual(sha(tok), expected())) return null;
  const secure = siteUrl(req).indexOf('https://') === 0 ? '; Secure' : '';
  return COOKIE + '=' + tok + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + hours * 3600 + secure;
}
function clearCookie() { return COOKIE + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'; }
function isAdmin(req) {
  if (!adminReady()) return false;
  const m = String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([0-9a-f]{64})(?:;|$)'));
  return !!m && safeEqual(sha(m[1]), expected());
}

function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}
function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

module.exports = { stripe, stripeKey, adminReady, starterPassword, siteUrl, login, clearCookie, isAdmin, body, send };
