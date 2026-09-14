/* ============ LANDING ============ */
const Landing = (() => {
  const HERO = 40;
  const TK = [ // tickets anchored to candles in the Scene
    { post: 'a', idx: HERO, kf: [0.34, 0.40, 0.84, 0.90], dx: 1, dy: -0.2 },
    { post: 'b', idx: 10, kf: [0.44, 0.50, 0.84, 0.90], dx: 1, dy: -1.15 },
    { post: 'c', idx: 58, kf: [0.54, 0.60, 0.84, 0.90], dx: -1, dy: -1.25 },
  ];
  /* Motion Script keyframes: [progress breakpoints] -> [values]. Do not change numbers casually. */
  const KF = {
    wordOpacity: [[0, 0.09, 0.17], [1, 1, 0]],
    wordBlur: [[0, 0.09, 0.17], [0, 0, 14]],
    wordY: [[0, 0.09, 0.17], [0, 0, -40]],
    wordSpread: [[0, 0.04, 0.17], [0, 0, 1]],
    metaOpacity: [[0, 0.05], [1, 0]],
    zoom: [[0, 0.04, 0.30], [0, 0, 1]],
    reveal: [[0.07, 0.42], [0, 46]],
    glow: [[0, 0.26], [1, 0.3]],
    chartDim: [[0.80, 0.93], [1, 0.22]],
    endChars: [[0.78, 0.88], [0, 1]],
    endSub: [[0.88, 0.93], [0, 1]],
  };
  const interp = (p, [x, y]) => { if (p <= x[0]) return y[0]; for (let i = 1; i < x.length; i++) if (p <= x[i]) { const t = (p - x[i - 1]) / (x[i] - x[i - 1]); return y[i - 1] + (y[i] - y[i - 1]) * t; } return y[y.length - 1]; };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let g, cv, ctx, wc, wctx, W, H, dpr, cleanups = [], rafs = [], sts = [], P = 0, lastP = -1;

  const split = (txt) => txt.split('').map((c) => (c === ' ' ? ' ' : `<span class="ch">${esc(c)}</span>`)).join('');
  /* Example tickets: they illustrate what a post looks like. They are not accounts or real posts. */
  const EX = {
    a: { sym: 'MES', tf: '5m', session: 'London', side: 'long', pnl: 480, rr: 2.4, note: 'Swept the Asia low, entered on the reclaim.' },
    b: { sym: 'NQ', tf: '1m', session: 'New York', side: 'short', pnl: -185, rr: 2, note: 'Stopped out. Losses get posted too.' },
    c: { sym: 'MGC', tf: '1m', session: 'New York', side: 'long', pnl: 620, rr: 3, note: 'Posted with the screen recording attached.' },
  };
  function sTicket(t) {
    const p = EX[t.post];
    return `<div class="ticket s-ticket" data-tk="${t.post}"><header><span class="badge t-board ex-badge" style="--s:32px" aria-hidden="true">YOU</span><div><strong>Example post</strong><em>${p.sym} ${p.tf}, ${p.session}</em></div></header>
      <p>${p.note}</p>
      <div class="ticket-strip tk3"><div class="tf"><b>Side</b><i>${p.side === 'long' ? 'Long' : 'Short'} ${p.sym}</i></div><div class="tf"><b>Risk:reward</b><i>1:${p.rr}</i></div><div class="stamp ${p.pnl > 0 ? 'win' : 'loss'}">${money(p.pnl)}</div></div></div>`;
  }
  const BOOK = [['Setup', 'Mark the level you are watching'], ['Trigger', 'What has to happen first'], ['Entry', 'Exactly where you get in'], ['Stop', 'Where the idea is wrong'], ['Target', 'Where you get paid']].map(([kind, title]) => ({ kind, title }));

  function html() {
    const tapeItems = Object.entries(SYMBOLS).map(([k, s]) => `<span class="tape-item"><span class="w">${k}</span><em>${esc(s.name)}</em></span>`).join('');
    return `<header class="land-nav"><a class="mark" href="#/">The Trading<br>Floor</a><nav aria-label="Site"><a href="#/discover">Strategies</a><a href="#/replays">Replays</a><a class="btn btn-floor btn-sm" href="#/floor">Enter the floor</a></nav></header>
    <main>
    <section class="scene" id="scene" aria-label="Introduction"><div class="scene-pin">
      <canvas id="chartCanvas" aria-hidden="true"></canvas>
      <div class="wordmark"><h1 aria-label="The Trading Floor"><span class="row" aria-hidden="true">${split('THE TRADING')}</span><span class="row" aria-hidden="true">${split('FLOOR')}</span></h1></div>
      <canvas id="wickCanvas" aria-hidden="true"></canvas>
      ${TK.map(sTicket).join('')}
      <div class="hero-meta"><div><small>A social network for day traders</small><p>Post the trades you took. Publish the strategy behind them. See how everyone else traded the same session.</p></div>
        <div class="ctas"><a class="btn btn-floor mag" href="#/floor">Enter the floor</a><a class="btn btn-line mag" href="#/discover">Discover strategies</a></div></div>
      <div class="scroll-cue" aria-hidden="true"></div>
      <div class="scene-end"><h2 aria-label="Every candle has a trader behind it.">${'Every candle has a trader behind it.'.split(' ').map((w) => `<span style="white-space:nowrap;display:inline-block">${split(w)}</span>`).join(' ')}</h2>
        <p>Entries, stops, exits and the reasoning, posted by the people who took them. Nobody has posted yet, so the first trade could be yours.</p><a class="btn btn-floor cta mag" href="#/floor">Enter the floor</a></div>
    </div></section>

    <section class="book" id="book" aria-label="Strategy builder"><div class="book-pin">
      <div class="copy"><div class="l-kicker"><b>Strategies</b><span>Built step by step</span></div><h2 class="l-h">Your playbook, as its own page.</h2>
        <p class="l-p">The strategy builder turns your rules into a page anyone can read: <strong>setup, trigger, entry, stop, target</strong>, with checklists and example charts. It sits on your profile and in Discover, and other traders can follow it or fork it.</p>
        <div class="book-url">thetradingfloor.app/<b>@you/your-strategy</b></div>
        <div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-floor" href="#/builder">Open the builder</a><a class="btn btn-line" href="#/discover">Discover strategies</a></div></div>
      <div class="book-stack">${BOOK.map((s, i) => `<div class="ticket book-t" data-i="${i}"><div class="row"><div class="n">${String(i + 1).padStart(2, '0')}</div><div><div class="k">${esc(s.kind)}</div><h4>${esc(s.title)}</h4></div></div></div>`).join('')}</div>
    </div></section>

    <section class="l-sec"><div class="replay-sec">
      <div><div class="l-kicker"><b>Replays</b><span>Screen recordings and chart replays</span></div><h2 class="l-h">Post the replay, not just the screenshot.</h2>
        <p class="l-p">A screenshot shows where you got in. A replay shows <strong>what you were looking at when you decided</strong>. Upload a screen recording of the trade as an MP4, MOV or WebM, then scroll through everyone else's in a vertical feed.</p>
        <a class="btn btn-floor" style="margin-top:28px" href="#/replays">Watch replays</a></div>
      <div class="phone" aria-hidden="true"><div class="phone-screen phone-empty"><div class="phone-bar"><i class="phone-run"></i></div>
        <div class="pe-drop"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg><b>your-trade.mp4</b><span>Your screen recording plays here</span></div>
        <div class="phone-ov"><div class="who"><span class="badge t-board" style="--s:26px">YOU</span><span>your handle</span></div><p>Your caption and trade ticket sit here.</p></div></div></div>
    </div></section>
    <div class="tape" aria-label="Markets you can post"><div class="tape-track" id="tapeTrack">${tapeItems}${tapeItems}</div></div>

    <section class="l-sec badge-sec" aria-label="Pick a badge"><div class="l-kicker" style="justify-content:center"><b>Badges</b><span>From the pit</span></div>
      <h2 class="l-h">Pick your badge.</h2>
      <p class="l-p" style="margin:24px auto 0">On the old exchange floors every trader wore three letters so the pit knew who was on the other side. Here your badge goes on every trade you post.</p>
      <div class="badge-maker"><div class="badge-big" id="bigBadge" aria-live="polite">???</div>
        <label class="sr" for="badgeIn">Three letter badge</label><input id="badgeIn" class="input badge-in" maxlength="3" value="" placeholder="ABC" autocomplete="off" spellcheck="false">
        <a class="btn btn-floor mag" href="#/floor" id="badgeGo">Claim a badge</a></div></section>

    <footer class="land-foot"><div class="big">The Trading<br>Floor</div><div style="display:grid;gap:10px;justify-items:end"><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-line btn-sm" href="#/discover">Strategies</a><a class="btn btn-line btn-sm" href="#/replays">Replays</a><a class="btn btn-line btn-sm" href="#/builder">Builder</a></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end"><a href="privacy.html" style="color:var(--muted);font-size:13px">Privacy</a><a href="terms.html" style="color:var(--muted);font-size:13px">Terms</a></div>
      <small>Trades and results are posted by users and are not financial advice.</small></div></footer>
    </main>`;
  }

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    [cv, wc].forEach((c) => { c.width = W * dpr; c.height = H * dpr; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(P, true);
  }

  function layout() {
    const n = g.candles.length; const mob = W < 700;
    const padL = W * 0.05, padR = W * 0.05, padT = H * (mob ? 0.26 : 0.2), padB = H * (mob ? 0.3 : 0.18);
    let lo = Infinity, hi = -Infinity; g.candles.forEach((k) => { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); });
    const X = (i) => padL + (i + 0.5) * ((W - padL - padR) / n);
    const Y = (p) => padT + (1 - (p - lo) / (hi - lo)) * (H - padT - padB);
    return { X, Y, cw: ((W - padL - padR) / n) * 0.6 };
  }

  function draw(p, force) {
    if (!ctx || (!force && Math.abs(p - lastP) < 0.0004)) return; lastP = p;
    const L = layout(); const hk = g.candles[HERO];
    const bodyH = Math.abs(L.Y(hk.o) - L.Y(hk.c)); const s0 = (H * (W < 700 ? 0.36 : 0.5)) / bodyH;
    const z = ease(interp(p, KF.zoom)); const s = Math.pow(s0, 1 - z);
    const fwx = L.X(HERO), fwy = (L.Y(hk.o) + L.Y(hk.c)) / 2;
    const fsx = W / 2 + (fwx - W / 2) * z, fsy = H / 2 + (fwy - H / 2) * z;
    const T = (wx, wy) => [fsx + (wx - fwx) * s, fsy + (wy - fwy) * s];
    const rad = interp(p, KF.reveal); const dim = interp(p, KF.chartDim); const glow = interp(p, KF.glow);
    ctx.clearRect(0, 0, W, H); wctx.clearRect(0, 0, W, H);
    // faint grid appears with the chart
    ctx.globalAlpha = Math.min(1, rad / 20) * dim; ctx.strokeStyle = 'rgba(230,237,231,0.06)'; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const y = Math.round((H / 6) * i) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const lw = 1.2; const cw = L.cw * s;
    for (let i = 0; i < g.candles.length; i++) {
      const isHero = i === HERO; const d = Math.abs(i - HERO);
      const a = isHero ? 1 : Math.max(0, Math.min(1, (rad - d) / 3)); if (a <= 0) continue;
      const k = g.candles[i]; const [x, yH] = T(L.X(i), L.Y(k.h)); const yL = T(0, L.Y(k.l))[1]; const yO = T(0, L.Y(k.o))[1]; const yC = T(0, L.Y(k.c))[1];
      if (x < -cw * 2 || x > W + cw * 2) continue;
      const top = Math.min(yO, yC), bh = Math.max(1, Math.abs(yC - yO)); const up = k.c >= k.o;
      if (isHero) {
        const hw = Math.max(1.5, lw * Math.min(s, 3.2));
        ctx.globalAlpha = 1; ctx.save(); ctx.shadowColor = 'rgba(24,165,131,' + (0.85 * glow) + ')'; ctx.shadowBlur = 80 * glow * Math.min(1, s / 3);
        ctx.strokeStyle = '#18A583'; ctx.lineWidth = hw; ctx.strokeRect(x - cw / 2, top, cw, bh);
        ctx.fillStyle = 'rgba(24,165,131,0.14)'; ctx.fillRect(x - cw / 2, top, cw, bh);
        ctx.restore();
        // wick on the front canvas: pierces the wordmark
        wctx.strokeStyle = '#18A583'; wctx.lineWidth = hw; wctx.save(); wctx.shadowColor = 'rgba(24,165,131,' + 0.7 * glow + ')'; wctx.shadowBlur = 30 * glow;
        wctx.beginPath(); wctx.moveTo(x, yH); wctx.lineTo(x, top); wctx.moveTo(x, top + bh); wctx.lineTo(x, yL); wctx.stroke(); wctx.restore();
      } else {
        ctx.globalAlpha = a * dim; ctx.strokeStyle = '#E6EDE7'; ctx.fillStyle = '#E6EDE7'; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, top); ctx.moveTo(x, top + bh); ctx.lineTo(x, yL); ctx.stroke();
        if (up) ctx.strokeRect(x - cw / 2 + 0.6, top + 0.6, Math.max(1, cw - 1.2), Math.max(1, bh - 1.2)); else ctx.fillRect(x - cw / 2, top, cw, bh);
      }
    }
    // hero trade path draws in with ticket A
    const pa = interp(p, [[TK[0].kf[0], TK[0].kf[1] + 0.12], [0, 1]]);
    if (pa > 0) {
      const [ex, ey] = T(L.X(HERO), L.Y(g.entry)); const [xx, xy] = T(L.X(g.exitIdx), L.Y(g.exit));
      ctx.globalAlpha = dim; ctx.strokeStyle = '#18A583'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + (xx - ex) * pa, ey + (xy - ey) * pa); ctx.stroke();
      ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(230,237,231,.5)'; const sy = T(0, L.Y(g.stop))[1], ty = T(0, L.Y(g.target))[1];
      ctx.beginPath(); ctx.moveTo(ex, sy); ctx.lineTo(ex + (W - ex) * pa, sy); ctx.moveTo(ex, ty); ctx.lineTo(ex + (W - ex) * pa, ty); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
    // tickets follow their candles
    TK.forEach((t) => {
      const el = t.el; if (!el) return;
      const op = interp(p, [t.kf, [0, 1, 1, 0]]); const bl = interp(p, [t.kf, [12, 0, 0, 12]]); const ty = interp(p, [t.kf, [24, 0, 0, -24]]);
      if (op <= 0.001) { el.style.opacity = 0; el.style.visibility = 'hidden'; return; }
      const k = g.candles[t.idx]; const [cx, cy] = T(L.X(t.idx), L.Y(t.dy < 0 ? k.h : k.l));
      const w = el.offsetWidth, h = el.offsetHeight; const gap = W < 700 ? 10 : 26;
      let x = t.dx > 0 ? cx + gap : cx - w - gap; let y = cy + t.dy * h;
      if (W < 700) { const slot = { b: 76, c: H * 0.4, a: H - h - 110 }[t.post]; y = slot; }
      x = Math.max(12, Math.min(W - w - 12, x)); y = Math.max(70, Math.min(H - h - 16, y));
      el.style.visibility = 'visible'; el.style.opacity = op; el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : 'none';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + ty).toFixed(1)}px, 0) rotate(${t.dx > 0 ? -1.5 : 1.5}deg)`;
      // leader dot on the anchored candle
      ctx.globalAlpha = op * dim; ctx.fillStyle = '#18A583'; ctx.beginPath(); ctx.arc(cx, cy + (t.dy < 0 ? -8 : 8), 4, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    });
    // wordmark
    const wo = interp(p, KF.wordOpacity), wb = interp(p, KF.wordBlur), wy = interp(p, KF.wordY), sp = interp(p, KF.wordSpread);
    if (wordEl) { wordEl.style.opacity = wo; wordEl.style.filter = wb > 0.2 ? `blur(${wb}px)` : 'none'; wordEl.style.transform = `translateY(${wy}px)`;
      wordChars.forEach((c) => { c.el.style.setProperty('--sx', (c.off * sp * 34).toFixed(1) + 'px'); }); }
    wc.style.opacity = 1;
    const mo = interp(p, KF.metaOpacity); metaEls.forEach((m) => { m.style.opacity = mo; m.style.pointerEvents = mo < 0.3 ? 'none' : ''; });
    const ec = interp(p, KF.endChars); const n = endChars.length;
    endChars.forEach((c, i) => { const t = Math.max(0, Math.min(1, ec * (n + 8) / 8 - i / 8)); c.style.opacity = t; c.style.transform = `translate3d(${(1 - t) * -18}px,0,0)`; c.style.filter = t < 1 ? `blur(${(1 - t) * 8}px)` : 'none'; });
    const es = interp(p, KF.endSub); endSubs.forEach((e) => { e.style.opacity = es; e.style.transform = `translateY(${(1 - es) * 16}px)`; });
    endCta.style.pointerEvents = es > 0.5 ? 'auto' : 'none';
  }
  let wordEl, wordChars = [], metaEls = [], endChars = [], endSubs = [], endCta;

  function init() {
    g = genTrade({ seed: 7, sym: 'MES', side: 'long', outcome: 'win', rr: 3, n: 64, entryIdx: HERO });
    cv = $('#chartCanvas'); ctx = cv.getContext('2d'); wc = $('#wickCanvas'); wctx = wc.getContext('2d');
    TK.forEach((t) => (t.el = $(`[data-tk="${t.post}"]`)));
    wordEl = $('.wordmark h1');
    const chs = $$('.wordmark .ch'); const rows = $$('.wordmark .row');
    wordChars = chs.map((el) => { const row = el.closest('.row'); const list = $$('.ch', row); const i = list.indexOf(el); return { el, off: i - (list.length - 1) / 2, row: rows.indexOf(row), i }; });
    metaEls = [$('.hero-meta'), $('.scroll-cue')]; endChars = $$('.scene-end .ch'); endSubs = [$('.scene-end p'), $('.scene-end .cta')]; endCta = $('.scene-end .cta');
    const nav = $('.land-nav'); const onS = () => nav && nav.classList.toggle('solid', scrollY > $('#scene').offsetHeight - innerHeight * 0.6); addEventListener('scroll', onS, { passive: true }); cleanups.push(() => removeEventListener('scroll', onS)); onS();
    size(); const onR = () => size(); addEventListener('resize', onR); cleanups.push(() => removeEventListener('resize', onR));

    const scene = $('#scene'); const book = $('#book');
    if (reduced) {
      scene.style.height = '100vh'; book.style.height = 'auto'; $('.book-pin').style.position = 'relative'; $('.book-pin').style.height = 'auto'; $('.book-pin').style.padding = '100px 20px';
      P = 0; draw(0, true);
      $$('.book-t').forEach((el, i) => { el.style.position = 'relative'; el.style.left = 'auto'; el.style.top = 'auto'; el.style.margin = '0 0 10px 0'; el.style.width = '100%'; });
      $('.book-stack').style.height = 'auto';
    } else {
      const prog = (el) => { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))); };
      if (window.gsap && window.ScrollTrigger) {
        const proxy = { p: 0 };
        const tw = gsap.to(proxy, { p: 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top top', end: 'bottom bottom', scrub: 0.7 }, onUpdate: () => { P = proxy.p; draw(P); } });
        sts.push(tw);
        // strategy book: tickets fan out into a sequence
        const bt = $$('.book-t'); const mob = innerWidth < 960; const sp = mob ? 64 : 104;
        bt.forEach((el, i) => gsap.set(el, { y: i * 5 - 10, x: i * 2, rotation: [-7, 4, -3, 6, -1][i], zIndex: 10 - i }));
        const tl = gsap.timeline({ scrollTrigger: { trigger: book, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
        bt.forEach((el, i) => tl.to(el, { y: (i - 2) * sp, x: (i - 2) * (mob ? 10 : 26), rotation: i % 2 ? 1.2 : -1.2, zIndex: 10 + i, ease: 'power3.inOut', duration: 0.5 }, 0.08 + i * 0.1));
        tl.to({}, { duration: 0.25 });
        sts.push(tl);
        $$('.l-h').forEach((h) => sts.push(gsap.fromTo(h, { yPercent: 18, opacity: 0.001 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: h, start: 'top 95%', end: 'top 55%', scrub: 0.6 } })));
      } else {
        let tp = 0; const loop = () => { const t = prog(scene); P += (t - P) * 0.14; draw(P); rafs[0] = requestAnimationFrame(loop); }; loop();
      }
    }
    // tape: continuous, accelerates with scroll velocity
    const track = $('#tapeTrack'); let x = 0, last = performance.now(), lastY = scrollY, vel = 0;
    const tape = (now) => { const dt = Math.min(64, now - last); last = now; const dy = scrollY - lastY; lastY = scrollY; vel += (Math.abs(dy) - vel) * 0.08;
      x -= (0.045 + vel * 0.02) * dt * (reduced ? 0 : 1); const half = track.scrollWidth / 2; if (-x > half) x += half; track.style.transform = `translate3d(${x}px,0,0) skewX(${-Math.min(8, vel * 0.25)}deg)`; rafs[1] = requestAnimationFrame(tape); };
    rafs[1] = requestAnimationFrame(tape);
    // magnetic buttons
    $$('.mag').forEach((b) => { const mv = (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.18}px)`; };
      const lv = () => (b.style.transform = ''); b.addEventListener('mousemove', mv); b.addEventListener('mouseleave', lv); });
    // badge maker
    const bi = $('#badgeIn'); const go = $('#badgeGo'); let _bt, _last = '';
    const check = async (v) => { const t = await DB.isTaken('badge', v); if (bi.value === v) { go.textContent = t ? `${v} is taken` : `Claim ${v}`; go.dataset.taken = t ? '1' : ''; } };
    bi.addEventListener('input', () => { const v = bi.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); bi.value = v; $('#bigBadge').textContent = v || '???'; go.dataset.taken = '';
      go.textContent = v.length !== 3 ? 'Badges are three letters' : `Claim ${v}`; clearTimeout(_bt); if (v.length === 3 && v !== _last) { _last = v; _bt = setTimeout(() => check(v), 250); } });
    go.addEventListener('click', (e) => { e.preventDefault(); const v = bi.value; if (v.length !== 3 || go.dataset.taken) { bi.focus(); return; }
      if (ME) { location.hash = '#/floor'; return; }
      sessionStorage.setItem(BADGE_KEY, v); sessionStorage.setItem(AFTER_KEY, '#/floor');
      if (SESSION) openProfileSetup(); else openAuth({ badgeHint: v }); });
  }
  function intro() {
    const chs = $$('.wordmark .ch'); if (!chs.length || !window.gsap || reduced) return;
    gsap.fromTo(chs, { opacity: 0, x: -18, filter: 'blur(8px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.035, clearProps: 'filter,x' });
    gsap.fromTo('.hero-meta > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.35, stagger: 0.08 });
    const glowProxy = { g: 0 }; gsap.fromTo(cv, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }); gsap.fromTo(wc, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.15 });
  }
  function destroy() {
    cleanups.forEach((f) => f()); cleanups = []; rafs.forEach((r) => cancelAnimationFrame(r)); rafs = [];
    sts.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); sts = []; ctx = null; lastP = -1; P = 0;
  }
  return { html, init, destroy, intro };
})();

