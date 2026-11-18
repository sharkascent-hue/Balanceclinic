/* Old addresses.
   Any address that is not a file on this site lands here (see "rewrites" in vercel.json).
   The clinic's previous website used different addresses (/product/…, /services/, /contact-us/ …) and Google still links to
   them, so each one is sent permanently (301) to the page that now covers the same thing. A page address with no closer
   match opens the home page: visitors always land on a real page. Only technical leftovers that no person visits
   (WordPress system files, old image files, feeds) get a 404. */
'use strict';
const SITE = require('./_site.json');
const PAGES = new Set(SITE.paths);
const TREATMENTS = new Set(SITE.treatments);

/* 1. Addresses known from the old site, word for word */
const EXACT = {
  'home': '/', 'services': '/price-list', 'price-list': '/price-list', 'prices': '/price-list', 'pricelist': '/price-list',
  'contact-us': '/contact', 'contact': '/contact', 'find-us': '/contact',
  'about-us': '/about', 'about-us/meet-the-team': '/about/team', 'meet-the-team': '/about/team', 'team': '/about/team',
  'online-consultation': '/book/online-consultation', 'book-an-online-consultation': '/book/online-consultation',
  'book-now': '/book', 'book-online': '/book', 'booking': '/book', 'appointments': '/book',
  'cart': '/basket', 'checkout': '/basket', 'my-account': '/', 'wishlist': '/basket',
  'gift-vouchers': '/shop/gift-vouchers', 'gift-voucher': '/shop/gift-vouchers', 'vouchers': '/shop/gift-vouchers',
  'beauty-treatments': '/treatments', 'body-treatments': '/treatments', 'skin-treatments': '/treatments', 'skin-care': '/treatments',
  'non-surgical': '/treatments', 'non-surgical-treatments': '/treatments', 'medical-grade-laser': '/laser',
  'venus-velocity': '/laser', 'laser-hair-removal': '/laser', 'hair-removal': '/laser',
  'venus-legacy': '/treatments/body-contouring', 'venus-legacy-2': '/treatments/body-contouring',
  'lycon-precision-waxing': '/treatments/waxing',
  'laser-skin-rejuvenation': '/treatments/lumenis-stellar-m22-ipl',
  'results': '/results', 'gallery': '/results', 'before-and-after': '/results',
  'blog': '/blog', 'news': '/blog',
  'privacy-policy': '/privacy', 'cookie-policy': '/privacy', 'terms-and-conditions': '/terms', 'terms-conditions': '/terms', 'refund-returns': '/terms', 'refund_returns': '/terms',
  'product-category/january-sales': '/shop/january-sale', 'product-category/skin-needling': '/treatments/microneedling',
  'product-category/gift-vouchers': '/shop/gift-vouchers',
  'product/laser-hair-removal-for-men': '/laser/men/upper-body',
  'product/laser-hair-removal-womens-full-face': '/laser/women/face',
  'product/laser-hair-removal-full-leg-bikini-underarm': '/laser/women/full-body',
  'product/stomach-sculpt': '/treatments/body-contouring', 'product/bum-lift-sculpt': '/treatments/body-contouring',
  'product/front-of-thighs-sculpt': '/treatments/body-contouring', 'product/glow-up-package': '/prices/skin-face',
  'product/25-off-4x-aumier-peels': '/treatments/alumier-md-peels',
  '2020/08/10/what-is-cellulite': '/treatments/what-is-cellulite',
  '2021/06/29/do-you-suffer-from-cellulite': '/blog/what-cellulite-really-is',
  '2021/09/02/micro-needling-skin-needling-non-surgical-therapy-skin-treatment-anti-aging-fine-lines-wrinkles': '/blog/why-microneedling-works',
  '2021/10/30/do-i-need-photo-facial-rejuvenation': '/treatments/lumenis-stellar-m22-ipl',
  '2020/10/28/what-is-peel-season': '/treatments/alumier-md-peels',
  '2021/07/29/skin-care-tips-in-your-teens-20s-30s-40s-50s-60s': '/blog/your-skin-deserves-a-reset',
  'team-members/marie-reilly': '/about/team', 'team-members/nathalie': '/about/team', 'team-members/shannen': '/about/team',
  'team-members/lucy-mcalister': '/about/team', 'team-members': '/about/team', 'gs-team-specialty/brows': '/about/team'
};

