/* Balance Clinic · Spa · Beauty — shared behaviour */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasST = hasGsap && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.remove('no-js');

  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
             set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- living background ---------- */
  (function bg() {
    var c = document.getElementById('bgfx'); if (!c) return;
    var ctx = c.getContext('2d'); if (!ctx) return;
    var W, H, S = 0.25, t = 0, motes = [], raf, running = true;
    var blobs = [
      { col: [225, 234, 213], r: .55, ax: .12, ay: .18, sx: .8, sy: .6, a: .9 },
      { col: [169, 213, 110], r: .38, ax: .85, ay: .75, sx: 1.1, sy: .7, a: .45 },
      { col: [247, 228, 220], r: .34, ax: .6,  ay: .2,  sx: .7, sy: 1.2, a: .7 },
      { col: [141, 195, 75],  r: .3,  ax: .2,  ay: .9,  sx: .9, sy: .9, a: .28 }
    ];
    function size() {
      W = Math.max(1, Math.floor(window.innerWidth * S)); H = Math.max(1, Math.floor(window.innerHeight * S));
      c.width = W; c.height = H;
      motes = [];
      for (var i = 0; i < 26; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, r: .4 + Math.random() * 1.1, v: .03 + Math.random() * .08, p: Math.random() * 6.28 });
    }
    function draw() {
      ctx.fillStyle = '#F4F6F0'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach(function (b, i) {
        var x = (b.ax + Math.sin(t * .00022 * b.sx + i) * .14) * W;
        var y = (b.ay + Math.cos(t * .00019 * b.sy + i * 2) * .14) * H;
        var r = b.r * Math.max(W, H) * (1 + Math.sin(t * .0003 + i) * .08);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + b.col.join(',') + ',' + b.a + ')');
        g.addColorStop(1, 'rgba(' + b.col.join(',') + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      motes.forEach(function (m) {
        m.y -= m.v; m.x += Math.sin(t * .001 + m.p) * .05;
        if (m.y < -2) { m.y = H + 2; m.x = Math.random() * W; }
        ctx.fillStyle = 'rgba(28,58,42,' + (.08 + .08 * Math.sin(t * .002 + m.p)) + ')';
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
      });
    }
    function loop(now) { t = now; draw(); if (running && !reduce) raf = requestAnimationFrame(loop); }
    size(); window.addEventListener('resize', function () { size(); if (reduce) draw(); });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
    if (reduce) { t = 1000; draw(); } else raf = requestAnimationFrame(loop);
  })();

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(el, offset) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: offset || -80, duration: 1.4 });
    else { var y = el.getBoundingClientRect().top + window.scrollY + (offset || -80); window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
  }

  /* ---------- intro + page transitions ---------- */
  var intro = document.getElementById('intro'), pt = document.getElementById('pt');
  var seen = ss.get('bc-intro');
  function killIntro() { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); document.body.classList.remove('intro-on'); }
  function runIntro() {
    if (!intro) return Promise.resolve();
    if (reduce || !hasGsap || seen) { killIntro(); return Promise.resolve(); }
    ss.set('bc-intro', '1');
    document.body.classList.add('intro-on');
    if (lenis) lenis.stop();
    return new Promise(function (res) {
      var done = false;
      function finish() { if (done) return; done = true; killIntro(); if (lenis) lenis.start(); res(); }
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(intro.querySelector('.plus path'), { strokeDashoffset: 0, duration: .9, ease: 'power3.inOut' }, 0)
        .to(intro.querySelector('.word img'), { y: 0, duration: 1, ease: 'power4.out' }, .35)
        .to(intro.querySelector('.tag'), { opacity: 1, duration: .6, ease: 'power2.out' }, .8)
        .to(intro.querySelector('.mark'), { opacity: 0, y: -24, duration: .5, ease: 'power2.in' }, 1.55)
        .to(intro.querySelectorAll('.slat'), { scaleY: 0, duration: .9, ease: 'expo.inOut', stagger: { each: .06, from: 'start' } }, 1.7);
      setTimeout(finish, 3600); /* hard stop: never leave the intro on screen */
    });
  }
  function transitionIn() {
    if (!pt) return Promise.resolve();
    if (ss.get('bc-pt') !== '1' || reduce || !hasGsap) { pt.style.transform = 'translateY(101%)'; return Promise.resolve(); }
    ss.set('bc-pt', '0'); document.documentElement.classList.remove('pt-in');
    gsap.set(pt, { y: '0%', visibility: 'visible' });
    return new Promise(function (res) {
      gsap.to(pt, { y: '-101%', duration: .9, ease: 'expo.inOut', delay: .05, onComplete: function () { pt.style.visibility = 'hidden'; res(); } });
    });
  }
  function transitionOut(href) {
    if (!pt || reduce || !hasGsap) { location.href = href; return; }
    ss.set('bc-pt', '1');
    gsap.fromTo(pt, { y: '101%', visibility: 'visible' }, { y: '0%', duration: .7, ease: 'expo.inOut', onComplete: function () { location.href = href; } });
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted && pt && hasGsap) gsap.set(pt, { y: '101%', visibility: 'hidden' }); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    var href = a.getAttribute('href'); if (!href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.charAt(0) === '#') { if (href.length > 1) { e.preventDefault(); closeMenu(); scrollToEl(document.querySelector(href)); } return; }
    if (/^(https?:)?\/\//.test(href) || /^(mailto|tel|sms):/.test(href)) return;
    var hashIdx = href.indexOf('#');
    var pathPart = hashIdx > -1 ? href.slice(0, hashIdx) : href;
    var here = location.pathname.split('/').pop() || 'index.html';
    if (hashIdx > -1 && (pathPart === '' || pathPart === here)) { e.preventDefault(); closeMenu(); scrollToEl(document.querySelector(href.slice(hashIdx))); return; }
    e.preventDefault(); closeMenu(); transitionOut(href);
  });

  /* ---------- cursor + magnetic ---------- */
  if (fine && !reduce) {
    var cur = document.createElement('div'); cur.className = 'cursor'; document.body.appendChild(cur);
    var cx = -100, cy = -100, tx = -100, ty = -100, shown = false;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; cur.classList.add('on'); } });
    document.addEventListener('mouseleave', function () { cur.classList.add('hide'); });
    document.addEventListener('mouseenter', function () { cur.classList.remove('hide'); });
    (function tick() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; requestAnimationFrame(tick); })();
    document.addEventListener('mouseover', function (e) { if (e.target.closest('a,button,.ba,.phone,.media,.vidbox,summary,label')) cur.classList.add('hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest('a,button,.ba,.phone,.media,.vidbox,summary,label')) cur.classList.remove('hover'); });
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * .22 + 'px,' + y * .3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- header, menu, fab ---------- */
  var head = document.getElementById('head'), fab = document.getElementById('fab'), burger = document.getElementById('burger');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (head) head.classList.toggle('scrolled', y > 60);
    if (fab) fab.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() { if (!document.body.classList.contains('menu-open')) return; document.body.classList.remove('menu-open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); } if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeLb(); } });
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- text splitting ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    var html = el.innerHTML;
    el.innerHTML = html.split(/(<br\s*\/?>)/i).map(function (chunk) {
      if (/^<br/i.test(chunk)) return chunk;
      var tmp = document.createElement('div'); tmp.innerHTML = chunk;
      return Array.prototype.map.call(tmp.childNodes, function (n) {
        if (n.nodeType === 3) return n.textContent.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || w === '' ? w : '<span class="wd"><i>' + w + '</i></span>'; }).join('');
        var inner = n.textContent.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || w === '' ? w : '<span class="wd"><i>' + w + '</i></span>'; }).join('');
        return '<' + n.tagName.toLowerCase() + '>' + inner + '</' + n.tagName.toLowerCase() + '>';
      }).join('');
    }).join('');
  });

  /* ---------- entrance animations ---------- */
  function heroIn() {
    if (!hasGsap || reduce) return;
    var hero = document.querySelector('.hero, .phero'); if (!hero) return;
    var tl = gsap.timeline();
    var words = hero.querySelectorAll('[data-split] .wd i');
    if (words.length) tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: .05 }, 0);
    var lines = hero.querySelectorAll('h1 .inner');
    if (lines.length) tl.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: .12 }, 0);
    tl.fromTo(hero.querySelectorAll('.eyebrow, .crumbs'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: .9, ease: 'power3.out' }, .15)
      .fromTo(hero.querySelectorAll('[data-reveal]'), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .1 }, .45)
      .from(hero.querySelectorAll('.bgv, .bg'), { scale: 1.12, opacity: .4, duration: 2.2, ease: 'power2.out' }, 0);
    if (head) tl.from(head, { y: -30, opacity: 0, duration: 1, ease: 'power3.out' }, .3);
  }
  function scrollFx() {
    if (!hasST || reduce) return;
    var hero = document.querySelector('.hero, .phero');
    if (hero) {
      gsap.to(hero.querySelector('.bgv video, .bg img, .bg video') || hero, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(hero.querySelector('.content'), { y: 90, opacity: .25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero, .phero')) return;
      gsap.fromTo(el, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.closest('.hero, .phero')) return;
      var w = el.querySelectorAll('.wd i'); if (!w.length) return;
      gsap.from(w, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: .035, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    document.querySelectorAll('.split .img img, .phero .bg img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -10 }, { yPercent: 2, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    document.querySelectorAll('.bigword').forEach(function (el) {
      gsap.to(el, { x: -140, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* statement: word by word */
    var st = document.querySelector('.statement p.big');
    if (st) {
      if (!st.dataset.words) { st.dataset.words = '1'; st.innerHTML = st.innerHTML.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || !w ? w : (w.indexOf('<') > -1 ? w : '<span class="w">' + w + '</span>'); }).join(''); }
      var ws = st.querySelectorAll('.w');
      ScrollTrigger.create({ trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: function (s) { var k = Math.floor(s.progress * ws.length); ws.forEach(function (w, i) { w.classList.toggle('on', i <= k); }); } });
    }
    /* horizontal strip (desktop) */
    var strip = document.querySelector('.hstrip');
    if (strip && window.innerWidth > 900) {
      var track = strip.querySelector('.track');
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: strip.querySelector('.pin'), start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
    }
  }
  /* statement fallback when no GSAP */
  if (!hasST || reduce) { var st2 = document.querySelector('.statement p.big'); if (st2) st2.querySelectorAll('.w').forEach(function (w) { w.classList.add('on'); }); }

  /* image clip reveals */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }); }, { threshold: .15 });
    document.querySelectorAll('.reveal-img').forEach(function (el) { rio.observe(el); });
  } else document.querySelectorAll('.reveal-img').forEach(function (el) { el.classList.add('in'); });

  /* ---------- before / after scan ---------- */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var r = ba.querySelector('input'); if (!r) return;
    function set() { ba.style.setProperty('--p', r.value + '%'); }
    r.addEventListener('input', set); set();
    var active = false;
    function fromX(x) { var rect = ba.getBoundingClientRect(); var v = Math.max(0, Math.min(100, (x - rect.left) / rect.width * 100)); r.value = v; set(); }
    ba.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.full')) return;
      active = true; ba.classList.add('dragging'); ba.setPointerCapture && ba.setPointerCapture(e.pointerId); fromX(e.clientX); e.preventDefault();
    });
    ba.addEventListener('pointermove', function (e) { if (active) fromX(e.clientX); });
    function stop() { active = false; ba.classList.remove('dragging'); }
    ba.addEventListener('pointerup', stop); ba.addEventListener('pointercancel', stop); ba.addEventListener('lostpointercapture', stop);
    ba.addEventListener('touchstart', function (e) { if (!e.target.closest('.full')) { fromX(e.touches[0].clientX); } }, { passive: true });
    ba.addEventListener('touchmove', function (e) { if (e.touches.length === 1) fromX(e.touches[0].clientX); }, { passive: true });
    if (hasST && !reduce) {
      ScrollTrigger.create({ trigger: ba, start: 'top 78%', once: true, onEnter: function () {
        var o = { v: 0 };
        gsap.timeline().to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: function () { r.value = o.v; set(); } })
          .to(o, { v: 50, duration: 1.1, ease: 'power3.inOut', onUpdate: function () { r.value = o.v; set(); } });
      } });
    }
  });

  /* ---------- videos: preview + lightbox ---------- */
  var reels = document.querySelectorAll('video[data-reel]');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) { entries.forEach(function (en) { var v = en.target; if (en.isIntersecting) v.play().catch(function () {}); else v.pause(); }); }, { threshold: .3 });
    reels.forEach(function (v) { vio.observe(v); });
  } else reels.forEach(function (v) { v.play().catch(function () {}); });
  var lb = document.getElementById('lb'), lbv = lb && lb.querySelector('video'), lbi = lb && lb.querySelector('img'), lbt = lb && lb.querySelector('.t'), lbbox = lb && lb.querySelector('.box');
  function openLb(src, title, poster, isImage) {
    if (!lb) return;
    reels.forEach(function (v) { v.pause(); });
    lbbox.classList.toggle('pic', !!isImage);
    if (isImage) { lbi.src = src; lbi.hidden = false; lbi.alt = title || ''; }
    else { lbi.hidden = true; lbv.src = src; if (poster) lbv.poster = poster; lbv.muted = false; lbv.controls = true; }
    if (lbt) lbt.textContent = title || '';
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    if (!isImage) lbv.play().catch(function () {});
  }
  function closeLb() {
    if (!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    lbv.pause(); lbv.removeAttribute('src'); lbv.load(); lbi.removeAttribute('src');
    if (lenis) lenis.start();
    reels.forEach(function (v) { var rect = v.getBoundingClientRect(); if (rect.top < window.innerHeight && rect.bottom > 0) v.play().catch(function () {}); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-video]');
    if (t) { e.preventDefault(); openLb(t.getAttribute('data-video'), t.getAttribute('data-title'), t.getAttribute('data-poster')); return; }
    var im = e.target.closest('[data-image]');
    if (im) { e.preventDefault(); e.stopPropagation(); openLb(im.getAttribute('data-image'), im.getAttribute('data-title'), null, true); return; }
    if (lb && (e.target === lb || e.target.closest('#lb .x'))) closeLb();
  });

  /* ---------- reviews counter ---------- */
  var rv = document.querySelector('.reviews');
  if (rv) {
    var big = rv.querySelector('.num'), c = rv.querySelector('[data-count]');
    var countUp = function () {
      rv.classList.add('on');
      if (!hasGsap || reduce) { big.textContent = '4.9'; if (c) c.textContent = '800+'; return; }
      var o = { a: 0, b: 0 };
      gsap.to(o, { a: 4.9, b: 802, duration: 2.2, ease: 'power3.out', onUpdate: function () { big.textContent = o.a.toFixed(1); if (c) c.textContent = Math.round(o.b); }, onComplete: function () { if (c) c.textContent = '800+'; } });
    };
    if (hasST && !reduce) ScrollTrigger.create({ trigger: rv, start: 'top 65%', once: true, onEnter: countUp }); else countUp();
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(function () { b.textContent = t; });
      else b.textContent = t;
    });
  });

  /* ---------- booking / contact form ---------- */
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    var msg = f.querySelector('.msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var key = f.querySelector('[name="access_key"]');
      if (!key || !key.value || key.value.indexOf('YOUR_') === 0) {
        msg.hidden = false; msg.classList.add('err');
        msg.textContent = 'Online enquiries are not connected yet. Call (046) 906 0333 or email the clinic to book.';
        return;
      }
      var btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) { msg.hidden = false; msg.classList.toggle('err', !d.success); msg.textContent = d.success ? 'Thank you. We have your request and will confirm your appointment shortly.' : 'Something went wrong. Please call (046) 906 0333.'; if (d.success) f.reset(); })
        .catch(function () { msg.hidden = false; msg.classList.add('err'); msg.textContent = 'Could not send. Please call (046) 906 0333.'; })
        .then(function () { btn.disabled = false; });
    });
  });
  document.querySelectorAll('.opt[data-type]').forEach(function (o) {
    o.addEventListener('click', function () {
      document.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('on'); }); o.classList.add('on');
      var sel = document.getElementById('type'); if (sel) sel.value = o.getAttribute('data-type');
      scrollToEl(document.getElementById('bookform'), -110);
    });
  });

  /* ---------- boot ---------- */
  var root = document.documentElement;
  if (hasGsap && !reduce) {
    var hero0 = document.querySelector('.hero, .phero');
    if (hero0) {
      gsap.set(hero0.querySelectorAll('[data-split] .wd i, h1 .inner'), { yPercent: 115 });
      gsap.set(hero0.querySelectorAll('h1'), { opacity: 1 });
      gsap.set(hero0.querySelectorAll('[data-reveal], .eyebrow, .crumbs'), { opacity: 0 });
    }
  }
  root.classList.remove('anim');
  Promise.resolve().then(function () { return intro && !seen ? runIntro() : transitionIn(); }).then(function () {
    if (intro && seen) killIntro();
    heroIn(); scrollFx();
    if (hasST) setTimeout(function () { ScrollTrigger.refresh(); }, 400);
  });
})();