/* ============ BOOT + PRELOADER ============ */
(function boot() {
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const pre = $('#pre');
  const q = new URLSearchParams(location.search); const hq = new URLSearchParams(location.hash.includes('error') ? location.hash.slice(1) : '');
  const authErr = q.get('error_description') || hq.get('error_description');
  const returning = q.has('code') || !!authErr;
  const onLanding = !returning && (location.hash || '#/') === '#/';
  const finish = async () => {
    try { await DB.init(); } catch (e) { console.error(e); }
    if (returning) {
      const back = sessionStorage.getItem(AFTER_KEY) || '#/floor'; sessionStorage.removeItem(AFTER_KEY);
      history.replaceState(null, '', location.pathname + back);
      if (authErr) setTimeout(() => toast('Sign-in did not finish: ' + authErr.replace(/\+/g, ' ')), 400);
    }
    await render();
    if (SESSION && !ME) openProfileSetup();
    else if (returning && ME) toast('Signed in as @' + ME.handle);
  };
  const ready = finish();
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  if (!onLanding || reduced || !window.gsap) { Promise.all([fonts, ready]).then(() => { pre.classList.add('gone'); Replays.forEach((s) => s.resize()); }); return; }
  const clock = $('#pre b'); const secs = ['09:29:57', '09:29:58', '09:29:59', '09:30:00']; let k = 0;
  const tick = setInterval(() => { k = Math.min(3, k + 1); clock.textContent = secs[k]; }, 320);
  Promise.all([fonts, ready, new Promise((r) => setTimeout(r, 1050))]).then(() => {
    clearInterval(tick); clock.textContent = secs[3];
    gsap.timeline({ onComplete: () => pre.classList.add('gone') })
      .to('#pre .bell', { scaleX: 1, duration: 0.45, ease: 'expo.inOut' })
      .to('#pre .clock', { opacity: 0, duration: 0.2 }, '-=0.1')
      .add(() => { const c = $('#chartCanvas'); if (c) { Replays.forEach((s) => s.resize()); } Landing.intro(); })
      .to('#pre .top', { yPercent: -101, duration: 0.9, ease: 'expo.inOut' }, '<')
      .to('#pre .bot', { yPercent: 101, duration: 0.9, ease: 'expo.inOut' }, '<')
      .to('#pre .bell', { opacity: 0, duration: 0.3 }, '<');
  });
})();