/* Old blog posts we have no copy of: send each to the article or treatment on the same subject */
const POST_RULES = [
  [/cellulite/, '/blog/what-cellulite-really-is'],
  [/micro-?needl|needling|collagen/, '/blog/why-microneedling-works'],
  [/polynucleotide|under-eye|dark-circle|tired-eye/, '/blog/polynucleotides-for-tired-eyes'],
  [/peel/, '/treatments/alumier-md-peels'],
  [/photo-facial|rejuvenation|(^|[-\/])ipl([-\/]|$)|pigment|rosacea/, '/treatments/lumenis-stellar-m22-ipl'],
  [/laser|hair-removal/, '/laser'],
  [/skin|glow|acne|spf|sun/, '/blog/your-skin-deserves-a-reset']
];

/* 2. Anything else: go by the words in the address. First rule that matches wins, so specific ones come first. */
const has = (w, re) => re.test(w);
const RULES = [
  [/^gs-team|team-member/, '/about/team'],
  [/voucher|gift/, '/shop/gift-vouchers'],
  [/laser|hair-removal|velocity/, function (w) {
    const men = /(^|-)(men|mens|male|man|beard|chest)(-|$)/.test(w), women = /women|womens|ladies|female|bikini|brazilian|hollywood/.test(w);
    if (men) return /back|shoulder|chest|stomach|arm|underarm/.test(w) ? '/laser/men/upper-body' : /leg/.test(w) ? '/laser/men/lower-body' : /full-body/.test(w) ? '/laser/men/full-body' : /beard|face|neck|ear|nose|brow/.test(w) ? '/laser/men/face' : '/laser#men';
    if (/skin-rejuvenation|rejuvenation|vein|pigment/.test(w)) return '/treatments/lumenis-stellar-m22-ipl';
    if (/bikini|brazilian|hollywood/.test(w) && !/leg|underarm/.test(w)) return '/laser/women/bikini';
    if (/full-leg|leg.*bikini|bikini.*underarm|full-body/.test(w)) return '/laser/women/full-body';
    if (/face|lip|chin|jaw|brow|neck/.test(w)) return '/laser/women/face';
    if (/underarm|arm|stomach|nipple|lower-back/.test(w)) return '/laser/women/upper-body';
    if (/leg|buttock/.test(w)) return '/laser/women/lower-body';
    return women ? '/laser#women' : '/laser';
  }],
  [/wax|lycon/, '/treatments/waxing'],
  [/massage|hot-stone|deep-tissue|swedish|pregnancy/, '/treatments/massage'],
  [/exosome/, '/treatments/microneedling-with-exosomes'],
  [/idenel|liquid-micro/, '/treatments/idenel-liquid-microneedling'],
  [/microneedl|micro-needl|needling|dermapen|biopen/, '/treatments/microneedling'],
  [/(^|[-\/])ipl([-\/]|$)|lumenis|m22|stellar|thread-vein|rosacea|pigmentation/, '/treatments/lumenis-stellar-m22-ipl'],
  [/peel|alumier/, '/treatments/alumier-md-peels'],
  [/dermalogica/, '/treatments/dermalogica-treatments'],
  [/cellulite/, '/treatments/what-is-cellulite'],
  [/venus|legacy|sculpt|contour|tighten|bum-lift|thigh|stomach|body-treat/, '/treatments/body-contouring'],
  [/anti-age|anti-ageing|antiage|hydration/, '/treatments/anti-ageing-hydration'],
  [/botox|filler|inject|wrinkle|profhilo|polynucleotide|skin-booster|lumadoc/, '/prices/injectables'],
  [/lash/, '/treatments/lashes'],
  [/(^|[-\/])brows?([-\/]|$)|eyebrow/, '/treatments/expert-brows-lashes'],
  [/pedicure|dabbs/, '/treatments/pedicure'],
  [/nail|manicure|shellac|gel-polish/, '/treatments/nails-manicure'],
  [/(^|[-\/])(tan|tanning|spray-tan)([-\/]|$)|make-up|makeup/, '/prices/beauty'],
  [/caci|facial|elemis|biotec|microdermabrasion|glow|skin/, '/prices/skin-face'],
  [/(^|[-\/])sales?([-\/]|$)|special-offer|offers|black-friday/, '/shop'],
  [/team-member|(^|[-\/])team([-\/]|$)|staff|therapist/, '/about/team'],
  [/about/, '/about'],
  [/contact|location|direction|find-us|opening/, '/contact'],
  [/consult/, '/book/online-consultation'],
  [/(^|[-\/])book(ing|ings)?([-\/]|$)|appointment/, '/book'],
  [/result|before|gallery|testimonial|review/, '/results'],
  [/privacy|cookie|gdpr/, '/privacy'],
  [/terms|refund|return|shipping|delivery/, '/terms'],
  [/price|service/, '/price-list'],
  [/product-category|product|shop|package|course/, '/price-list'],
  [/treatment|beauty/, '/treatments'],
  [/blog|news|^(category|tag|author)\//, '/blog']
];

function target(raw) {
  let p = String(raw || '');
  try { p = decodeURIComponent(p); } catch (e) {}
  p = p.split('?')[0].split('#')[0].toLowerCase().replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  if (!p) return null;
  if (/(^|[-_\/])sitemap[-_a-z0-9]*\.xml$/.test(p)) return '/sitemap.xml';         /* the old site's sitemap addresses */
  /* files and WordPress internals from the old site are simply gone */
  if (/^(wp-|xmlrpc|\.|cgi-bin|feed|comments)/.test(p) || /\/(feed|amp|embed|trackback)$/.test(p)) return null;
  if (p === 'favicon.ico') return '/assets/img/favicon.svg';
  if (/^index\.(html?|php)$/.test(p) || p === 'index') return '/';
  if (/\.(?!html?$|php$)[a-z0-9]{2,5}$/.test(p)) return null;
  p = p.replace(/\/index\.(html?|php)$/, '').replace(/\.(html?|php)$/, '').replace(/\/page\/\d+$/, '');

  if (PAGES.has('/' + p)) return '/' + p;                                  /* e.g. an .html or .php ending on a real page */
  if (Object.prototype.hasOwnProperty.call(EXACT, p)) return EXACT[p];
  const last = p.split('/').pop();
  if (TREATMENTS.has(last)) return '/treatments/' + last;                    /* the old site kept treatments at the top level */
  if (SITE.posts.indexOf(last) > -1) return '/blog/' + last;
  if (Object.prototype.hasOwnProperty.call(EXACT, last) && !/^product/.test(p)) return EXACT[last];
  if (/^\d{4}\/\d{1,2}(\/|$)/.test(p)) {                                           /* an old dated blog post */
    for (let i = 0; i < POST_RULES.length; i++) if (has(p, POST_RULES[i][0])) return POST_RULES[i][1];
    return '/blog';
  }
  for (let i = 0; i < RULES.length; i++) {
    if (has(p, RULES[i][0])) { const t = RULES[i][1]; return typeof t === 'function' ? t(p) : t; }
  }
  return '/';                                                                       /* a page we cannot place: the home page, never an error */
}

module.exports = function handler(req, res) {
  let p = req.query && req.query.p;
  if (Array.isArray(p)) p = p.join('/');
  if (p == null) p = String(req.url || '').replace(/^\/api\/lost\/?/, '');
  const to = target(p);
  if (to && to !== '/' + String(p).replace(/^\/|\/$/g, '')) {
    res.setHeader('Location', to);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(301).send('Moved to ' + to);
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(404).send(SITE.notFound);
};
module.exports.target = target;
