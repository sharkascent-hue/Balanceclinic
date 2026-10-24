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

  /* ---------- living background: silk folds (WebGL) ---------- */
  var scrollVel = 0;   /* fed by the smooth-scroll block below */
  (function bg() {
    var c = document.getElementById('bgfx'); if (!c) return;
    var gl = null;
    try { gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }) || c.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return;   /* body background (cream) shows instead */
    var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform vec2 uRes;uniform float uTime;uniform float uAmp;uniform float uPhase;uniform vec2 uMouse;',
      'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}',
      'float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}',
      /* height of the cloth: long diagonal folds, bent by slow noise */
      'float H(vec2 p){float t=uTime*.07;vec2 q=p;q.y+=uPhase;',
      ' float n=snoise(q*.55+vec2(t*.35,-t*.25))+.5*snoise(q*1.1-vec2(t*.2,t*.3)+4.);',
      ' float f=sin(q.x*2.7+q.y*1.55+n*1.5+t*1.3);',
      ' f+=.5*sin(q.x*-1.5+q.y*2.8+n*1.2-t*.9);',
      ' f+=.16*sin(q.x*5.2-q.y*.9+n*2.+t*1.7);',
      ' return f*(1.+uAmp*.6);}',
      'void main(){vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y)*1.45;',
      ' float e=.006;float h0=H(p);float hx=H(p+vec2(e,0.));float hy=H(p+vec2(0.,e));',
      ' vec3 N=normalize(vec3(-(hx-h0)/e*.17,-(hy-h0)/e*.17,1.));',
      ' vec3 L=normalize(vec3((uMouse.x-.5)*.9-.35,(uMouse.y-.5)*.9+.55,.75));',
      ' float dif=dot(N,L)*.5+.5;vec3 Hh=normalize(L+vec3(0.,0.,1.));float nh=max(dot(N,Hh),0.);',
      ' float sheen=pow(nh,10.)*.5+pow(nh,70.)*.75;',
      ' vec3 shadow=vec3(.83,.825,.81),base=vec3(.955,.953,.943),blush=vec3(.968,.92,.9),sage=vec3(.915,.935,.89);',
      ' float tint=snoise(p*.35+uTime*.01);',
      ' vec3 cloth=mix(base,blush,smoothstep(.15,.9,tint)*.55);cloth=mix(cloth,sage,smoothstep(.15,.9,-tint)*.5);',
      ' vec3 col=mix(shadow,cloth,smoothstep(.22,.82,dif));',
      ' col+=sheen*mix(vec3(1.,.995,.98),vec3(.95,.98,.9),.2)*.55;',
      ' col=mix(col,vec3(.957,.965,.941),smoothstep(.45,1.25,length(uv-vec2(.5,.55)))*.25);',
      ' gl_FragColor=vec4(min(col,vec3(1.)),1.);}'
    ].join('\n');
    function sh(type, src) { var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uAmp', 'uPhase', 'uMouse'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    var S, W, H, mx = .5, my = .5, tmx = .5, tmy = .5, amp = 0, phase = 0, last = 0, running = true, raf;
    function size() { S = Math.min(.55, 1000 / Math.max(window.innerWidth, 1)); W = Math.max(1, Math.floor(window.innerWidth * S)); H = Math.max(1, Math.floor(window.innerHeight * S)); c.width = W; c.height = H; gl.viewport(0, 0, W, H); gl.uniform2f(U.uRes, W, H); }
    window.addEventListener('resize', function () { size(); if (reduce) draw(4000); });
    window.addEventListener('pointermove', function (e) { tmx = e.clientX / window.innerWidth; tmy = 1 - e.clientY / window.innerHeight; }, { passive: true });
    function draw(now) {
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      var sv = Math.max(-2, Math.min(2, scrollVel || 0));
      mx += (tmx - mx) * .035; my += (tmy - my) * .035;
      amp += (Math.min(Math.abs(sv), 1.2) - amp) * .06;
      phase += sv * dt * .9;
      gl.uniform1f(U.uTime, now * .001); gl.uniform1f(U.uAmp, amp); gl.uniform1f(U.uPhase, phase); gl.uniform2f(U.uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop(now) { draw(now); if (running && !reduce) raf = requestAnimationFrame(loop); }
    size();
    document.addEventListener('visibilitychange', function () { running = !document.hidden; last = 0; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
    if (reduce) draw(4000); else raf = requestAnimationFrame(loop);
    document.documentElement.classList.add('webgl');
  })();

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', function (e) { scrollVel = (e.velocity || 0) / 40; if (hasST) ScrollTrigger.update(); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(el, offset) {
    if (!el) return;
    if (!offset) offset = -(parseFloat(getComputedStyle(el).scrollMarginTop) || 80);
    if (lenis) lenis.scrollTo(el, { offset: offset, duration: 1.4 });
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
    if (hashIdx > -1 && (pathPart === '' || new URL(pathPart, location.href).pathname === location.pathname)) { e.preventDefault(); closeMenu(); scrollToEl(document.querySelector(href.slice(hashIdx))); return; }
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
  }
  function magnet(scope) {
    if (!fine || reduce) return;
    scope.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * .22 + 'px,' + y * .3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }
  magnet(document);

  /* ---------- header, menu, fab ---------- */
  var head = document.getElementById('head'), fab = document.getElementById('fab'), burger = document.getElementById('burger');
  var lastY = window.scrollY, lastT = performance.now();
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (!lenis) { var now = performance.now(); scrollVel = (y - lastY) / Math.max(16, now - lastT) * 0.6; lastY = y; lastT = now; clearTimeout(onScroll._t); onScroll._t = setTimeout(function () { scrollVel = 0; }, 80); }
    if (head) head.classList.toggle('scrolled', y > 60);
    if (fab) fab.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* phone menu: slide-in sub-menus (runs before the page-transition link handler) */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-panel]');
    if (o && o.closest('.menu')) {
      var pnl = document.getElementById(o.getAttribute('data-panel'));
      if (pnl) {
        e.preventDefault(); e.stopPropagation();
        var m = document.getElementById('menu'); if (m) { m.scrollTop = 0; m.scrollLeft = 0; }
        pnl.scrollTop = 0; pnl.classList.add('open'); pnl.setAttribute('aria-hidden', 'false');
        var b = pnl.querySelector('.mback'); if (b) setTimeout(function () { b.focus({ preventScroll: true }); }, 300);
      }
      return;
    }
    var bk = e.target.closest('[data-back]');
    if (bk) { e.preventDefault(); e.stopPropagation(); var cp = bk.closest('.mpanel'); if (cp) { cp.classList.remove('open'); cp.setAttribute('aria-hidden', 'true'); } }
  }, true);

  /* tabs (laser: women / men) */
  function initTabs(scope) { scope.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var btns = wrap.querySelectorAll('[data-tab]');
    function show(id) {
      btns.forEach(function (x) { var on = x.getAttribute('data-tab') === id; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      document.querySelectorAll('[data-tabpanel]').forEach(function (p) { p.hidden = p.getAttribute('data-tabpanel') !== id; });
      if (hasST) ScrollTrigger.refresh();
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab')); }); });
    var h = (location.hash || '').slice(1);
    if (h && wrap.querySelector('[data-tab="' + h + '"]')) show(h);
  }); }
  initTabs(document);

  /* price tabs: bring the current tab into view */
  document.querySelectorAll('.pchips').forEach(function (bar) {
    var on = bar.querySelector('a.on'); if (!on) return;
    bar.scrollLeft += on.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - on.clientWidth) / 2;
  });

  /* price list: live search and active section chip */
  (function priceList() {
    var inp = document.getElementById('price-search'); if (!inp) return;
    var secs = document.querySelectorAll('.psec');
    inp.addEventListener('input', function () {
      /* look sections up each time: the tabs swap them in place */
      var q = inp.value.trim().toLowerCase(), any = false;
      var empty = document.querySelector('.pempty'), secs = document.querySelectorAll('.psec');
      secs.forEach(function (sec) {
        var secAny = false;
        sec.querySelectorAll('.pgroup').forEach(function (g) {
          var gname = g.querySelector('h3').textContent.toLowerCase(), gAny = false;
          g.querySelectorAll('tr').forEach(function (tr) {
            var hit = !q || gname.indexOf(q) > -1 || tr.textContent.toLowerCase().indexOf(q) > -1;
            tr.hidden = !hit; if (hit) gAny = true;
          });
          g.hidden = !gAny; if (gAny) { secAny = true; g.style.opacity = ''; g.style.transform = ''; }
        });
        sec.hidden = !secAny; if (secAny) any = true;
      });
      var lp = document.querySelectorAll('.lgrid[data-tabpanel]');
      if (lp.length) {
        lp.forEach(function (p) {
          var pAny = false;
          p.querySelectorAll('.hcard[data-search]').forEach(function (c) { var hit = !q || c.getAttribute('data-search').indexOf(q) > -1; c.hidden = !hit; if (hit) pAny = true; });
          if (q) { p.hidden = !pAny; if (pAny) any = true; }
        });
        if (!q) { var onTab = document.querySelector('[data-tabs] .ltab.on'); lp.forEach(function (p) { p.hidden = !!onTab && p.getAttribute('data-tabpanel') !== onTab.getAttribute('data-tab'); }); }
        var tw = document.querySelector('[data-tabs]'); if (tw) tw.style.display = q ? 'none' : '';
      }
      if (empty) empty.hidden = any;
      var res = document.querySelector('.presults'), cards = document.querySelector('.pcards');
      if (res) { res.hidden = !q; if (cards) cards.hidden = !!q; if (empty) empty.hidden = !q || any; }
      if (hasST) ScrollTrigger.refresh();
    });
    var chips = document.querySelectorAll('.pchips a[href^="#"]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          chips.forEach(function (c) {
            var on = c.getAttribute('href') === '#' + en.target.id;
            c.classList.toggle('on', on);
            if (on && c.scrollIntoView) { var bar = c.parentElement; bar.scrollTo({ left: c.offsetLeft - bar.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' }); }
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
  })();

  /* hero: on wide screens play the sharp framed clip and keep the blurred copy in step */
  (function heroFrame() {
    var fr = document.querySelector('.hero-frame video'), bg = document.querySelector('.hero .bgv video');
    if (!fr) return;
    var mq = window.matchMedia('(min-width: 901px)');
    function apply() {
      if (!mq.matches) { fr.pause(); return; }
      if (!fr.getAttribute('src')) fr.src = fr.getAttribute('data-src');
      fr.play().catch(function () {});
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
    setInterval(function () { if (mq.matches && bg && !fr.paused && Math.abs(bg.currentTime - fr.currentTime) > .3) bg.currentTime = fr.currentTime; }, 1500);
  })();
  function closePanels() { document.querySelectorAll('.mpanel.open').forEach(function (p) { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); }); }
  var menuEl = document.getElementById('menu');
  if (menuEl) menuEl.addEventListener('scroll', function () { if (menuEl.scrollLeft) menuEl.scrollLeft = 0; }, { passive: true });
  function closeMenu() { setTimeout(closePanels, 700); if (!document.body.classList.contains('menu-open')) return; document.body.classList.remove('menu-open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); } if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open'); if (!open) setTimeout(closePanels, 700);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeLb(); } });
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- text splitting ---------- */
  function splitText(scope) { scope.querySelectorAll('[data-split]').forEach(function (el) {
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
  }); }
  splitText(document);

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
    var frm = hero.querySelector('.hero-frame');
    if (frm && getComputedStyle(frm).display !== 'none') tl.fromTo(frm, { opacity: 0, y: 90, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'expo.out' }, .35);
  }
  function heroScroll(hero) {
    if (!hasST || reduce || !hero) return;
    var frm2 = hero.querySelector('.hero-frame');
    if (frm2) gsap.to(frm2, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    var bgEl = hero.querySelector('.bgv video, .bg img, .bg video, .bg.typo span');
    if (bgEl) gsap.to(bgEl, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(hero.querySelector('.content'), { y: 90, opacity: .25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  function reveals(scope) {
    if (!hasST || reduce) return;
    scope.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero, .phero')) return;
      gsap.fromTo(el, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    scope.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.closest('.hero, .phero')) return;
      var w = el.querySelectorAll('.wd i'); if (!w.length) return;
      gsap.from(w, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: .035, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    scope.querySelectorAll('.split .img img, .phero .bg img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -10 }, { yPercent: 2, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }
  function scrollFx() {
    if (!hasST || reduce) return;
    heroScroll(document.querySelector('.hero, .phero'));
    reveals(document);
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
  var rio = 'IntersectionObserver' in window && new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }); }, { threshold: .15 });
  function revealImgs(scope) { scope.querySelectorAll('.reveal-img').forEach(function (el) { if (rio) rio.observe(el); else el.classList.add('in'); }); }
  revealImgs(document);

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
  function initCopy(scope) { scope.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(function () { b.textContent = t; });
      else b.textContent = t;
    });
  }); }
  initCopy(document);

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

  /* ---------- basket (kept on this device until payment is connected) ---------- */
  var basket = (function () {
    var KEY = 'bc-basket', items = read();
    var drawer = document.getElementById('basket'), toastEl = document.getElementById('bkt'), toastT;
    function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} render(); }
    function find(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
    function count() { return items.reduce(function (n, it) { return n + it.qty; }, 0); }
    function total() { return items.reduce(function (n, it) { return n + it.qty * it.price; }, 0); }
    function euro(n) { return '€' + n.toLocaleString('en-IE'); }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function label(n) { return n === 1 ? '1 treatment' : n + ' treatments'; }
    function meta(it) { return [it.section, it.group !== it.name ? it.group : '', it.detail].filter(Boolean).join(' · '); }
    function itemRow(it) {
      return '<div class="bki" data-id="' + esc(it.id) + '"><div class="bki-t"><b>' + esc(it.name) + '</b><small>' + esc(meta(it)) + '</small></div>' +
        '<span class="bki-p">' + euro(it.price * it.qty) + '</span>' +
        '<div class="bki-c"><div class="qty"><button type="button" data-qty="-1" aria-label="One fewer ' + esc(it.name) + '">−</button><span aria-live="polite">' + it.qty + '</span><button type="button" data-qty="1" aria-label="One more ' + esc(it.name) + '">+</button></div>' +
        '<button type="button" class="bki-rm" data-remove>Remove</button></div></div>';
    }
    function render() {
      var n = count(), sum = euro(total());
      document.querySelectorAll('[data-basket-count]').forEach(function (b) { b.textContent = n; b.hidden = !n; });
      document.querySelectorAll('.bag').forEach(function (b) { b.setAttribute('aria-label', n ? 'Open basket, ' + label(n) : 'Open basket'); });
      document.querySelectorAll('[data-basket-label]').forEach(function (el) { el.textContent = label(n); });
      document.querySelectorAll('[data-basket-total]').forEach(function (el) { el.textContent = sum; });
      var empty = '<div class="bk-empty"><p>Your basket is empty.</p><a class="btn btn-ghost" href="' + priceHref() + '">See the price list</a></div>';
      document.querySelectorAll('[data-basket-list]').forEach(function (el) { el.innerHTML = items.length ? items.map(itemRow).join('') : empty; });
      document.querySelectorAll('[data-basket-lines]').forEach(function (el) { el.innerHTML = items.map(function (it) { return '<div><span>' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><span>' + euro(it.price * it.qty) + '</span></div>'; }).join(''); });
      document.querySelectorAll('[data-basket-go], [data-checkout]').forEach(function (el) { el.classList.toggle('off', !items.length); if (el.tagName === 'BUTTON') el.disabled = !items.length; });
      var text = items.map(function (it) { return it.qty + ' × ' + it.name + (meta(it) ? ' (' + meta(it) + ')' : '') + ' – ' + euro(it.price * it.qty); }).join('\n');
      document.querySelectorAll('[data-basket-field]').forEach(function (el) { el.value = items.length ? text + '\nTotal: ' + sum : ''; });
      document.querySelectorAll('[data-basket-summary]').forEach(function (el) {
        el.hidden = !items.length;
        el.innerHTML = items.length ? '<div class="bksum-h"><span>Your basket · ' + label(n) + '</span><b>' + sum + '</b></div><ul>' + items.map(function (it) { return '<li>' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</li>'; }).join('') + '</ul><a href="' + basketHref() + '">Edit basket</a>' : '';
      });
      mark(document);
    }
    function priceHref() { var a = document.querySelector('.site-nav a[href*="price-list"]'); return a ? a.getAttribute('href') : 'price-list.html'; }
    function basketHref() { var a = document.querySelector('[data-basket-go]'); return a ? a.getAttribute('href') : 'basket.html'; }
    function mark(scope) {
      scope.querySelectorAll('tr[data-item]').forEach(function (tr) {
        var on = !!find(tr.getAttribute('data-item')), b = tr.querySelector('.padd');
        tr.classList.toggle('inb', on);
        if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + tr.getAttribute('data-name') + (on ? ' from basket' : ' to basket')); }
      });
    }
    function toast(msg) {
      if (!toastEl) return;
      toastEl.querySelector('span').textContent = msg; toastEl.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
    }
    function open() {
      if (!drawer) return;
      if (toastEl) toastEl.classList.remove('show');
      closeMenu(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      var x = drawer.querySelector('.bk-x'); if (x) setTimeout(function () { x.focus({ preventScroll: true }); }, 300);
    }
    function close() {
      if (!drawer || !drawer.classList.contains('open')) return;
      drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
    }
    document.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-item]');
      if (tr && !e.target.closest('a')) {
        var id = tr.getAttribute('data-item'), it = find(id), name = tr.getAttribute('data-name');
        if (it) { items = items.filter(function (x) { return x !== it; }); save(); toast(name + ' removed'); }
        else {
          items.push({ id: id, name: name, group: tr.getAttribute('data-group') || '', section: tr.getAttribute('data-section') || '', detail: tr.getAttribute('data-detail') || '', price: +tr.getAttribute('data-price') || 0, qty: 1 });
          save(); toast(name + ' added');
          var b = tr.querySelector('.padd'); if (b && !reduce) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
          document.querySelectorAll('.bag').forEach(function (g) { g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); });
        }
        return;
      }
      if (e.target.closest('[data-basket-open]')) { e.preventDefault(); open(); return; }
      if (e.target.closest('[data-basket-close]')) { close(); return; }
      var row = e.target.closest('.bki');
      if (row) {
        var cur = find(row.getAttribute('data-id')); if (!cur) return;
        var q = e.target.closest('[data-qty]');
        if (q) { cur.qty = Math.max(0, Math.min(20, cur.qty + +q.getAttribute('data-qty'))); if (!cur.qty) items = items.filter(function (x) { return x !== cur; }); save(); return; }
        if (e.target.closest('[data-remove]')) { items = items.filter(function (x) { return x !== cur; }); save(); }
        return;
      }
      if (e.target.closest('[data-checkout]')) { var m = document.querySelector('[data-checkout-msg]'); if (m) { m.hidden = false; scrollToEl(m, -140); } }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('storage', function (e) { if (e.key === KEY) { items = read(); render(); } });
    render();
    return { mark: mark, close: close };
  })();

  /* ---------- price tabs: switch category in place, no page change ---------- */
  (function priceTabs() {
    var page = document.querySelector('.page');
    if (!page || !window.fetch || !window.DOMParser || !history.pushState || !document.querySelector('.price-sec .pbar #price-search')) return;
    var PRICE_PAGE = /\/(price-list(\.html)?|prices\/[a-z-]+(\.html)?|laser(\/index(\.html)?|\/)?)$/;
    var URL_ATTRS = ['href', 'src', 'data-src', 'poster', 'data-video', 'data-poster', 'data-image'];
    var cache = {}, token = 0;
    function isPricePage(u) { return u.origin === location.origin && PRICE_PAGE.test(u.pathname) && !/laser-hair-removal/.test(u.pathname); }
    /* relative links break once the address changes folder, so make them root-relative */
    function pinUrls(scope, base) {
      URL_ATTRS.forEach(function (at) {
        scope.querySelectorAll('[' + at + ']').forEach(function (el) {
          var v = el.getAttribute(at);
          if (!v || /^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(v)) return;
          var u = new URL(v, base); el.setAttribute(at, u.pathname + u.search + u.hash);
        });
      });
    }
    function load(href) {
      if (!cache[href]) cache[href] = fetch(href, { credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text().then(function (t) { return { url: r.url || href, html: t }; });
      }).catch(function (err) { delete cache[href]; throw err; });
      /* parse a fresh copy each time: swapping moves the nodes out */
      return cache[href].then(function (c) { return { url: c.url, doc: new DOMParser().parseFromString(c.html, 'text/html') }; });
    }
    function chipLinks() { return Array.prototype.filter.call(document.querySelectorAll('.price-sec .pbar .pchips a'), function (a) { return isPricePage(new URL(a.href, location.href)); }); }
    function sameUrl(a, b) { var x = new URL(a, location.href), y = new URL(b, location.href); return x.pathname.replace(/(\.html|\/index\.html|\/)$/, '') === y.pathname.replace(/(\.html|\/index\.html|\/)$/, ''); }
    function markChip(href) {
      chipLinks().forEach(function (a) { a.classList.toggle('on', sameUrl(a.href, href)); });
      var bar = document.querySelector('.price-sec .pbar .pchips'), on = bar && bar.querySelector('a.on');
      if (on) bar.scrollTo({ left: on.offsetLeft - bar.clientWidth / 2 + on.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    function outgoing(bar) {
      var list = [], sec = bar.closest('.price-sec');
      Array.prototype.forEach.call(page.children, function (el) { if (el !== sec) list.push(el); });
      Array.prototype.forEach.call(sec.children, function (el) { if (el !== bar) list.push(el); });
      return list;
    }
    function swapTo(href, push) {
      var bar = document.querySelector('.price-sec .pbar'); if (!bar) { location.href = href; return; }
      var my = ++token;
      markChip(href);
      var old = outgoing(bar);
      var faded = new Promise(function (res) {
        if (!hasGsap || reduce) return res();
        gsap.to(old, { opacity: 0, duration: .25, ease: 'power1.out', overwrite: true, onComplete: res });
      });
      Promise.all([load(href), faded]).then(function (r) {
        if (my !== token) return;
        var got = r[0], doc = got.doc, npage = doc.querySelector('.page'), nbar = npage && npage.querySelector('.price-sec .pbar');
        if (!nbar) { location.href = href; return; }
        pinUrls(npage, got.url);
        var keepTop = bar.getBoundingClientRect().top;
        /* keep the tab bar (and where it is scrolled to); take the new search wording */
        var inp = bar.querySelector('#price-search'), ninp = nbar.querySelector('#price-search');
        if (inp && ninp) { inp.value = ''; inp.placeholder = ninp.placeholder; inp.setAttribute('aria-label', ninp.getAttribute('aria-label') || ''); }
        nbar.parentNode.replaceChild(bar, nbar);
        if (hasST) ScrollTrigger.getAll().forEach(function (t) { if (t.trigger && page.contains(t.trigger) && !bar.contains(t.trigger)) t.kill(); });
        var frag = document.createDocumentFragment();
        while (npage.firstChild) frag.appendChild(document.adoptNode(npage.firstChild));
        while (page.firstChild) page.removeChild(page.firstChild);
        page.appendChild(frag);
        document.title = doc.title;
        var cur = {};
        doc.querySelectorAll('.site-head [aria-current], .menu [aria-current]').forEach(function (a) { cur[new URL(a.getAttribute('href'), got.url).pathname] = 1; });
        document.querySelectorAll('.site-head a, .menu a').forEach(function (a) { if (cur[new URL(a.href).pathname]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        if (push) history.pushState({ bcPrice: 1 }, '', got.url);
        markChip(got.url);
        /* hold the tab bar where it was on screen, so only the content under it changes */
        var sec = bar.closest('.price-sec');
        var natural = sec.getBoundingClientRect().top + window.scrollY + (parseFloat(getComputedStyle(sec).paddingTop) || 0);
        var y = Math.max(0, natural - keepTop);
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
        splitText(page); initTabs(page); revealImgs(page); initCopy(page); magnet(page); basket.mark(page);
        var nh = page.querySelector('.hero, .phero');
        heroScroll(nh); reveals(page);
        var incoming = outgoing(bar);
        if (hasGsap && !reduce) gsap.fromTo(incoming, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out', clearProps: 'opacity,transform' });
        if (hasST) ScrollTrigger.refresh();
      }).catch(function () { if (my === token) location.href = href; });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('.price-sec .pbar .pchips a'); if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      var u = new URL(a.href, location.href); if (!isPricePage(u)) return;
      e.preventDefault(); e.stopPropagation();
      if (sameUrl(u.href, location.href)) return;
      swapTo(u.href, true);
    }, true);
    pinUrls(document.body, location.href);
    history.replaceState({ bcPrice: 1 }, '', location.href);
    window.addEventListener('popstate', function (e) {
      if (!e.state || !e.state.bcPrice) return;
      if (isPricePage(new URL(location.href))) swapTo(location.href, false); else location.reload();
    });
    /* fetch the other tabs quietly so switching is instant */
    function warm() { chipLinks().forEach(function (a) { if (!sameUrl(a.href, location.href)) load(a.href).catch(function () {}); }); }
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);
  })();

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
