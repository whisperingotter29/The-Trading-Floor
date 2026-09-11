/* ============ CHART ENGINE ============ */
const SYMBOLS = {
  MES: { name: 'Micro E-mini S&P', base: 6480, tick: 0.25, vol: 2.4, dp: 2, ppt: 5 },
  MNQ: { name: 'Micro E-mini Nasdaq', base: 23850, tick: 0.25, vol: 11, dp: 2, ppt: 2 },
  MGC: { name: 'Micro Gold', base: 3642, tick: 0.1, vol: 1.7, dp: 1, ppt: 10 },
  MCL: { name: 'Micro Crude', base: 63.4, tick: 0.01, vol: 0.09, dp: 2, ppt: 100 },
  M6E: { name: 'Micro Euro FX', base: 1.172, tick: 0.0001, vol: 0.00045, dp: 4, ppt: 12500 },
  ES:  { name: 'E-mini S&P', base: 6480, tick: 0.25, vol: 2.4, dp: 2, ppt: 50 },
  NQ:  { name: 'E-mini Nasdaq', base: 23850, tick: 0.25, vol: 11, dp: 2, ppt: 20 },
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const roundTick = (p, t) => Math.round(p / t) * t;
function fmtPrice(p, sym) { const s = SYMBOLS[sym] || SYMBOLS.MES; return Number(p).toLocaleString('en-US', { minimumFractionDigits: s.dp, maximumFractionDigits: s.dp }); }

/* Build a plausible session with one trade in it.
   Long win: drift, sweep of recent lows, displacement candle, run to target. */
function genTrade({ seed = 1, sym = 'MES', side = 'long', outcome = 'win', rr = 2.5, n = 72, entryIdx = 40 }) {
  const S = SYMBOLS[sym] || SYMBOLS.MES;
  const r = mulberry32(seed * 9301 + 49297);
  const v = S.vol;
  const c = []; let price = S.base;
  const push = (drift, noise = 1, wick = 0.6) => {
    const open = price;
    const close = open + drift * v + gauss(r) * v * noise;
    const hi = Math.max(open, close) + Math.abs(gauss(r)) * v * wick;
    const lo = Math.min(open, close) - Math.abs(gauss(r)) * v * wick;
    c.push({ o: open, h: hi, l: lo, c: close }); price = close;
  };
  // phase 1: meander with slight fall
  for (let i = 0; i < entryIdx - 5; i++) push(Math.sin(i / 7 + seed) * 0.35 - 0.08, 0.95);
  // phase 2: sweep of lows
  for (let i = 0; i < 5; i++) push(-0.55 - r() * 0.3, 0.7, 0.9);
  // entry candle: displacement
  { const open = price; const close = open + v * (3.2 + r() * 1.2);
    c.push({ o: open, h: close + v * 0.3, l: open - v * (1.1 + r() * 0.6), c: close }); price = close; }
  const entry = c[entryIdx].c;
  let lowest = Infinity; for (let i = entryIdx - 6; i <= entryIdx; i++) lowest = Math.min(lowest, c[i].l);
  const stop = lowest - v * 0.35; const R = entry - stop; const target = entry + rr * R;
  let exitIdx = -1, exit = entry;
  const post = n - entryIdx - 1;
  if (outcome === 'win') {
    const runLen = Math.max(8, Math.floor(post * 0.6));
    const d = (target - entry) / runLen / v * 1.15;
    for (let i = 0; i < post; i++) {
      if (exitIdx < 0) push(d + (i % 5 === 3 ? -d * 1.6 : 0), 0.75);
      else push(Math.sin(i / 3) * 0.25, 0.9);
      const k = c.length - 1;
      if (exitIdx < 0 && c[k].h >= target) { exitIdx = k; exit = target; c[k].h = Math.max(c[k].h, target + v * 0.2); }
    }
    if (exitIdx < 0) { exitIdx = n - 1; exit = c[n - 1].c; }
  } else {
    const upLen = 6; for (let i = 0; i < upLen; i++) push(0.4, 0.7);
    const d = -(c[c.length - 1].c - stop) / 8 / v * 1.2;
    for (let i = upLen; i < post; i++) {
      if (exitIdx < 0) push(d, 0.8); else push(Math.sin(i / 3) * 0.3 - 0.1, 0.9);
      const k = c.length - 1;
      if (exitIdx < 0 && c[k].l <= stop) { exitIdx = k; exit = stop; }
    }
    if (exitIdx < 0) { exitIdx = n - 1; exit = c[n - 1].c; }
  }
  // mirror for shorts
  if (side === 'short') {
    const m = (x) => 2 * S.base - x;
    c.forEach((k) => { const h = m(k.l), l = m(k.h); k.o = m(k.o); k.c = m(k.c); k.h = h; k.l = l; });
    return finalize(c, sym, side, m(entry), m(stop), m(target), m(exit), entryIdx, exitIdx, outcome, rr);
  }
  return finalize(c, sym, side, entry, stop, target, exit, entryIdx, exitIdx, outcome, rr);
}
function finalize(c, sym, side, entry, stop, target, exit, entryIdx, exitIdx, outcome, rr) {
  const t = (SYMBOLS[sym] || SYMBOLS.MES).tick;
  const q = (x) => roundTick(x, t);
  const e = q(entry), s = q(stop), tg = q(target), x = q(exit);
  const R = Math.abs(e - s) || t;
  const res = ((side === 'long' ? x - e : e - x) / R);
  return { candles: c, sym, side, entry: e, stop: s, target: tg, exit: x, entryIdx, exitIdx, r: Math.round(res * 10) / 10, outcome, rr };
}

/* Build a chart from a user-entered ticket so uploads without media still get a chart. */
function tradeFromTicket(t, seed) {
  const win = t.side === 'long' ? t.exit >= t.entry : t.exit <= t.entry;
  const rr = Math.max(0.6, Math.min(6, Math.abs(t.target - t.entry) / Math.max(Math.abs(t.entry - t.stop), 1e-9)));
  const g = genTrade({ seed, sym: t.sym, side: t.side, outcome: win ? 'win' : 'loss', rr });
  // re-map the generated prices onto the user's real levels
  const lin = (a1, b1, a2, b2) => (x) => a2 + (x - a1) * (b2 - a2) / ((b1 - a1) || 1e-9);
  const f = lin(g.entry, g.stop, t.entry, t.stop);
  g.candles.forEach((k) => { const o = f(k.o), cc = f(k.c), h = f(k.h), l = f(k.l); k.o = o; k.c = cc; k.h = Math.max(h, l); k.l = Math.min(h, l); });
  Object.assign(g, { entry: t.entry, stop: t.stop, target: t.target, exit: t.exit });
  const R = Math.abs(t.entry - t.stop) || 1e-9;
  g.r = Math.round(((t.side === 'long' ? t.exit - t.entry : t.entry - t.exit) / R) * 10) / 10;
  return g;
}

const THEMES = {
  board: { bg: '#081711', grid: 'rgba(230,237,231,0.06)', ink: '#E6EDE7', muted: 'rgba(230,237,231,0.42)', hi: '#18A583', label: 'rgba(230,237,231,0.5)' },
  paper: { bg: '#EFE9D8', grid: 'rgba(27,26,22,0.08)', ink: '#1B1A16', muted: 'rgba(27,26,22,0.45)', hi: '#1B1A16', label: 'rgba(27,26,22,0.55)' },
};

/* opts: count (candles shown), tp (trade path progress 0-1), theme, axis */
function drawChart(ctx, W, H, g, opts = {}) {
  const th = THEMES[opts.theme || 'board'];
  const n = g.candles.length; const count = Math.min(n, opts.count ?? n); const tp = opts.tp ?? 1;
  const padL = W * 0.05, padR = opts.axis === false ? W * 0.05 : W * 0.16, padT = H * 0.1, padB = H * 0.1;
  const win = opts.win && opts.win < n ? opts.win : 0; const a0 = win ? Math.max(0, count - win) : 0; const slots = win || n;
  let lo = Infinity, hi = -Infinity;
  for (let i = a0; i < (win ? count : n); i++) { const k = g.candles[i]; lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }
  if (!win || count > g.entryIdx) { lo = Math.min(lo, g.stop, g.target); hi = Math.max(hi, g.stop, g.target); }
  const span = hi - lo; lo -= span * 0.04; hi += span * 0.04;
  const X = (i) => padL + (i - a0 + 0.5) * ((W - padL - padR) / slots);
  const Y = (p) => padT + (1 - (p - lo) / (hi - lo)) * (H - padT - padB);
  const cw = ((W - padL - padR) / slots) * 0.62;
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  // grid
  ctx.strokeStyle = th.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) { const y = Math.round(padT + i * (H - padT - padB) / 5) + 0.5; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR + W * 0.02, y); ctx.stroke(); }
  // levels
  const showTrade = count > g.entryIdx;
  if (showTrade) {
    const x0 = Math.max(padL, X(g.entryIdx));
    ctx.setLineDash([Math.max(3, W * 0.008), Math.max(3, W * 0.008)]); ctx.lineWidth = Math.max(1, W / 600);
    ctx.strokeStyle = th.muted; ctx.beginPath(); ctx.moveTo(x0, Y(g.stop)); ctx.lineTo(W - padR, Y(g.stop)); ctx.stroke();
    ctx.strokeStyle = th.ink; ctx.beginPath(); ctx.moveTo(x0, Y(g.target)); ctx.lineTo(W - padR, Y(g.target)); ctx.stroke();
    ctx.setLineDash([]);
  }
  // candles
  const lw = Math.max(1, W / 700);
  for (let i = a0; i < count; i++) {
    const k = g.candles[i]; const x = X(i); const up = k.c >= k.o;
    const yO = Y(k.o), yC = Y(k.c), yH = Y(k.h), yL = Y(k.l);
    const top = Math.min(yO, yC), bh = Math.max(1, Math.abs(yC - yO));
    const isEntry = i === g.entryIdx && opts.litEntry;
    ctx.strokeStyle = isEntry ? th.hi : th.ink; ctx.fillStyle = isEntry ? th.hi : th.ink; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, top); ctx.moveTo(x, top + bh); ctx.lineTo(x, yL); ctx.stroke();
    if (up && !isEntry) { ctx.strokeRect(x - cw / 2 + lw / 2, top + lw / 2, cw - lw, Math.max(1, bh - lw)); }
    else ctx.fillRect(x - cw / 2, top, cw, bh);
  }
  // trade path
  if (showTrade) {
    const xe = X(g.entryIdx), ye = Y(g.entry);
    const lastI = Math.min(count - 1, g.exitIdx);
    const pr = g.exitIdx > g.entryIdx ? Math.min(1, (lastI - g.entryIdx) / (g.exitIdx - g.entryIdx)) * tp : tp;
    const xx = xe + (X(g.exitIdx) - xe) * pr, yy = ye + (Y(g.exit) - ye) * pr;
    ctx.strokeStyle = th.hi; ctx.lineWidth = Math.max(2, W / 260);
    ctx.beginPath(); ctx.moveTo(xe, ye); ctx.lineTo(xx, yy); ctx.stroke();
    // entry marker
    const s = Math.max(5, W / 70); ctx.fillStyle = th.hi; ctx.beginPath();
    if (g.side === 'long') { ctx.moveTo(xe, ye + s * 0.3); ctx.lineTo(xe - s * 0.7, ye + s * 1.5); ctx.lineTo(xe + s * 0.7, ye + s * 1.5); }
    else { ctx.moveTo(xe, ye - s * 0.3); ctx.lineTo(xe - s * 0.7, ye - s * 1.5); ctx.lineTo(xe + s * 0.7, ye - s * 1.5); }
    ctx.fill();
    if (pr >= 1 && count > g.exitIdx) { ctx.beginPath(); ctx.arc(X(g.exitIdx), Y(g.exit), s * 0.55, 0, Math.PI * 2); ctx.fill(); }
  }
  // right axis tags
  if (opts.axis !== false && showTrade) {
    const fs = Math.max(10, Math.round(W / 38)); ctx.font = `600 ${fs}px "Big Shoulders Text", "Archivo Narrow", sans-serif`;
    const tag = (label, p, fill, color) => {
      const y = Y(p); const txt = `${label} ${fmtPrice(p, g.sym)}`; const tw = ctx.measureText(txt).width + fs * 0.8;
      const x = W - padR + W * 0.02; ctx.fillStyle = fill; ctx.fillRect(x, y - fs * 0.75, tw, fs * 1.5);
      ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + fs * 0.4, y + 1);
    };
    tag('TP', g.target, th.ink, th.bg); tag('SL', g.stop, 'transparent', th.muted); tag('IN', g.entry, th.hi, '#04130D');
  }
  return { X, Y, cw };
}

