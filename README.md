# Balance Clinic · Spa · Beauty

Multi-page static website for Balance Clinic Spa Beauty, 8 Trimgate Street, Navan.

- `build.py` holds all copy, treatments, prices and blog posts and generates every page. Edit it, then run `python3 build.py`.
- `assets/css/site.css` and `assets/js/site.js` are shared by every page.
- Photos and clips live in `assets/img` and `assets/video`.
- `vercel.json` turns on clean URLs, so `/treatments/microneedling.html` is served at `/treatments/microneedling`.

To switch on the booking and contact forms, create a free key at web3forms.com and paste it into `WEB3FORMS_KEY` in `build.py`, then rebuild.
