/* ============ HELPERS ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compact = (n) => (n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k' : n >= 1e3 ? n.toLocaleString('en-US') : String(n));
const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); if (m < 60) return m + 'm'; const h = Math.round(m / 60); if (h < 24) return h + 'h'; return Math.round(h / 24) + 'd'; };
const rTxt = (r) => (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(1) + 'R';
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'strategy';
const has = (v) => v !== '' && v != null && isFinite(Number(v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2400); }

const I = {
  floor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v4M6 17v4M12 2v5M12 17v5M18 5v4M18 15v4"/><rect x="4" y="7" width="4" height="10"/><rect x="10" y="7" width="4" height="10"/><rect x="16" y="9" width="4" height="6"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="20"/><path d="M10 9l5 3-5 3z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  discover: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  builder: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18"/><path d="M10 6h4"/><circle cx="12" cy="11.5" r="2.8"/><path d="M7.5 18.5c1.2-2.6 7.8-2.6 9 0"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-8.7-8.9A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.7 3.5C19 15.6 12 20 12 20z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H10l-6 4z"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-5-6 5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px;fill:currentColor;stroke:none"><path d="M6 4l14 8-14 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px;fill:currentColor;stroke:none"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
};
const badge = (h, s = 40) => { const u = U(h) || { badge: '???', tone: 'board' }; return `<span class="badge t-${u.tone}" style="--s:${s}px" aria-hidden="true">${esc(u.badge)}</span>`; };

/* ============ ACCOUNTS ============ */
/* Nobody has an account when the site first loads. Anything that creates
   content (posting, liking, commenting, following, publishing) asks the
   visitor to create one first, then carries on with what they were doing. */