const _chartCache = new Map();
function chartImage(g, key, w = 800, h = 1000, theme = 'board') {
  const k = `${key}-${w}-${h}-${theme}`; if (_chartCache.has(k)) return _chartCache.get(k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  drawChart(cv.getContext('2d'), w, h, g, { theme, litEntry: true });
  const url = cv.toDataURL('image/png'); _chartCache.set(k, url); return url;
}

/* Replay controller: animates a canvas like a trade video. */
const Replays = new Set();
function mountReplay(canvas, g, { autoplay = true, duration = 9000, onTick } = {}) {
  const ctx = canvas.getContext('2d');
  const st = { t: 0, playing: false, last: 0, raf: 0, g, canvas };
  const start = Math.max(8, g.entryIdx - 22);
  const size = () => { const r = canvas.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); canvas.width = Math.max(10, r.width * d); canvas.height = Math.max(10, r.height * d); };
  const render = () => {
    const p = st.t; const n = g.candles.length;
    const count = Math.floor(start + (n - start) * Math.min(1, p / 0.85));
    const tp = count > g.exitIdx ? 1 : 1;
    drawChart(ctx, canvas.width, canvas.height, g, { count, tp, litEntry: true, win: canvas.width / canvas.height < 0.9 ? 34 : 0 });
    onTick && onTick(p);
  };
  const loop = (ts) => {
    if (!st.playing) return;
    const dt = st.last ? ts - st.last : 16; st.last = ts;
    st.t += dt / duration; if (st.t > 1) st.t = 0;
    render(); st.raf = requestAnimationFrame(loop);
  };
  st.play = () => { if (st.playing) return; st.playing = true; st.last = 0; st.raf = requestAnimationFrame(loop); };
  st.pause = () => { st.playing = false; cancelAnimationFrame(st.raf); };
  st.toggle = () => (st.playing ? st.pause() : st.play());
  st.seek = (p) => { st.t = p; render(); };
  st.resize = () => { size(); render(); };
  st.destroy = () => { st.pause(); Replays.delete(st); st.io && st.io.disconnect(); };
  size(); st.t = 0.55; render();
  if (autoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    st.io = new IntersectionObserver((es) => es.forEach((e) => (e.intersectionRatio > 0.55 ? st.play() : st.pause())), { threshold: [0, 0.55, 1] });
    st.io.observe(canvas);
  }
  Replays.add(st); return st;
}
function destroyReplays() { Replays.forEach((s) => s.destroy()); }
window.addEventListener('resize', () => Replays.forEach((s) => s.resize()));
