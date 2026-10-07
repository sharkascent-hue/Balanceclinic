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

  /* ---------- living background: liquid gradient mesh (WebGL) ---------- */
  var scrollVel = 0;   /* shared with the smooth-scroll block below */
  (function bg() {
    var c = document.getElementById('bgfx'); if (!c) return;
    var gl = null;
    try { gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }) || c.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return fallback2d(c);
    var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    var FS = [
      'precision mediump float;uniform vec2 uRes;uniform float uTime;uniform float uScroll;uniform vec2 uMouse;',
      'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}',
      'float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}',
      'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<3;i++){v+=a*snoise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
      'void main(){vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y);float t=uTime*.055;',
      'p.y+=sin(p.x*5.5+uTime*1.4)*uScroll*.09;p.x+=cos(p.y*4.5-uTime*1.1)*uScroll*.06;',
      'vec2 m=vec2(uMouse.x*asp,uMouse.y);float d=distance(p,m);p+=(p-m)*exp(-d*d*7.)*.07;',
      'float n1=fbm(p*1.1+vec2(t,-t*.7));float n2=fbm(p*1.6-vec2(t*.8,t*.5)+3.1);float n3=fbm(p*.8+vec2(-t*.5,t*.9)+7.3);',
      'vec3 cream=vec3(.957,.965,.941),sage=vec3(.882,.918,.835),limeL=vec3(.80,.90,.64),blush=vec3(.969,.894,.863),lime=vec3(.553,.765,.294);',
      'vec3 col=mix(cream,sage,smoothstep(-.3,.6,n1));col=mix(col,limeL,smoothstep(0.,.7,n2)*.9);col=mix(col,blush,smoothstep(.1,.8,n3)*.55);col=mix(col,lime,smoothstep(.45,.9,n2*n3+.2)*.28);',
      'col=mix(col,cream,smoothstep(.25,1.15,length(uv-.5))*.3);gl_FragColor=vec4(col,1.);}'
    ].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; } return s; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return fallback2d(c);
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback2d(c);
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime'), uScroll = gl.getUniformLocation(prog, 'uScroll'), uMouse = gl.getUniformLocation(prog, 'uMouse');
    var S = Math.min(0.5, 900 / Math.max(window.innerWidth, 1)), W, H, mx = .5, my = .5, tmx = .5, tmy = .5, vel = 0, running = true, raf;
    function size() { W = Math.max(1, Math.floor(window.innerWidth * S)); H = Math.max(1, Math.floor(window.innerHeight * S)); c.width = W; c.height = H; gl.viewport(0, 0, W, H); gl.uniform2f(uRes, W, H); }
    window.addEventListener('resize', function () { S = Math.min(0.5, 900 / Math.max(window.innerWidth, 1)); size(); if (reduce) draw(2000); });
    window.addEventListener('mousemove', function (e) { tmx = e.clientX / window.innerWidth; tmy = 1 - e.clientY / window.innerHeight; }, { passive: true });
    function draw(now) {
      mx += (tmx - mx) * .04; my += (tmy - my) * .04;
      vel += (Math.min(Math.abs(scrollVel), 1.4) - vel) * .08;
      gl.uniform1f(uTime, now * .001); gl.uniform1f(uScroll, vel); gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop(now) { draw(now); if (running && !reduce) raf = requestAnimationFrame(loop); }
    size();
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
    if (reduce) draw(2000); else raf = requestAnimationFrame(loop);
    document.documentElement.classList.add('webgl');
  })();
  function fallback2d(c) {
    var ctx = c.getContext('2d'); if (!ctx) return;
    var W, H, S = 0.25, t = 0, raf, running = true;
    var blobs = [
      { col: [225, 234, 213], r: .55, ax: .12, ay: .18, sx: .8, sy: .6, a: .9 },
      { col: [169, 213, 110], r: .38, ax: .85, ay: .75, sx: 1.1, sy: .7, a: .45 },
      { col: [247, 228, 220], r: .34, ax: .6,  ay: .2,  sx: .7, sy: 1.2, a: .7 },
      { col: [141, 195, 75],  r: .3,  ax: .2,  ay: .9,  sx: .9, sy: .9, a: .28 }
    ];
    function size() { W = Math.max(1, Math.floor(window.innerWidth * S)); H = Math.max(1, Math.floor(window.innerHeight * S)); c.width = W; c.height = H; }
    function draw() {
      ctx.fillStyle = '#F4F6F0'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      blobs.forEach(function (b, i) {
        var x = (b.ax + Math.sin(t * .00022 * b.sx + i) * .14) * W, y = (b.ay + Math.cos(t * .00019 * b.sy + i * 2) * .14) * H, r = b.r * Math.max(W, H);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + b.col.join(',') + ',' + b.a + ')'); g.addColorStop(1, 'rgba(' + b.col.join(',') + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    function loop(now) { t = now; draw(); if (running && !reduce) raf = requestAnimationFrame(loop); }
    size(); window.addEventListener('resize', function () { size(); if (reduce) draw(); });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
    if (reduce) { t = 1000; draw(); } else raf = requestAnimationFrame(loop);
  }

  /* ---------- floating light particles ---------- */
  (function orbs() {
    if (reduce) return;
    var bgc = document.getElementById('bgfx'); if (!bgc) return;
    var c = document.createElement('canvas'); c.id = 'orbs'; c.setAttribute('aria-hidden', 'true');
    bgc.parentNode.insertBefore(c, bgc.nextSibling);
    var ctx = c.getContext('2d'); if (!ctx) return;
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5), W = 0, H = 0, parts = [], mx = -9999, my = -9999, running = true, raf, last = 0, t = 0;
    var COLS = { lime: [141, 195, 75], limeL: [190, 226, 140], blush: [242, 192, 176], white: [255, 255, 255] };
    function sprite(col, glow) {
      var n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n;
      var g = cv.getContext('2d'), grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      if (glow) { grd.addColorStop(0, 'rgba(' + col + ',1)'); grd.addColorStop(.18, 'rgba(' + col + ',.85)'); grd.addColorStop(.45, 'rgba(' + col + ',.18)'); grd.addColorStop(1, 'rgba(' + col + ',0)'); }
      else { grd.addColorStop(0, 'rgba(' + col + ',.42)'); grd.addColorStop(.6, 'rgba(' + col + ',.3)'); grd.addColorStop(.82, 'rgba(' + col + ',.16)'); grd.addColorStop(1, 'rgba(' + col + ',0)'); }
      g.fillStyle = grd; g.fillRect(0, 0, n, n);
      if (!glow) { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.arc(n / 2, n / 2, n * .34, 0, 6.2832); g.stroke(); }
      return cv;
    }
    var SOFT = [sprite(COLS.lime, false), sprite(COLS.limeL, false), sprite(COLS.blush, false), sprite(COLS.white, false)];
    var GLOW = [sprite(COLS.lime, true), sprite(COLS.limeL, true), sprite([227, 140, 118], true)];
    function make(spawnAnywhere) {
      var soft = Math.random() < .55, z = .35 + Math.random() * .65;
      return {
        soft: soft, z: z,
        r: soft ? (14 + Math.random() * 34) * (.6 + z * .5) : 2 + Math.random() * 4.5,
        x: Math.random() * W, y: spawnAnywhere ? Math.random() * H : H + 60,
        vy: soft ? 7 + Math.random() * 10 : 14 + Math.random() * 22,
        sway: 8 + Math.random() * 22, ph: Math.random() * 6.28, sp: .25 + Math.random() * .5,
        a: soft ? .35 + Math.random() * .4 : .55 + Math.random() * .45, tw: .6 + Math.random() * 1.6,
        img: soft ? SOFT[(Math.random() * SOFT.length) | 0] : GLOW[(Math.random() * GLOW.length) | 0],
        ox: 0, oy: 0
      };
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var want = Math.max(22, Math.min(70, Math.round(W * H / 16000)));
      while (parts.length < want) parts.push(make(true));
      parts.length = want;
    }
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) { var p = e.touches[0]; if (p) { mx = p.clientX; my = p.clientY; } }, { passive: true });
    window.addEventListener('touchend', function () { setTimeout(function () { mx = my = -9999; }, 250); }, { passive: true });
    document.addEventListener('mouseleave', function () { mx = my = -9999; });
    function frame(now) {
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
      ctx.clearRect(0, 0, W, H);
      var sv = Math.max(-2, Math.min(2, scrollVel || 0));
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= (p.vy * dt + sv * 9) * p.z;
        var x = p.x + Math.sin(t * p.sp + p.ph) * p.sway;
        var dx = x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy) || 1, R = 150;
        var push = d < R ? (1 - d / R) * (p.soft ? 46 : 70) : 0;
        p.ox += (dx / d * push - p.ox) * .08; p.oy += (dy / d * push - p.oy) * .08;
        if (p.y < -p.r * 2 - 40) { var n = make(false); n.y = H + n.r + 20; parts[i] = p = n; continue; }
        if (p.y > H + p.r * 2 + 60) { p.y = -p.r * 2 - 30; p.x = Math.random() * W; }
        var a = p.a * (.72 + .28 * Math.sin(t * p.tw + p.ph));
        if (p.y > H - 120) a *= Math.max(0, (H - p.y + 60) / 180);
        ctx.globalAlpha = a;
        var s = p.r * 2;
        ctx.drawImage(p.img, x + p.ox - p.r, p.y + p.oy - p.r, s, s);
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', function () { running = !document.hidden; last = 0; if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
    size(); raf = requestAnimationFrame(frame);
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
  var lastY = window.scrollY, lastT = performance.now();
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (!lenis) { var now = performance.now(); scrollVel = (y - lastY) / Math.max(16, now - lastT) * 0.6; lastY = y; lastT = now; clearTimeout(onScroll._t); onScroll._t = setTimeout(function () { scrollVel = 0; }, 80); }
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