function need(then) { if (ME) return true; openSignup({ then }); return false; }
function openSignup({ then, badgeHint = '' } = {}) {
  const others = Object.values(USERS);
  const su = { tone: 'floor', markets: new Set() };
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="suH" style="width:min(560px,100%)"><header><h2 id="suH">Create your account</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header>
    <div class="su">
      <p class="su-lead">Pick a name, a handle and a three-letter badge. The badge goes on every trade you post.</p>
      ${others.length ? `<div class="field"><span>Or continue as</span><div class="su-existing">${others.map((u) => `<button type="button" class="chip su-pick" data-h="${esc(u.handle)}">${badge(u.handle, 22)} @${esc(u.handle)}</button>`).join('')}</div></div>` : ''}
      <div class="su-row"><div class="su-badge" id="suBadge">${esc(badgeHint || '???')}</div>
        <div class="su-fields">
          <label class="field"><span>Display name</span><input class="input" id="suName" maxlength="40" autocomplete="name" placeholder="Arjun"></label>
          <label class="field"><span>Handle</span><input class="input" id="suHandle" maxlength="20" autocomplete="username" placeholder="arjun.trades" spellcheck="false"></label>
        </div></div>
      <div class="g2"><label class="field"><span>Badge (3 letters)</span><input class="input su-badge-in" id="suBadgeIn" maxlength="3" value="${esc(badgeHint)}" placeholder="ARJ" spellcheck="false" autocomplete="off"></label>
        <div class="field"><span>Badge colour</span><div class="themes" role="group" aria-label="Badge colour">${[['floor', '#FFD21F', 'Floor yellow'], ['paper', '#EFE9D8', 'Ticket paper'], ['board', '#1E2226', 'Dark board']].map(([k, c, l]) => `<button type="button" class="su-tone" data-v="${k}" style="background:${c}" aria-label="${l}" aria-pressed="${k === 'floor'}"></button>`).join('')}</div></div></div>
      <div class="field"><span>Markets you trade (optional)</span><div class="su-markets">${Object.keys(SYMBOLS).map((m) => `<button type="button" class="chip su-mk" data-m="${m}" aria-pressed="false">${m}</button>`).join('')}</div></div>
      <label class="field"><span>Bio (optional)</span><textarea class="input" id="suBio" maxlength="160" placeholder="What you trade and when"></textarea></label>
      <div class="err" id="suErr" role="alert"></div>
      <button class="btn btn-floor" id="suGo">Create account</button>
    </div></div>`);
  const m = $('#modal'); const badgeEl = $('#suBadge');
  const syncBadge = () => { badgeEl.textContent = $('#suBadgeIn').value || '???'; badgeEl.className = 'su-badge t-' + su.tone; };
  $('#suBadgeIn').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); syncBadge(); });
  $('#suHandle').addEventListener('input', (e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); });
  $('#suName').addEventListener('input', (e) => { const b = $('#suBadgeIn'); if (!b.dataset.touched) { b.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); syncBadge(); } });
  $('#suBadgeIn').addEventListener('keydown', (e) => { e.target.dataset.touched = '1'; });
  $$('.su-tone', m).forEach((b) => b.addEventListener('click', () => { su.tone = b.dataset.v; $$('.su-tone', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); syncBadge(); }));
  $$('.su-mk', m).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.m; su.markets.has(k) ? su.markets.delete(k) : su.markets.add(k); b.setAttribute('aria-pressed', su.markets.has(k)); }));
  $$('.su-pick', m).forEach((b) => b.addEventListener('click', () => { ME = b.dataset.h; closeModal(); render(true); toast('Signed in as @' + ME); then && then(); }));
  syncBadge();
  $('#suGo').addEventListener('click', () => {
    const name = $('#suName').value.trim(), handle = $('#suHandle').value.trim(), bdg = $('#suBadgeIn').value.trim(), err = $('#suErr');
    if (!name) return (err.textContent = 'Add a display name.');
    if (!/^[a-z0-9._]{3,20}$/.test(handle)) return (err.textContent = 'Handles are 3 to 20 characters: lowercase letters, numbers, dots and underscores.');
    if (USERS[handle]) return (err.textContent = '@' + handle + ' is taken. Try another handle.');
    if (!/^[A-Z]{3}$/.test(bdg)) return (err.textContent = 'Badges are exactly three letters.');
    if (Object.values(USERS).some((u) => u.badge === bdg)) return (err.textContent = 'Badge ' + bdg + ' is taken. Pick another three letters.');
    USERS[handle] = { handle, badge: bdg, name, bio: $('#suBio').value.trim(), markets: [...su.markets], followers: 0, following: 0, tone: su.tone, joined: Date.now() };
    ME = handle; closeModal(); render(true); toast('Welcome to the floor, @' + handle);
    then && then();
  });
  setTimeout(() => $('#suName')?.focus(), 30);
}

/* ============ POST PARTS ============ */
function ticketStrip(p) {
  const k = p.tk; if (!k) return '';
  return `<div class="ticket"><div class="ticket-strip">
    <div class="tf"><b>Side</b><i>${k.side === 'long' ? 'Long' : 'Short'} ${esc(p.sym)}</i></div>
    <div class="tf"><b>Entry</b><i>${fmtPrice(k.entry, p.sym)}</i></div>
    <div class="tf"><b>Stop</b><i>${fmtPrice(k.stop, p.sym)}</i></div>
    <div class="tf hide-m"><b>Target</b><i>${isFinite(k.target) ? fmtPrice(k.target, p.sym) : '–'}</i></div>
    <div class="tf hide-m"><b>Exit</b><i>${fmtPrice(k.exit, p.sym)}</i></div>
    <div class="stamp ${k.r > 0 ? 'win' : 'loss'}">${rTxt(k.r)}</div>
  </div></div>`;
}
function mediaHTML(p, { reel = false } = {}) {
  const tag = `<span class="tagl">${esc(p.sym)} ${esc(p.tf)}</span>`;
  if (p.type === 'video') return `<video src="${p.url}" playsinline muted loop preload="metadata" data-auto ${reel ? '' : 'controls'}></video>${tag}${reel ? '<span class="mute" aria-hidden="true">Tap for sound</span>' : ''}`;
  return `<img src="${p.url}" alt="Chart posted by ${esc(p.user)}">${tag}`;
}
function postHTML(p) {
  const u = U(p.user); const s = p.strategy && S(p.strategy); const liked = state.liked.has(p.id); const saved = state.saved.has(p.id);
  const cm = p.comments.slice(-2).map((c) => `<div><a href="#/u/${esc(c.u)}">${esc(c.u)}</a>${esc(c.t)}</div>`).join('');
  return `<article class="post" data-post="${p.id}">
    <div class="post-h">${badge(p.user)}<div class="who"><a href="#/u/${esc(p.user)}">${esc(u.handle)}</a><small>${esc(p.sym)} ${esc(p.tf)}, ${esc(p.session)} session</small></div>
      ${s ? `<a class="strat-link" href="#/s/${s.id}" title="${esc(s.title)}">${esc(s.title)}</a>` : ''}</div>
    <div class="media" data-act="dbl-like" data-id="${p.id}">${mediaHTML(p)}
      <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFD21F" d="M12 20s-7-4.4-8.7-8.9A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.7 3.5C19 15.6 12 20 12 20z"/></svg></div>
    <div class="acts">
      <button class="act" data-act="like" data-id="${p.id}" aria-pressed="${liked}" aria-label="Like">${I.heart}<span>${compact(p.likes)}</span></button>
      <button class="act" data-act="focus-cmt" data-id="${p.id}" aria-label="Comment">${I.comment}<span>${p.comments.length}</span></button>
      <button class="act save" data-act="save" data-id="${p.id}" aria-pressed="${saved}" aria-label="Save">${I.save}</button>
    </div>
    ${ticketStrip(p)}
    ${p.caption ? `<p class="caption"><a href="#/u/${esc(p.user)}">${esc(u.handle)}</a>${esc(p.caption)}</p>` : ''}
    <div class="cmts">${cm}</div>
    <form class="cmt-form" data-act="comment" data-id="${p.id}"><label class="sr" for="c-${p.id}">Add a comment</label><input class="input" id="c-${p.id}" placeholder="Add a comment" autocomplete="off" maxlength="280"><button class="btn btn-line btn-sm">Post</button></form>
    <div class="post-time">${ago(p.t)} ago</div>
  </article>`;
}
/* Videos play muted when they are mostly on screen and pause when they leave, like a social feed. */
let _vio;
function hydrateMedia(root = document) {
  if (!_vio) _vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.intersectionRatio > 0.6 && !reduced) v.play().catch(() => {}); else v.pause(); }), { threshold: [0, 0.6, 1] });
  $$('video[data-auto]', root).forEach((v) => _vio.observe(v));
}
function destroyMedia() { if (_vio) { _vio.disconnect(); _vio = null; } }

/* ============ SHELL ============ */
const NAV = [['floor', 'The Floor', I.floor], ['replays', 'Replays', I.replay], ['discover', 'Discover strategies', I.discover], ['builder', 'Strategy builder', I.builder], ['me', 'Profile', I.profile]];
function shell(active, inner) {
  const me = ME && U(ME);
  const links = NAV.map(([k, l, ic]) => `<a href="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
  const tabs = NAV.map(([k, l, ic]) => `<a href="#/${k}" aria-label="${l}" ${active === k ? 'aria-current="page"' : ''}>${ic}</a>`).join('');
  return `<div class="shell">
    <aside class="rail"><a class="mark" href="#/">The<br>Trading<br>Floor</a>
      <nav aria-label="Main">${links}</nav>
      <button class="btn btn-floor" data-act="compose">${I.plus}Post a trade</button>
      ${me ? `<a class="me" href="#/me">${badge(ME, 36)}<div><strong>${esc(me.handle)}</strong><small>Badge ${esc(me.badge)}</small></div></a>`
        : `<div class="me-empty"><p>You are not signed in.</p><button class="btn btn-line" data-act="signup">Create account</button></div>`}
    </aside>
    <header class="topbar"><a class="mark" href="#/">The Trading Floor</a>${me ? `<button class="btn btn-floor btn-sm" data-act="compose">${I.plus}Post</button>` : `<button class="btn btn-floor btn-sm" data-act="signup">Join</button>`}</header>
    <main class="main" id="main">${inner}</main>
    <nav class="tabbar" aria-label="Main">${tabs}</nav>
  </div>`;
}
const emptyBlock = (title, text, cta = '') => `<div class="void"><div class="void-mark" aria-hidden="true"><i></i><i></i><i></i></div><h2>${title}</h2><p>${text}</p>${cta}</div>`;

