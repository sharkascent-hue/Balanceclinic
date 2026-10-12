# Perfect · Clinic · Spa · Beauty

Multi-page static website for a clinic, spa and beauty brand.

- `build.py` holds all copy, treatments, prices, gallery and blog posts and generates every page. Edit it, then run `python3 build.py`.
- Brand name, phone, address, map link, reviews link and hero video are set at the top of `build.py`. The address, phone, rating and review count are placeholders.
- `assets/css/site.css` and `assets/js/site.js` are shared by every page.
- Photos live in `assets/img`, videos in `assets/video`.
- `vercel.json` turns on clean URLs.

To switch on the booking and contact forms, create a free key at web3forms.com and paste it into `WEB3FORMS_KEY` in `build.py`, then rebuild.
