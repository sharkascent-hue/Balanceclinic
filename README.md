# Balance Clinic · Spa · Beauty

Multi-page static website for Balance Clinic Spa Beauty, 8 Trimgate Street, Navan.

- `build.py` holds all copy, treatments, prices and blog posts and generates every page. Edit it, then run `python3 build.py`.
- `assets/css/site.css` and `assets/js/site.js` are shared by every page.
- Photos and clips live in `assets/img` and `assets/video`.
- `vercel.json` turns on clean URLs, so `/treatments/microneedling.html` is served at `/treatments/microneedling`.

To switch on the booking and contact forms, create a free key at web3forms.com and paste it into `WEB3FORMS_KEY` in `build.py`, then rebuild.

## Payments and orders

- `api/checkout.js` turns the basket into a Stripe Checkout payment. Prices come from `api/_catalog.json`, which `build.py` writes from the price lists, never from the browser.
- `api/admin.js` and `/admin` are the orders panel. Orders are read from Stripe, so there is no database. The clinic's status and note for each order are saved on the Stripe payment.
- Two environment variables in Vercel switch it on (Settings → Environment Variables, then redeploy):
  - `STRIPE_SECRET_KEY`: from Stripe → Developers → API keys. `sk_test_…` for practice payments, `sk_live_…` for real ones.
  - `ADMIN_PASSWORD`: the password for `/admin`, at least 10 characters.
  - Optional `SITE_URL` (e.g. `https://www.example.ie`) if the site has more than one address.
- Until the Stripe key is set, the basket offers "send as booking request" instead of payment.
- Injectables are not sold online (`OFFLINE_SECTIONS` in `build.py`). Gift voucher amounts are `VOUCHERS`.