/* ============ FEED ============ */
let feedFilter = 'all';
function feedView() {
  const f = feedFilter;
  let list = [...state.posts].sort((a, b) => b.t - a.t);
  if (f === 'following') list = list.filter((p) => state.following.has(p.user) || p.user === ME);
  if (f === 'photos') list = list.filter((p) => p.type === 'image');
  if (f === 'videos') list = list.filter((p) => p.type === 'video');
  if (f === 'wins') list = list.filter((p) => p.tk && p.tk.r > 0);
  if (f === 'losses') list = list.filter((p) => p.tk && p.tk.r <= 0);
  const chips = [['all', 'For you'], ['following', 'Following'], ['photos', 'Photos'], ['videos', 'Videos'], ['wins', 'Wins'], ['losses', 'Losses']]
    .map(([k, l]) => `<button class="chip" data-act="feed-filter" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join('');
  const tape = [...state.posts].filter((p) => p.tk).sort((a, b) => b.t - a.t).slice(0, 10);
  const tapeLi = tape.map((p) => `<li>${badge(p.user, 28)}<span><b>${esc(p.user)}</b> ${p.tk.side} ${esc(p.sym)}</span><i class="${p.tk.r > 0 ? 'w' : ''}">${rTxt(p.tk.r)}</i></li>`).join('');
  const rising = [...state.strategies].sort((a, b) => b.followers - a.followers).slice(0, 4)
    .map((s) => `<a class="mini-strat" href="#/s/${s.id}">${badge(s.user, 34)}<div><strong>${esc(s.title)}</strong><small>${esc(s.market)}, ${s.steps.length} steps, ${compact(s.followers)} following</small></div></a>`).join('');
  const none = !state.posts.length;
  const main = none
    ? emptyBlock('The floor is quiet.', 'Nobody has posted a trade yet. Upload a screenshot or a screen recording of a trade you took and yours will be the first thing everyone sees.', `<button class="btn btn-floor" data-act="compose">${I.plus}Post the first trade</button>`)
    : list.length ? list.map(postHTML).join('') : `<div class="empty">No posts match this filter yet.</div>`;
  return shell('floor', `<div class="cols"><section aria-label="Feed">
      ${none ? '' : `<div class="feed-tabs" role="group" aria-label="Filter feed">${chips}</div>`}
      ${main}
    </section>
    <aside class="side" aria-label="Live activity">
      <div><h3>The tape</h3>${tape.length ? `<div class="side-tape ${tape.length > 5 ? 'roll' : ''}"><ul>${tapeLi}${tape.length > 5 ? tapeLi : ''}</ul></div>` : '<p class="side-empty">Trades with entry, stop and exit show up here as they are posted.</p>'}</div>
      <div><h3>Strategies</h3>${rising || '<p class="side-empty">No strategies have been published yet.</p>'}<a class="btn btn-line btn-sm" style="margin-top:14px" href="#/${state.strategies.length ? 'discover' : 'builder'}">${state.strategies.length ? 'Discover strategies' : 'Build the first one'}</a></div>
    </aside></div>`);
}

/* ============ REPLAYS (vertical video feed) ============ */
function replaysView() {
  const list = state.posts.filter((p) => p.type === 'video').sort((a, b) => b.t - a.t);
  if (!list.length) return shell('replays', `<div class="page">${emptyBlock('No replays yet.', 'Replays are screen recordings of trades, uploaded as MP4, MOV or WebM. When someone posts one it plays here in a vertical feed.', `<button class="btn btn-floor" data-act="compose">${I.upload}Upload a screen recording</button>`)}</div>`);
  const reels = list.map((p) => { const s = p.strategy && S(p.strategy); const liked = state.liked.has(p.id);
    return `<section class="reel" data-post="${p.id}"><div class="phone"><div class="phone-screen media">${mediaHTML(p, { reel: true })}
      <div class="phone-ov"><div class="who">${badge(p.user, 28)}<a href="#/u/${esc(p.user)}">${esc(p.user)}</a></div>${p.caption ? `<p>${esc(p.caption)}</p>` : ''}${ticketStrip(p)}</div></div></div>
      <div class="reel-acts">
        <button class="act" data-act="like" data-id="${p.id}" aria-pressed="${liked}" aria-label="Like">${I.heart}<span>${compact(p.likes)}</span></button>
        <button class="act" data-act="open-post" data-id="${p.id}" aria-label="Comments">${I.comment}<span>${p.comments.length}</span></button>
        <button class="act" data-act="save" data-id="${p.id}" aria-pressed="${state.saved.has(p.id)}" aria-label="Save">${I.save}<span>Save</span></button>
        ${s ? `<a class="act" href="#/s/${s.id}" aria-label="Strategy: ${esc(s.title)}">${I.builder}<span>Strategy</span></a>` : ''}
      </div></section>`; }).join('');
  return shell('replays', `<div class="reels">${reels}</div>`);
}

/* ============ DISCOVER ============ */
const disc = { q: '', style: 'All', market: 'All', sort: 'followers' };
function scardHTML(s) {
  const u = U(s.user);
  return `<a class="scard" href="#/s/${s.id}"><div class="ticket">
    <div class="band t-${s.theme}"><span class="kind">${esc(s.style)}, ${esc(s.session)}</span><h3>${esc(s.title)}</h3></div>
    <div class="body"><p>${esc(s.tagline)}</p>
      <div class="by">${badge(s.user, 26)}<span>${esc(u ? u.handle : s.user)}</span></div>
      <div class="facts"><span>${esc(s.market)}</span><span>${s.steps.length} steps</span><span>${compact(s.followers)} following</span><span>${s.forks} forks</span></div></div>
  </div></a>`;
}
function discoverView() {
  const head = `<div class="page-h"><div><h1>Discover strategies</h1><p>Step-by-step playbooks published by traders on the floor. Follow one to see its trades in your feed, or fork it into your own.</p></div>
      <a class="btn btn-floor" href="#/builder">${I.plus}Build a strategy</a></div>`;
  if (!state.strategies.length) return shell('discover', `<div class="page">${head}${emptyBlock('No strategies yet.', 'Nobody has published a strategy. Write yours step by step in the builder and it becomes the first page in Discover.', `<a class="btn btn-floor" href="#/builder">Open the builder</a>`)}</div>`);
  const styles = ['All', ...new Set(state.strategies.map((s) => s.style))];
  const markets = ['All', ...new Set(state.strategies.map((s) => s.market))];
  return shell('discover', `<div class="page">${head}
    <div class="disc-tools"><label class="sr" for="dq">Search strategies</label><input id="dq" class="input" placeholder="Search by name, market or trader" value="${esc(disc.q)}" data-act="disc-q">
      <div style="display:flex;gap:8px"><label class="sr" for="dm">Market</label><select id="dm" class="input" data-act="disc-m">${markets.map((m) => `<option ${m === disc.market ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <label class="sr" for="ds">Sort</label><select id="ds" class="input" data-act="disc-s"><option value="followers" ${disc.sort === 'followers' ? 'selected' : ''}>Most followed</option><option value="new" ${disc.sort === 'new' ? 'selected' : ''}>Newest</option><option value="forks" ${disc.sort === 'forks' ? 'selected' : ''}>Most forked</option></select></div></div>
    <div class="disc-chips" role="group" aria-label="Style">${styles.map((s) => `<button class="chip" data-act="disc-style" data-v="${esc(s)}" aria-pressed="${disc.style === s}">${esc(s)}</button>`).join('')}</div>
    <div class="sgrid" id="sgrid"></div></div>`);
}
function renderDiscGrid() {
  const g = $('#sgrid'); if (!g) return;
  const q = disc.q.trim().toLowerCase();
  let list = state.strategies.filter((s) => (disc.style === 'All' || s.style === disc.style) && (disc.market === 'All' || s.market === disc.market)
    && (!q || [s.title, s.tagline, s.market, s.user, s.style].join(' ').toLowerCase().includes(q)));
  list.sort((a, b) => (disc.sort === 'new' ? b.created - a.created : disc.sort === 'forks' ? b.forks - a.forks : b.followers - a.followers));
  g.innerHTML = list.length ? list.map(scardHTML).join('') : `<div class="empty" style="grid-column:1/-1">No strategies match. Try another market or style.</div>`;
}

/* ============ STRATEGY SITE ============ */
function stepShot(st) { return st.img ? `<div class="shot"><img src="${st.img}" alt="Example for ${esc(st.title)}"></div>` : ''; }
function strategyHTML(s, { preview = false } = {}) {
  const u = U(s.user) || { handle: 'your-handle', badge: '???', tone: 'board' };
  const following = state.followedStrategies.has(s.id); const mine = ME && s.user === ME;
  const steps = (s.steps.length ? s.steps : [{ kind: 'Setup', title: 'Your first step', body: 'Add steps on the left.', checks: [] }]).map((st, i) => {
    const shot = stepShot(st);
    return `<div class="sp-step"><div class="idx">${String(i + 1).padStart(2, '0')}</div><div class="ticket ${shot ? '' : 'nochart'}"><div>
      <div class="kind">${esc(st.kind)}</div><h3>${esc(st.title || 'Untitled step')}</h3><p>${esc(st.body)}</p>
      ${st.checks && st.checks.length ? `<ul class="checks">${st.checks.map((c) => `<li><label><input type="checkbox" ${preview ? 'tabindex="-1"' : ''} aria-label="${esc(c)}"><span>${esc(c)}</span></label></li>`).join('')}</ul>` : ''}
    </div>${shot}</div></div>`; }).join('');
  const used = preview ? [] : state.posts.filter((p) => p.strategy === s.id);
  const st = s.stats || {};
  return `<div class="sp t-${s.theme}">
    <div class="sp-url"><span class="dots"><i></i><i></i><i></i></span>thetradingfloor.app/<b>@${esc(u.handle)}/${esc(s.id || slug(s.title))}</b></div>
    <header class="sp-cover"><div class="meta"><span>${esc(s.market)}</span><span>${esc(s.session)} session</span><span>${esc(s.timeframe)}</span><span>${esc(s.style)}</span></div>
      <h1>${esc(s.title || 'Untitled strategy')}</h1><p class="tag">${esc(s.tagline)}</p>
      <div class="by">${badge(s.user, 44)}<div class="who"><a href="#/u/${esc(u.handle)}"><strong>${esc(u.handle)}</strong></a><small>${compact(s.followers || 0)} following, ${s.forks || 0} forks</small></div>
      ${preview ? '' : mine ? `<a class="btn btn-floor" href="#/builder?edit=${s.id}">Edit strategy</a>` : `<button class="btn btn-floor" data-act="follow-strat" data-id="${s.id}" aria-pressed="${following}">${following ? 'Following' : 'Follow strategy'}</button><button class="btn btn-line" data-act="fork" data-id="${s.id}">Fork into builder</button>`}</div></header>
    <div class="sp-stats"><div><b>${has(st.winRate) ? st.winRate + '%' : '–'}</b><small>Win rate</small></div><div><b>${has(st.avgR) ? st.avgR + 'R' : '–'}</b><small>Average winner</small></div><div><b>${has(st.sample) ? st.sample : '–'}</b><small>Trades logged</small></div>
      <div class="note">Numbers are reported by the author and are not verified by The Trading Floor.</div></div>
    <section class="sp-steps" aria-label="Steps">${steps}</section>
    ${used.length ? `<section class="sp-used"><h2>Trades using this strategy</h2><div class="thumbs">${used.map(thumbHTML).join('')}</div></section>` : ''}
  </div>`;
}
function strategyView(id) {
  const s = S(id); if (!s) return shell('discover', `<div class="page">${emptyBlock('Strategy not found.', 'That strategy does not exist or was removed.', `<a class="btn btn-floor" href="#/discover">Discover strategies</a>`)}</div>`);
  return shell('discover', strategyHTML(s));
}

/* ============ PROFILE ============ */
let profTab = 'posts';
function thumbHTML(p) {
  return `<button class="thumb" data-act="open-post" data-id="${p.id}" aria-label="Open ${esc(p.sym)} post${p.tk ? ', ' + rTxt(p.tk.r) : ''}">${p.type === 'image' ? `<img src="${p.url}" alt="" loading="lazy">` : `<video src="${p.url}#t=0.1" muted playsinline preload="metadata"></video>`}
    ${p.tk ? `<span class="r ${p.tk.r > 0 ? 'w' : ''}">${rTxt(p.tk.r)}</span>` : ''}${p.type === 'video' ? '<span class="rp">Video</span>' : ''}</button>`;
}
function meView() {
  if (ME) return profileView(ME);
  return shell('me', `<div class="page">${emptyBlock('You do not have an account yet.', 'Create one to post trades, upload replays, publish strategies and follow other traders. It takes about twenty seconds.', `<button class="btn btn-floor" data-act="signup">Create account</button>`)}</div>`);
}
function profileView(h) {
  const u = U(h); if (!u) return shell('discover', `<div class="page">${emptyBlock('No trader with that handle.', 'Nobody has signed up as @' + esc(h) + '.', `<a class="btn btn-floor" href="#/floor">Back to the floor</a>`)}</div>`);
  const posts = state.posts.filter((p) => p.user === h).sort((a, b) => b.t - a.t);
  const strats = state.strategies.filter((s) => s.user === h);
  const tked = posts.filter((p) => p.tk); const wins = tked.filter((p) => p.tk.r > 0).length; const me = h === ME; const fol = state.following.has(h);
  const net = tked.reduce((a, p) => a + p.tk.r, 0);
  let body = '';
  if (profTab === 'posts') body = posts.length ? `<div class="thumbs">${posts.map(thumbHTML).join('')}</div>` : `<div class="empty">No trades posted yet.${me ? '<br><button class="btn btn-floor" data-act="compose">Post your first trade</button>' : ''}</div>`;
  if (profTab === 'replays') { const r = posts.filter((p) => p.type === 'video'); body = r.length ? `<div class="thumbs">${r.map(thumbHTML).join('')}</div>` : `<div class="empty">No replays yet.${me ? '<br><button class="btn btn-floor" data-act="compose">Upload a screen recording</button>' : ''}</div>`; }
  if (profTab === 'strategies') body = strats.length ? `<div class="sgrid">${strats.map(scardHTML).join('')}</div>` : `<div class="empty">No strategies published.${me ? '<br><a class="btn btn-floor" href="#/builder">Build a strategy</a>' : ''}</div>`;
  return shell(me ? 'me' : 'discover', `<div class="page"><header class="prof">${badge(h, 150)}<div>
      <h1>${esc(u.name)}</h1><div class="h">@${esc(u.handle)}, badge ${esc(u.badge)}</div>${u.bio ? `<p>${esc(u.bio)}</p>` : ''}
      <div class="stats"><span><b>${posts.length}</b>posts</span>${tked.length ? `<span><b>${wins}/${tked.length}</b>winners</span><span><b>${rTxt(Math.round(net * 10) / 10)}</b>net</span>` : ''}<span><b>${compact(u.followers)}</b>followers</span><span><b>${strats.length}</b>strategies</span></div>
      <div class="row">${me ? `<button class="btn btn-floor" data-act="compose">${I.plus}Post a trade</button><a class="btn btn-line" href="#/builder">New strategy</a><button class="btn btn-line" data-act="signout">Sign out</button>` : `<button class="btn ${fol ? 'btn-line' : 'btn-floor'}" data-act="follow" data-h="${esc(h)}">${fol ? 'Following' : 'Follow'}</button>`}
      ${u.markets.map((m) => `<span class="chip" style="display:inline-grid;place-items:center">${esc(m)}</span>`).join('')}</div>
    </div></header>
    <div class="tabs" role="tablist">${[['posts', 'Posts'], ['replays', 'Replays'], ['strategies', 'Strategies']].map(([k, l]) => `<button role="tab" aria-selected="${profTab === k}" data-act="prof-tab" data-t="${k}">${l}</button>`).join('')}</div>
    ${body}</div>`);
}

/* ============ POST MODAL ============ */
function openPostModal(id) {
  const p = P(id); if (!p) return;
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="Post by ${esc(p.user)}" style="width:min(620px,100%)"><header><h2>@${esc(p.user)}</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header><div style="padding:20px">${postHTML(p)}</div></div>`);
}
function openModal(html) {
  closeModal(); const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = html; m.id = 'modal';
  m.addEventListener('mousedown', (e) => { if (e.target === m) closeModal(); });
  document.body.appendChild(m); document.body.style.overflow = 'hidden'; hydrateMedia(m);
  const f = m.querySelector('input, button, select, textarea'); f && f.focus({ preventScroll: true });
}
function closeModal() { const m = $('#modal'); if (m) { $$('video', m).forEach((v) => v.pause()); m.remove(); document.body.style.overflow = ''; } }
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ============ COMPOSER ============ */
/* A post is an uploaded image or video. The trade ticket is optional:
   fill in entry, stop and exit and the post gets a ticket strip with the result in R. */
let cmp;
function openComposer() {
  if (!need(openComposer)) return;
  const me = U(ME);
  cmp = { side: 'long', sym: me.markets[0] || 'MES', tf: '5m', session: 'New York', entry: '', stop: '', target: '', exit: '', caption: '', strategy: '', file: null, ftype: null };
  const mine = state.strategies.filter((s) => s.user === ME || state.followedStrategies.has(s.id));
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cmpH"><header><h2 id="cmpH">Post a trade</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header>
    <div class="compose"><div class="left">
      <div class="drop" id="drop"><div id="dropTxt">${I.upload.replace('<svg', '<svg class="drop-ic"')}<strong>Upload a screenshot or screen recording</strong>PNG, JPG, GIF, MP4, MOV or WebM, up to 200 MB. Drag it here or<br><label class="btn btn-line btn-sm" style="margin-top:14px">Choose file<input type="file" accept="image/*,video/mp4,video/quicktime,video/webm" id="cmpFile" class="sr"></label></div></div>
      <div class="drop-acts"><button class="btn btn-line btn-sm" data-act="cmp-clear" id="cmpClear" hidden>Remove file</button></div>
    </div>
    <div class="right">
      <div class="g3"><label class="field"><span>Market</span><select class="input" data-k="sym">${Object.keys(SYMBOLS).map((k) => `<option ${k === cmp.sym ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="field"><span>Timeframe</span><select class="input" data-k="tf">${['1m', '2m', '5m', '15m', '1h'].map((k) => `<option ${k === cmp.tf ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="field"><span>Session</span><select class="input" data-k="session">${['Asia', 'London', 'New York'].map((k) => `<option ${k === cmp.session ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <fieldset class="tk-set"><legend>Trade ticket <em>optional</em></legend>
        <div class="seg" role="group" aria-label="Side"><button type="button" data-side="long" aria-pressed="true">Long</button><button type="button" data-side="short" aria-pressed="false">Short</button></div>
        <div class="g2"><label class="field"><span>Entry</span><input class="input num" inputmode="decimal" data-k="entry"></label><label class="field"><span>Stop</span><input class="input num" inputmode="decimal" data-k="stop"></label>
          <label class="field"><span>Target</span><input class="input num" inputmode="decimal" data-k="target"></label><label class="field"><span>Exit</span><input class="input num" inputmode="decimal" data-k="exit"></label></div>
        <div class="rcalc" id="rcalc">Add entry, stop and exit to show the result in R on your post.</div></fieldset>
      ${mine.length ? `<label class="field"><span>Strategy used</span><select class="input" data-k="strategy"><option value="">None</option>${mine.map((s) => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Caption</span><textarea class="input" data-k="caption" maxlength="600" placeholder="What did you see, and why did you take it?"></textarea></label>
      <div class="err" id="cmpErr" role="alert"></div>
      <button class="btn btn-floor" data-act="cmp-post">Post to the floor</button>
    </div></div></div>`);
  const m = $('#modal');
  m.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { cmp[k] = e.target.value; $('#cmpErr').textContent = ''; cmpUpdate(); } });
  m.addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) { cmp[k] = e.target.value; cmpUpdate(); } if (e.target.id === 'cmpFile') cmpFile(e.target.files[0]); });
  $$('.seg button', m).forEach((b) => b.addEventListener('click', () => { cmp.side = b.dataset.side; $$('.seg button', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); cmpUpdate(); }));
  const d = $('#drop'); ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('on'); }));
  ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('on'); }));
  d.addEventListener('drop', (e) => cmpFile(e.dataTransfer.files[0]));
}
function cmpFile(f) {
  if (!f) return; const err = $('#cmpErr');
  if (!/^(image|video)\//.test(f.type)) { err.textContent = 'That file is not an image or video. Use PNG, JPG, GIF, MP4, MOV or WebM.'; return; }
  if (f.size > 200 * 1024 * 1024) { err.textContent = 'That file is over 200 MB. Trim the recording and try again.'; return; }
  if (cmp.file) URL.revokeObjectURL(cmp.file);
  cmp.file = URL.createObjectURL(f); cmp.ftype = f.type.startsWith('video') ? 'video' : 'image'; err.textContent = ''; cmpUpdate();
}
function cmpNums() { const n = (v) => (v === '' || v == null ? NaN : Number(String(v).replace(/,/g, ''))); return { e: n(cmp.entry), s: n(cmp.stop), t: n(cmp.target), x: n(cmp.exit) }; }
function cmpUpdate() {
  const { e, s, t, x } = cmpNums(); const rc = $('#rcalc'); const drop = $('#drop');
  if (isFinite(e) && isFinite(s) && isFinite(x) && e !== s) { const R = Math.abs(e - s); const r = (cmp.side === 'long' ? x - e : e - x) / R; rc.innerHTML = `Risk <b>${R.toFixed(SYMBOLS[cmp.sym].dp)}</b> points, result <b>${rTxt(Math.round(r * 10) / 10)}</b>${isFinite(t) ? `, planned <b>${(Math.abs(t - e) / R).toFixed(1)}R</b>` : ''}.`; }
  else rc.textContent = 'Add entry, stop and exit to show the result in R on your post.';
  $('#cmpClear').hidden = !cmp.file;
  const pv = drop.querySelector('img, video');
  if (cmp.file) { if (!pv || pv.dataset.src !== cmp.file) { pv && pv.remove(); drop.insertAdjacentHTML('beforeend', cmp.ftype === 'video' ? `<video src="${cmp.file}" data-src="${cmp.file}" autoplay muted loop playsinline></video>` : `<img src="${cmp.file}" data-src="${cmp.file}" alt="Upload preview">`); } $('#dropTxt').style.visibility = 'hidden'; }
  else { pv && pv.remove(); $('#dropTxt').style.visibility = ''; }
}
function cmpPost() {
  const err = $('#cmpErr');
  if (!cmp.file) return (err.textContent = 'Add a screenshot or screen recording of the trade.');
  const { e, s, t, x } = cmpNums(); const any = [cmp.entry, cmp.stop, cmp.exit, cmp.target].some((v) => String(v).trim() !== '');
  let tk = null;
  if (any) {
    if (![e, s, x].every(isFinite)) return (err.textContent = 'To add a trade ticket, fill in entry, stop and exit as numbers. Or clear them to post without one.');
    if (e === s) return (err.textContent = 'Stop cannot be the same as entry.');
    if (cmp.side === 'long' && s > e) return (err.textContent = 'On a long, the stop goes below entry.');
    if (cmp.side === 'short' && s < e) return (err.textContent = 'On a short, the stop goes above entry.');
    const R = Math.abs(e - s); tk = { side: cmp.side, entry: e, stop: s, target: t, exit: x, r: Math.round(((cmp.side === 'long' ? x - e : e - x) / R) * 10) / 10 };
  }
  state.posts.unshift({ id: 'p' + Date.now(), user: ME, type: cmp.ftype, url: cmp.file, sym: cmp.sym, tf: cmp.tf, session: cmp.session, tk, caption: cmp.caption.trim(), strategy: cmp.strategy || null, likes: 0, comments: [], t: Date.now() });
  cmp.file = null; closeModal(); feedFilter = 'all';
  if (location.hash === '#/floor') render(); else location.hash = '#/floor'; toast('Posted to the floor');
}

/* ============ BUILDER ============ */
const KINDS = ['Setup', 'Trigger', 'Entry', 'Stop', 'Target', 'Management', 'Rule'];
function newDraft() { return { id: null, user: ME, title: '', tagline: '', market: 'MES', session: 'New York', timeframe: '5m', style: 'ICT', theme: 'floor', followers: 0, forks: 0, stats: { winRate: '', avgR: '', sample: '' }, steps: [{ kind: 'Setup', title: '', body: '', checks: [] }], open: 0 }; }
function builderView(params) {
  if (params.get('edit')) { const s = S(params.get('edit')); if (s && s.user === ME) state.draft = { ...JSON.parse(JSON.stringify(s)), editing: s.id, open: 0 }; }
  else if (params.get('fork')) { const s = S(params.get('fork')); if (s) state.draft = { ...JSON.parse(JSON.stringify(s)), id: null, user: ME, title: s.title + ' (fork)', followers: 0, forks: 0, forkOf: s.id, open: 0 }; }
  if (!state.draft) state.draft = newDraft();
  state.draft.user = ME;
  return shell('builder', `<div class="bld"><div class="bld-ed" id="bldEd"></div><div class="bld-pv" aria-label="Live preview"><div class="frame" id="bldPv"></div></div></div>`);
}
function renderBuilder() {
  const d = state.draft; const ed = $('#bldEd'); if (!ed) return;
  const opt = (arr, v) => arr.map((k) => `<option ${k === v ? 'selected' : ''}>${esc(k)}</option>`).join('');
  ed.innerHTML = `<div><h1>Strategy builder</h1><p class="sub">Write your strategy one step at a time. It publishes as its own page on your profile and in Discover.${d.forkOf ? ` Forked from ${esc(S(d.forkOf)?.title || '')}.` : ''}${ME ? '' : ' You can start writing now and create an account when you publish.'}</p></div>
    <div class="bld-sec"><label class="field"><span>Name</span><input class="input" data-d="title" maxlength="60" value="${esc(d.title)}" placeholder="London Sweep to Fair Value Gap"></label>
      <label class="field"><span>One line summary</span><input class="input" data-d="tagline" maxlength="120" value="${esc(d.tagline)}" placeholder="What this strategy does, in one sentence"></label>
      <div class="bld-grid2"><label class="field"><span>Market</span><select class="input" data-d="market">${opt(Object.keys(SYMBOLS), d.market)}</select></label>
        <label class="field"><span>Session</span><select class="input" data-d="session">${opt(['Asia', 'London', 'New York', 'Any'], d.session)}</select></label>
        <label class="field"><span>Timeframe</span><input class="input" data-d="timeframe" maxlength="20" value="${esc(d.timeframe)}"></label>
        <label class="field"><span>Style</span><select class="input" data-d="style">${opt(['ICT', 'Auction', 'Order flow', 'Breakout', 'Mean reversion', 'Momentum'], d.style)}</select></label></div>
      <div class="field"><span>Page look</span><div class="themes" role="group" aria-label="Page look">${[['floor', '#FFD21F', 'Floor yellow'], ['paper', '#EFE9D8', 'Ticket paper'], ['board', '#16191C', 'Dark board']].map(([k, c, l]) => `<button type="button" data-act="theme" data-v="${k}" style="background:${c}" aria-label="${l}" aria-pressed="${d.theme === k}"></button>`).join('')}</div></div></div>
    <div class="bld-sec"><header><h2>Steps</h2><span class="sub">${d.steps.length} of 12</span></header>
      ${d.steps.map((st, i) => stepEditor(st, i, d.open === i)).join('')}
      ${d.steps.length < 12 ? `<div class="field"><span>Add a step</span><div class="addstep">${KINDS.map((k) => `<button type="button" data-act="add-step" data-k="${k}">${k}</button>`).join('')}</div></div>` : ''}</div>
    <div class="bld-sec"><header><h2>Your numbers</h2><span class="sub">Optional, shown as author-reported</span></header>
      <div class="g3"><label class="field"><span>Win rate %</span><input class="input num" inputmode="decimal" data-st="winRate" value="${esc(d.stats.winRate)}"></label><label class="field"><span>Avg winner R</span><input class="input num" inputmode="decimal" data-st="avgR" value="${esc(d.stats.avgR)}"></label><label class="field"><span>Trades logged</span><input class="input num" inputmode="numeric" data-st="sample" value="${esc(d.stats.sample)}"></label></div></div>
    <div class="bld-bar"><div class="err" id="bldErr" role="alert"></div><button class="btn btn-line" data-act="bld-reset">Start over</button><button class="btn btn-floor" data-act="bld-publish">${d.editing ? 'Save changes' : 'Publish strategy'}</button></div>`;
  renderPreview();
}
function stepEditor(st, i, open) {
  const n = state.draft.steps.length;
  return `<div class="stepcard"><header><span class="n">${String(i + 1).padStart(2, '0')}</span><button class="t" data-act="step-open" data-i="${i}" aria-expanded="${open}" style="text-align:left">${esc(st.title || 'Untitled step')}<small>${esc(st.kind)}</small></button>
    <button class="ib" data-act="step-up" data-i="${i}" aria-label="Move step up" ${i === 0 ? 'disabled' : ''}>${I.up}</button><button class="ib" data-act="step-down" data-i="${i}" aria-label="Move step down" ${i === n - 1 ? 'disabled' : ''}>${I.down}</button><button class="ib" data-act="step-del" data-i="${i}" aria-label="Delete step">${I.x}</button></header>
    ${open ? `<div class="ed"><div class="bld-grid2"><label class="field"><span>Type</span><select class="input" data-s="kind" data-i="${i}">${KINDS.map((k) => `<option ${k === st.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="field"><span>Title</span><input class="input" data-s="title" data-i="${i}" maxlength="70" value="${esc(st.title)}" placeholder="Mark the Asia range"></label></div>
      <label class="field"><span>What to do</span><textarea class="input" data-s="body" data-i="${i}" maxlength="600" placeholder="Explain it so someone else could follow it">${esc(st.body)}</textarea></label>
      <div class="field"><span>Checklist</span><div class="chk-list">${st.checks.map((c, j) => `<div class="it"><span>${esc(c)}</span><button class="ib" data-act="chk-del" data-i="${i}" data-j="${j}" aria-label="Remove ${esc(c)}">${I.x}</button></div>`).join('')}</div>
        <div class="chk-row"><input class="input" id="chk-${i}" maxlength="80" placeholder="Something to tick off before acting"><button class="btn btn-line btn-sm" style="height:40px" data-act="chk-add" data-i="${i}">Add</button></div></div>
      <div class="field"><span>Example screenshot</span><div class="media-pick">${st.img ? `<div class="pv"><img src="${st.img}" alt=""></div>` : ''}
        <label class="btn btn-line btn-sm">${st.img ? 'Replace image' : 'Upload image'}<input type="file" accept="image/*" class="sr" data-act="step-img" data-i="${i}"></label>
        ${st.img ? `<button class="btn btn-line btn-sm" data-act="step-nomedia" data-i="${i}">Remove</button>` : ''}</div></div>
    </div>` : ''}</div>`;
}
let _pvT;
function renderPreview() { clearTimeout(_pvT); _pvT = setTimeout(() => { const pv = $('#bldPv'); if (!pv) return; const d = state.draft; pv.innerHTML = strategyHTML({ ...d, user: ME, id: d.editing || slug(d.title) }, { preview: true }); }, 60); }
function publishDraft() {
  const d = state.draft; const err = $('#bldErr');
  if (d.title.trim().length < 4) { err.textContent = 'Give the strategy a name of at least 4 characters.'; $('[data-d="title"]').focus(); return; }
  if (d.steps.length < 2) { err.textContent = 'Add at least 2 steps.'; return; }
  const bad = d.steps.findIndex((s) => !s.title.trim()); if (bad > -1) { err.textContent = `Step ${bad + 1} needs a title.`; d.open = bad; renderBuilder(); return; }
  if (!need(publishDraft)) return;
  const num = (v) => (v === '' || v == null || !isFinite(Number(v)) ? undefined : Number(v));
  const out = { ...JSON.parse(JSON.stringify(d)), user: ME, stats: { winRate: num(d.stats.winRate), avgR: num(d.stats.avgR), sample: num(d.stats.sample) } };
  delete out.open;
  if (d.editing) { out.id = d.editing; delete out.editing; const i = state.strategies.findIndex((s) => s.id === d.editing); state.strategies[i] = out; }
  else { let id = slug(d.title); while (S(id)) id += '-2'; out.id = id; out.created = Date.now(); if (d.forkOf) { const src = S(d.forkOf); src && src.forks++; } state.strategies.unshift(out); }
  state.draft = null; location.hash = '#/s/' + out.id; toast(d.editing ? 'Strategy saved' : 'Strategy published');
}

/* ============ EVENTS (delegated) ============ */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act; const id = el.dataset.id;
  const d = state.draft; const i = +el.dataset.i;
  switch (a) {
    case 'signup': openSignup(); break;
    case 'signout': ME = null; location.hash = '#/floor'; render(); toast('Signed out'); break;
    case 'compose': openComposer(); break;
    case 'close': closeModal(); break;
    case 'cmp-post': cmpPost(); break;
    case 'cmp-clear': if (cmp.file) URL.revokeObjectURL(cmp.file); cmp.file = null; cmp.ftype = null; $('#cmpFile').value = ''; cmpUpdate(); break;
    case 'like': { if (!need()) break; const p = P(id); const on = !state.liked.has(id); on ? state.liked.add(id) : state.liked.delete(id); p.likes += on ? 1 : -1; $$(`[data-act="like"][data-id="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = compact(p.likes); }); break; }
    case 'save': { if (!need()) break; const on = !state.saved.has(id); on ? state.saved.add(id) : state.saved.delete(id); $$(`[data-act="save"][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', on)); toast(on ? 'Saved' : 'Removed from saved'); break; }
    case 'focus-cmt': $(`#c-${id}`)?.focus(); break;
    case 'feed-filter': feedFilter = el.dataset.f; render(); break;
    case 'disc-style': disc.style = el.dataset.v; $$('[data-act="disc-style"]').forEach((b) => b.setAttribute('aria-pressed', b === el)); renderDiscGrid(); break;
    case 'follow-strat': { if (!need()) break; const on = !state.followedStrategies.has(id); on ? state.followedStrategies.add(id) : state.followedStrategies.delete(id); const s = S(id); s.followers += on ? 1 : -1; render(true); toast(on ? 'Following strategy' : 'Unfollowed strategy'); break; }
    case 'fork': location.hash = '#/builder?fork=' + id; break;
    case 'follow': { if (!need()) break; const h = el.dataset.h; const on = !state.following.has(h); on ? state.following.add(h) : state.following.delete(h); U(h).followers += on ? 1 : -1; U(ME).following += on ? 1 : -1; render(true); break; }
    case 'prof-tab': profTab = el.dataset.t; render(true); break;
    case 'open-post': openPostModal(id); break;
    case 'theme': d.theme = el.dataset.v; renderBuilder(); break;
    case 'add-step': d.steps.push({ kind: el.dataset.k, title: '', body: '', checks: [] }); d.open = d.steps.length - 1; renderBuilder(); $(`[data-s="title"][data-i="${d.open}"]`)?.focus(); break;
    case 'step-open': d.open = d.open === i ? -1 : i; renderBuilder(); break;
    case 'step-up': if (i > 0) { [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]]; d.open = i - 1; renderBuilder(); } break;
    case 'step-down': if (i < d.steps.length - 1) { [d.steps[i + 1], d.steps[i]] = [d.steps[i], d.steps[i + 1]]; d.open = i + 1; renderBuilder(); } break;
    case 'step-del': d.steps.splice(i, 1); d.open = Math.min(d.open, d.steps.length - 1); renderBuilder(); break;
    case 'chk-add': { const inp = $(`#chk-${i}`); const v = inp.value.trim(); if (v) { d.steps[i].checks.push(v); renderBuilder(); $(`#chk-${i}`)?.focus(); } break; }
    case 'chk-del': d.steps[i].checks.splice(+el.dataset.j, 1); renderBuilder(); break;
    case 'step-nomedia': d.steps[i].img = null; renderBuilder(); break;
    case 'bld-reset': if (confirm('Clear this draft and start a new strategy?')) { state.draft = newDraft(); location.hash = '#/builder'; renderBuilder(); } break;
    case 'bld-publish': publishDraft(); break;
  }
});
/* Reels: tap a video to turn sound on or off. */
document.addEventListener('click', (e) => {
  const v = e.target.closest('.reel video'); if (!v) return;
  v.muted = !v.muted; const tag = v.parentElement.querySelector('.mute'); if (tag) tag.textContent = v.muted ? 'Tap for sound' : 'Sound on';
});
document.addEventListener('dblclick', (e) => {
  const m = e.target.closest('[data-act="dbl-like"]'); if (!m) return; const id = m.dataset.id;
  if (!ME) { need(); return; }
  if (!state.liked.has(id)) $(`[data-act="like"][data-id="${id}"]`)?.click();
  const h = $('.heart', m); if (h && window.gsap && !reduced) gsap.fromTo(h, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)', yoyo: true, repeat: 1, repeatDelay: 0.25 });
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-act="comment"]'); if (!f) return; e.preventDefault();
  if (!need()) return;
  const inp = f.querySelector('input'); const v = inp.value.trim(); if (!v) return;
  const p = P(f.dataset.id); p.comments.push({ u: ME, t: v }); inp.value = '';
  const c = f.previousElementSibling; c.insertAdjacentHTML('beforeend', `<div><a href="#/u/${ME}">${ME}</a>${esc(v)}</div>`);
  $$(`[data-act="focus-cmt"][data-id="${p.id}"] span`).forEach((s) => (s.textContent = p.comments.length));
});
document.addEventListener('input', (e) => {
  const t = e.target; const d = state.draft;
  if (t.dataset.act === 'disc-q') { disc.q = t.value; renderDiscGrid(); return; }
  if (!d) return;
  if (t.dataset.d) { d[t.dataset.d] = t.value; renderPreview(); }
  if (t.dataset.st) { d.stats[t.dataset.st] = t.value; renderPreview(); }
  if (t.dataset.s) { const st = d.steps[+t.dataset.i]; st[t.dataset.s] = t.value; if (t.dataset.s === 'title') { const b = t.closest('.stepcard').querySelector('.t'); b.firstChild.textContent = t.value || 'Untitled step'; } if (t.dataset.s === 'kind') { t.closest('.stepcard').querySelector('.t small').textContent = t.value; } renderPreview(); }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.act === 'disc-m') { disc.market = t.value; renderDiscGrid(); }
  if (t.dataset.act === 'disc-s') { disc.sort = t.value; renderDiscGrid(); }
  if (t.dataset.s === 'kind' && state.draft) { state.draft.steps[+t.dataset.i].kind = t.value; renderPreview(); }
  if (t.dataset.act === 'step-img' && t.files[0]) { if (!t.files[0].type.startsWith('image/')) { $('#bldErr').textContent = 'Example screenshots need to be an image file.'; return; } const st = state.draft.steps[+t.dataset.i]; st.img = URL.createObjectURL(t.files[0]); renderBuilder(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id && e.target.id.startsWith('chk-')) { e.preventDefault(); $(`[data-act="chk-add"][data-i="${e.target.id.slice(4)}"]`).click(); } });

/* ============ ROUTER ============ */
let lastRoute = null;
function parseHash() { const h = location.hash.replace(/^#/, '') || '/'; const [path, qs] = h.split('?'); return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') }; }
function render(keepScroll = false) {
  const y = scrollY; const { parts, params } = parseHash(); const r = parts[0] || '';
  destroyReplays(); destroyMedia(); closeModal(); Landing.destroy();
  const app = $('#app'); let html;
  if (r === '') html = Landing.html();
  else if (r === 'floor') html = feedView();
  else if (r === 'replays') html = replaysView();
  else if (r === 'discover') html = discoverView();
  else if (r === 's') html = strategyView(parts[1]);
  else if (r === 'me') { if (lastRoute !== '#/me') profTab = 'posts'; html = meView(); }
  else if (r === 'u') { if (parts[1] === ME) { location.replace('#/me'); return; } if (lastRoute !== location.hash.split('?')[0]) profTab = 'posts'; html = profileView(parts[1] || ''); }
  else if (r === 'builder') html = builderView(params);
  else html = shell('floor', `<div class="page">${emptyBlock('Not on the floor.', 'That page does not exist.', `<a class="btn btn-floor" href="#/floor">Go to the feed</a>`)}</div>`);
  app.innerHTML = html; document.title = r === '' ? 'The Trading Floor' : `${({ floor: 'The Floor', replays: 'Replays', discover: 'Discover strategies', s: S(parts[1])?.title || 'Strategy', u: '@' + (parts[1] || ''), me: 'Profile', builder: 'Strategy builder' })[r] || 'Not found'} | The Trading Floor`;
  if (r === '') Landing.init();
  if (r === 'discover') renderDiscGrid();
  if (r === 'builder') renderBuilder();
  hydrateMedia(app);
  window.scrollTo(0, keepScroll ? y : 0);
  lastRoute = location.hash.split('?')[0];
}
function go() {
  const was = lastRoute === '#/' || lastRoute === '' || lastRoute === null; const toLanding = (location.hash || '#/') === '#/';
  if (!reduced && window.gsap && lastRoute !== null && (was !== toLanding)) {
    const sh = $('#shutter');
    gsap.timeline().set(sh, { transformOrigin: 'bottom' }).to(sh, { scaleY: 1, duration: 0.4, ease: 'expo.inOut' })
      .add(() => render()).set(sh, { transformOrigin: 'top' }).to(sh, { scaleY: 0, duration: 0.5, ease: 'expo.inOut' });
  } else render();
}
addEventListener('hashchange', go);
