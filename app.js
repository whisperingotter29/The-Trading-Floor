/* ============ HELPERS ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compact = (n) => (n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k' : n >= 1e3 ? n.toLocaleString('en-US') : String(n));
const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); if (m < 60) return m + 'm'; const h = Math.round(m / 60); if (h < 24) return h + 'h'; return Math.round(h / 24) + 'd'; };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'strategy';
const money = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: Math.abs(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const rrTxt = (rr) => '1:' + (Math.round(rr * 100) / 100);
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
/* badge() takes anything with { badge, tone }: a profile, a post or a strategy row */
const badge = (o, s = 40) => { const u = o || { badge: '???', tone: 'board' }; return `<span class="badge t-${esc(u.tone || 'board')}" style="--s:${s}px" aria-hidden="true">${esc(u.badge || '???')}</span>`; };

/* ============ ACCOUNTS ============ */
/* Two steps: sign in (Google or an emailed link/code, handled by Supabase Auth),
   then a one-time profile setup (name, handle, badge). need() gates any action
   that writes data and resumes it once the person is ready. */
const AFTER_KEY = 'tf_after', BADGE_KEY = 'tf_badge';
let _then = null;
function need(then) {
  if (SESSION && ME) return true;
  _then = then || null;
  if (!SESSION) {
    sessionStorage.setItem(AFTER_KEY, location.hash || '#/floor');
    if (state.draft) sessionStorage.setItem('tf_draft', JSON.stringify({ ...state.draft, steps: state.draft.steps.map(({ file, preview, ...s }) => s) }));
    openAuth();
  }
  else openProfileSetup();
  return false;
}
function resume() { const t = _then; _then = null; if (t) t(); }

function openAuth({ badgeHint } = {}) {
  if (badgeHint) sessionStorage.setItem(BADGE_KEY, badgeHint);
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="auH" style="width:min(460px,100%)"><header><h2 id="auH">Sign in to the floor</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header>
    <div class="su" id="auBody">
      <p class="su-lead">New here or coming back, it is the same step. You will pick a handle and badge after signing in for the first time.</p>
      <button class="btn btn-line au-google" id="auGoogle"><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"/></svg>Continue with Google</button>
      <div class="au-or"><span>or use your email</span></div>
      <label class="field"><span>Email</span><input class="input" id="auEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
      <div class="err" id="auErr" role="alert"></div>
      <button class="btn btn-floor" id="auSend">Email me a sign-in link</button>
    </div></div>`);
  const err = $('#auErr');
  $('#auGoogle').addEventListener('click', async (e) => { e.currentTarget.disabled = true; err.textContent = ''; const m = await DB.signInGoogle(); if (m) { err.textContent = m; e.currentTarget.disabled = false; } });
  const send = async () => {
    const email = $('#auEmail').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; return; }
    const b = $('#auSend'); b.disabled = true; b.textContent = 'Sending...'; err.textContent = '';
    const m = await DB.sendEmailLink(email);
    if (m) { err.textContent = m; b.disabled = false; b.textContent = 'Email me a sign-in link'; return; }
    $('#auBody').innerHTML = `<p class="su-lead">We sent an email to <b>${esc(email)}</b>. Open it on this device and click the sign-in link. If the email shows a 6-digit code instead, type it here.</p>
      <label class="field"><span>Code from the email</span><input class="input au-code" id="auCode" inputmode="numeric" maxlength="10" autocomplete="one-time-code" placeholder="123456"></label>
      <div class="err" id="auErr2" role="alert"></div>
      <button class="btn btn-floor" id="auVerify">Sign in with code</button>
      <button class="btn btn-line" id="auBack">Use a different email</button>`;
    $('#auBack').addEventListener('click', () => openAuth());
    $('#auVerify').addEventListener('click', async () => {
      const code = $('#auCode').value.replace(/\D/g, ''); const e2 = $('#auErr2'); if (code.length < 6) { e2.textContent = 'Enter the code from the email.'; return; }
      $('#auVerify').disabled = true; const m2 = await DB.verifyEmailCode(email, code);
      if (m2) { e2.textContent = m2; $('#auVerify').disabled = false; return; }
      await afterSignIn();
    });
    $('#auCode').focus();
  };
  $('#auSend').addEventListener('click', send);
  $('#auEmail').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  setTimeout(() => $('#auEmail')?.focus(), 30);
}
async function afterSignIn() {
  await DB.loadMe(); closeModal();
  if (!ME) { openProfileSetup(); return; }
  toast('Signed in as @' + ME.handle); render(true); resume();
}

function openProfileSetup() {
  const hint = sessionStorage.getItem(BADGE_KEY) || '';
  const su = { tone: 'floor', markets: new Set() };
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="suH" style="width:min(560px,100%)"><header><h2 id="suH">Set up your profile</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header>
    <div class="su">
      <p class="su-lead">Pick a name, a handle and a three-letter badge. The badge goes on every trade you post. Handles and badges are one per trader.</p>
      <div class="su-row"><div class="su-badge" id="suBadge">${esc(hint || '???')}</div>
        <div class="su-fields">
          <label class="field"><span>Display name</span><input class="input" id="suName" maxlength="40" autocomplete="name" placeholder="Arjun"></label>
          <label class="field"><span>Handle</span><input class="input" id="suHandle" maxlength="20" autocomplete="username" placeholder="arjun.trades" spellcheck="false"></label>
        </div></div>
      <div class="g2"><label class="field"><span>Badge (3 letters)</span><input class="input su-badge-in" id="suBadgeIn" maxlength="3" value="${esc(hint)}" placeholder="ARJ" spellcheck="false" autocomplete="off"></label>
        <div class="field"><span>Badge colour</span><div class="themes" role="group" aria-label="Badge colour">${[['floor', '#18A583', 'Phthalo green'], ['paper', '#EFE9D8', 'Ticket paper'], ['board', '#12291F', 'Dark board']].map(([k, c, l]) => `<button type="button" class="su-tone" data-v="${k}" style="background:${c}" aria-label="${l}" aria-pressed="${k === 'floor'}"></button>`).join('')}</div></div></div>
      <div class="field"><span>Markets you trade (optional)</span><div class="su-markets">${Object.keys(SYMBOLS).map((m) => `<button type="button" class="chip su-mk" data-m="${m}" aria-pressed="false">${m}</button>`).join('')}</div></div>
      <label class="field"><span>Bio (optional)</span><textarea class="input" id="suBio" maxlength="160" placeholder="What you trade and when"></textarea></label>
      <div class="err" id="suErr" role="alert"></div>
      <button class="btn btn-floor" id="suGo">Save profile</button>
      <button class="btn btn-line" data-act="signout">Sign out</button>
    </div></div>`);
  const m = $('#modal'); const badgeEl = $('#suBadge');
  const syncBadge = () => { badgeEl.textContent = $('#suBadgeIn').value || '???'; badgeEl.className = 'su-badge t-' + su.tone; };
  $('#suBadgeIn').addEventListener('input', (e) => { e.target.dataset.touched = '1'; e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); syncBadge(); });
  $('#suHandle').addEventListener('input', (e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); });
  $('#suName').addEventListener('input', (e) => { const b = $('#suBadgeIn'); if (!b.dataset.touched && !hint) { b.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); syncBadge(); } });
  $$('.su-tone', m).forEach((b) => b.addEventListener('click', () => { su.tone = b.dataset.v; $$('.su-tone', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); syncBadge(); }));
  $$('.su-mk', m).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.m; su.markets.has(k) ? su.markets.delete(k) : su.markets.add(k); b.setAttribute('aria-pressed', su.markets.has(k)); }));
  syncBadge();
  $('#suGo').addEventListener('click', async () => {
    const name = $('#suName').value.trim(), handle = $('#suHandle').value.trim(), bdg = $('#suBadgeIn').value.trim(), err = $('#suErr'), go = $('#suGo');
    if (!name) return (err.textContent = 'Add a display name.');
    if (!/^[a-z0-9._]{3,20}$/.test(handle)) return (err.textContent = 'Handles are 3 to 20 characters: lowercase letters, numbers, dots and underscores.');
    if (!/^[A-Z]{3}$/.test(bdg)) return (err.textContent = 'Badges are exactly three letters.');
    go.disabled = true; go.textContent = 'Saving...'; err.textContent = '';
    const msg = await DB.createProfile({ handle, badge: bdg, name, bio: $('#suBio').value.trim(), markets: [...su.markets], tone: su.tone });
    if (msg) { err.textContent = msg; go.disabled = false; go.textContent = 'Save profile'; return; }
    sessionStorage.removeItem(BADGE_KEY); closeModal(); toast('Welcome to the floor, @' + handle); render(true); resume();
  });
  setTimeout(() => $('#suName')?.focus(), 30);
}

/* ============ POST PARTS ============ */
function ticketStrip(p) {
  const k = p.tk; if (!k) return '';
  return `<div class="ticket"><div class="ticket-strip tk3">
    <div class="tf"><b>Side</b><i>${k.side === 'long' ? 'Long' : 'Short'} ${esc(p.sym)}</i></div>
    <div class="tf"><b>Risk:reward</b><i>${k.rr ? rrTxt(k.rr) : '–'}</i></div>
    <div class="stamp ${k.pnl > 0 ? 'win' : 'loss'}" title="Profit / loss">${money(k.pnl)}</div>
  </div></div>`;
}
function mediaHTML(p, { reel = false } = {}) {
  const tag = `<span class="tagl">${esc(p.sym)} ${esc(p.tf)}</span>`;
  if (p.type === 'video') return `<video src="${esc(p.url)}" playsinline muted loop preload="metadata" data-auto ${reel ? '' : 'controls'}></video>${tag}${reel ? '<span class="mute" aria-hidden="true">Tap for sound</span>' : ''}`;
  return `<img src="${esc(p.url)}" alt="Chart posted by ${esc(p.handle)}" loading="lazy">${tag}`;
}
const POSTS = new Map(); // posts currently on screen, by id
function postHTML(p) {
  POSTS.set(p.id, p);
  const liked = state.liked.has(p.id); const saved = state.saved.has(p.id); const mine = ME && p.user_id === ME.id;
  const cm = p.comments.map((c) => `<div><a href="#/u/${esc(c.handle)}">${esc(c.handle)}</a>${esc(c.body)}</div>`).join('');
  const more = p.commentCount > p.comments.length ? `<button class="more-cmts" data-act="open-post" data-id="${p.id}">View all ${p.commentCount} comments</button>` : '';
  return `<article class="post" data-post="${p.id}">
    <div class="post-h">${badge(p)}<div class="who"><a href="#/u/${esc(p.handle)}">${esc(p.handle)}</a><small>${esc(p.sym)} ${esc(p.tf)}, ${esc(p.session)} session</small></div>
      ${p.strategy_id ? `<a class="strat-link" href="#/s/${p.strategy_id}">Strategy</a>` : ''}${mine ? `<button class="ib" data-act="del-post" data-id="${p.id}" aria-label="Delete post" title="Delete post">${I.x}</button>` : ''}</div>
    <div class="media" data-act="dbl-like" data-id="${p.id}">${mediaHTML(p)}
      <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="#18A583" d="M12 20s-7-4.4-8.7-8.9A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.7 3.5C19 15.6 12 20 12 20z"/></svg></div>
    <div class="acts">
      <button class="act" data-act="like" data-id="${p.id}" aria-pressed="${liked}" aria-label="Like">${I.heart}<span>${compact(p.likes)}</span></button>
      <button class="act" data-act="focus-cmt" data-id="${p.id}" aria-label="Comment">${I.comment}<span>${p.commentCount}</span></button>
      <button class="act save" data-act="save" data-id="${p.id}" aria-pressed="${saved}" aria-label="Save">${I.save}</button>
    </div>
    ${ticketStrip(p)}
    ${p.caption ? `<p class="caption"><a href="#/u/${esc(p.handle)}">${esc(p.handle)}</a>${esc(p.caption)}</p>` : ''}
    ${more}<div class="cmts">${cm}</div>
    <form class="cmt-form" data-act="comment" data-id="${p.id}"><label class="sr" for="c-${p.id}">Add a comment</label><input class="input" id="c-${p.id}" placeholder="Add a comment" autocomplete="off" maxlength="280"><button class="btn btn-line btn-sm">Post</button></form>
    <div class="post-time">${ago(p.t)} ago</div>
  </article>`;
}
let _vio;
function hydrateMedia(root = document) {
  if (!_vio) _vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.intersectionRatio > 0.6 && !reduced) v.play().catch(() => {}); else v.pause(); }), { threshold: [0, 0.6, 1] });
  $$('video[data-auto]', root).forEach((v) => _vio.observe(v));
}
function destroyMedia() { if (_vio) { _vio.disconnect(); _vio = null; } }

/* ============ SHELL ============ */
const NAV = [['floor', 'The Floor', I.floor], ['replays', 'Replays', I.replay], ['discover', 'Discover strategies', I.discover], ['builder', 'Strategy builder', I.builder], ['me', 'Profile', I.profile]];
function shell(active, inner) {
  const links = NAV.map(([k, l, ic]) => `<a href="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
  const tabs = NAV.map(([k, l, ic]) => `<a href="#/${k}" aria-label="${l}" ${active === k ? 'aria-current="page"' : ''}>${ic}</a>`).join('');
  const who = ME ? `<a class="me" href="#/me">${badge(ME, 36)}<div><strong>${esc(ME.handle)}</strong><small>Badge ${esc(ME.badge)}</small></div></a>`
    : SESSION ? `<div class="me-empty"><p>Signed in. Finish your profile to post.</p><button class="btn btn-line" data-act="setup">Set up profile</button></div>`
    : `<div class="me-empty"><p>You are not signed in.</p><button class="btn btn-line" data-act="signin">Sign in or join</button></div>`;
  return `<div class="shell">
    <aside class="rail"><a class="mark" href="#/">The<br>Trading<br>Floor</a>
      <nav aria-label="Main">${links}</nav>
      <button class="btn btn-floor" data-act="compose">${I.plus}Post a trade</button>
      ${who}
    </aside>
    <header class="topbar"><a class="mark" href="#/">The Trading Floor</a>${ME ? `<button class="btn btn-floor btn-sm" data-act="compose">${I.plus}Post</button>` : `<button class="btn btn-floor btn-sm" data-act="${SESSION ? 'setup' : 'signin'}">${SESSION ? 'Set up' : 'Join'}</button>`}</header>
    <main class="main" id="main">${inner}</main>
    <nav class="tabbar" aria-label="Main">${tabs}</nav>
  </div>`;
}
const emptyBlock = (title, text, cta = '') => `<div class="void"><div class="void-mark" aria-hidden="true"><i></i><i></i><i></i></div><h2>${title}</h2><p>${text}</p>${cta}</div>`;
const loadingBlock = () => `<div class="loading" role="status" aria-live="polite"><i></i><i></i><i></i><span>Loading</span></div>`;
const errorBlock = (msg) => emptyBlock('Could not load this.', esc(msg), `<button class="btn btn-floor" data-act="reload">Try again</button>`);

/* ============ FEED ============ */
let feedFilter = 'all', feedCursor = null, feedDone = false;
async function feedView() {
  const f = feedFilter;
  const [{ rows, error }, tapeRes, rising] = await Promise.all([
    DB.posts({ filter: f }), DB.posts({ limit: 10 }), DB.strategies({ limit: 4 }),
  ]);
  if (error) return shell('floor', `<div class="page">${errorBlock(error)}</div>`);
  feedCursor = rows.length ? rows[rows.length - 1].created_at : null; feedDone = rows.length < 20;
  const tape = tapeRes.rows;
  const chips = [['all', 'For you'], ['following', 'Following'], ['photos', 'Photos'], ['videos', 'Videos'], ['wins', 'Wins'], ['losses', 'Losses']]
    .map(([k, l]) => `<button class="chip" data-act="feed-filter" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join('');
  const tapeLi = tape.map((p) => `<li>${badge(p, 28)}<span><b>${esc(p.handle)}</b> ${p.tk.side} ${esc(p.sym)}</span><i class="${p.tk.pnl > 0 ? 'w' : ''}">${money(p.tk.pnl)}</i></li>`).join('');
  const risingHTML = rising.map((s) => `<a class="mini-strat" href="#/s/${s.id}">${badge(s, 34)}<div><strong>${esc(s.title)}</strong><small>${esc(s.market)}, ${s.steps.length} steps, ${compact(s.followers)} following</small></div></a>`).join('');
  const none = !tape.length;
  const main = none
    ? emptyBlock('The floor is quiet.', 'Nobody has posted a trade yet. Upload a screenshot or a screen recording of a trade you took and yours will be the first thing everyone sees.', `<button class="btn btn-floor" data-act="compose">${I.plus}Post the first trade</button>`)
    : rows.length ? rows.map(postHTML).join('') + (feedDone ? '' : `<div class="feed-more" id="feedMore">${loadingBlock()}</div>`) : `<div class="empty">${f === 'following' ? 'No posts from people you follow yet.' : 'No posts match this filter yet.'}</div>`;
  return shell('floor', `<div class="cols"><section aria-label="Feed">
      ${none ? '' : `<div class="feed-tabs" role="group" aria-label="Filter feed">${chips}</div>`}
      <div id="feedList">${main}</div>
    </section>
    <aside class="side" aria-label="Live activity">
      <div><h3>The tape</h3>${tape.length ? `<div class="side-tape ${tape.length > 5 ? 'roll' : ''}"><ul>${tapeLi}${tape.length > 5 ? tapeLi : ''}</ul></div>` : '<p class="side-empty">Trades show up here with their profit or loss as they are posted.</p>'}</div>
      <div><h3>Strategies</h3>${risingHTML || '<p class="side-empty">No strategies have been published yet.</p>'}<a class="btn btn-line btn-sm" style="margin-top:14px" href="#/${rising.length ? 'discover' : 'builder'}">${rising.length ? 'Discover strategies' : 'Build the first one'}</a></div>
    </aside></div>`);
}
/* infinite scroll: load 20 more when the sentinel comes into view */
let _moreIO, _loadingMore = false;
function watchFeedMore() {
  if (_moreIO) _moreIO.disconnect();
  const el = $('#feedMore'); if (!el) return;
  _moreIO = new IntersectionObserver(async (es) => {
    if (!es[0].isIntersecting || _loadingMore || feedDone) return; _loadingMore = true;
    const { rows } = await DB.posts({ filter: feedFilter, before: feedCursor });
    _loadingMore = false;
    const list = $('#feedList'); if (!list) return;
    $('#feedMore')?.remove();
    list.insertAdjacentHTML('beforeend', rows.map(postHTML).join(''));
    feedCursor = rows.length ? rows[rows.length - 1].created_at : feedCursor; feedDone = rows.length < 20;
    if (!feedDone) list.insertAdjacentHTML('beforeend', `<div class="feed-more" id="feedMore">${loadingBlock()}</div>`);
    hydrateMedia(list); watchFeedMore();
  }, { rootMargin: '600px' });
  _moreIO.observe(el);
}

/* ============ REPLAYS ============ */
async function replaysView() {
  const { rows, error } = await DB.posts({ video: true, limit: 30 });
  if (error) return shell('replays', `<div class="page">${errorBlock(error)}</div>`);
  if (!rows.length) return shell('replays', `<div class="page">${emptyBlock('No replays yet.', 'Replays are screen recordings of trades, uploaded as MP4, MOV or WebM. When someone posts one it plays here in a vertical feed.', `<button class="btn btn-floor" data-act="compose">${I.upload}Upload a screen recording</button>`)}</div>`);
  const reels = rows.map((p) => { POSTS.set(p.id, p); const liked = state.liked.has(p.id);
    return `<section class="reel" data-post="${p.id}"><div class="phone"><div class="phone-screen media">${mediaHTML(p, { reel: true })}
      <div class="phone-ov"><div class="who">${badge(p, 28)}<a href="#/u/${esc(p.handle)}">${esc(p.handle)}</a></div>${p.caption ? `<p>${esc(p.caption)}</p>` : ''}${ticketStrip(p)}</div></div></div>
      <div class="reel-acts">
        <button class="act" data-act="like" data-id="${p.id}" aria-pressed="${liked}" aria-label="Like">${I.heart}<span>${compact(p.likes)}</span></button>
        <button class="act" data-act="open-post" data-id="${p.id}" aria-label="Comments">${I.comment}<span>${p.commentCount}</span></button>
        <button class="act" data-act="save" data-id="${p.id}" aria-pressed="${state.saved.has(p.id)}" aria-label="Save">${I.save}<span>Save</span></button>
        ${p.strategy_id ? `<a class="act" href="#/s/${p.strategy_id}" aria-label="Strategy">${I.builder}<span>Strategy</span></a>` : ''}
      </div></section>`; }).join('');
  return shell('replays', `<div class="reels">${reels}</div>`);
}

/* ============ DISCOVER ============ */
const disc = { q: '', style: 'All', market: 'All', sort: 'followers' };
let DISC = [];
function scardHTML(s) {
  return `<a class="scard" href="#/s/${s.id}"><div class="ticket">
    <div class="band t-${esc(s.theme)}"><span class="kind">${esc(s.style)}, ${esc(s.session)}</span><h3>${esc(s.title)}</h3></div>
    <div class="body"><p>${esc(s.tagline)}</p>
      <div class="by">${badge(s, 26)}<span>${esc(s.handle)}</span></div>
      <div class="facts"><span>${esc(s.market)}</span><span>${s.steps.length} steps</span><span>${compact(s.followers)} following</span><span>${s.forks} forks</span></div></div>
  </div></a>`;
}
async function discoverView() {
  DISC = await DB.strategies({ sort: disc.sort });
  const head = `<div class="page-h"><div><h1>Discover strategies</h1><p>Step-by-step playbooks published by traders on the floor. Follow one to see its trades in your feed, or fork it into your own.</p></div>
      <a class="btn btn-floor" href="#/builder">${I.plus}Build a strategy</a></div>`;
  if (!DISC.length) return shell('discover', `<div class="page">${head}${emptyBlock('No strategies yet.', 'Nobody has published a strategy. Write yours step by step in the builder and it becomes the first page in Discover.', `<a class="btn btn-floor" href="#/builder">Open the builder</a>`)}</div>`);
  const styles = ['All', ...new Set(DISC.map((s) => s.style))];
  const markets = ['All', ...new Set(DISC.map((s) => s.market))];
  return shell('discover', `<div class="page">${head}
    <div class="disc-tools"><label class="sr" for="dq">Search strategies</label><input id="dq" class="input" placeholder="Search by name, market or trader" value="${esc(disc.q)}" data-act="disc-q">
      <div style="display:flex;gap:8px"><label class="sr" for="dm">Market</label><select id="dm" class="input" data-act="disc-m">${markets.map((m) => `<option ${m === disc.market ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
      <label class="sr" for="ds">Sort</label><select id="ds" class="input" data-act="disc-s"><option value="followers" ${disc.sort === 'followers' ? 'selected' : ''}>Most followed</option><option value="new" ${disc.sort === 'new' ? 'selected' : ''}>Newest</option><option value="forks" ${disc.sort === 'forks' ? 'selected' : ''}>Most forked</option></select></div></div>
    <div class="disc-chips" role="group" aria-label="Style">${styles.map((s) => `<button class="chip" data-act="disc-style" data-v="${esc(s)}" aria-pressed="${disc.style === s}">${esc(s)}</button>`).join('')}</div>
    <div class="sgrid" id="sgrid"></div></div>`);
}
function renderDiscGrid() {
  const g = $('#sgrid'); if (!g) return;
  const q = disc.q.trim().toLowerCase();
  const list = DISC.filter((s) => (disc.style === 'All' || s.style === disc.style) && (disc.market === 'All' || s.market === disc.market)
    && (!q || [s.title, s.tagline, s.market, s.handle, s.style].join(' ').toLowerCase().includes(q)));
  g.innerHTML = list.length ? list.map(scardHTML).join('') : `<div class="empty" style="grid-column:1/-1">No strategies match. Try another market or style.</div>`;
}

/* ============ STRATEGY SITE ============ */
function stepShot(st) { const src = st.preview || (st.img ? DB.mediaUrl(st.img) : ''); return src ? `<div class="shot"><img src="${esc(src)}" alt="Example for ${esc(st.title)}"></div>` : ''; }
function strategyHTML(s, { preview = false, used = [] } = {}) {
  const u = s.handle ? s : ME || { handle: 'your-handle', badge: '???', tone: 'board' };
  const following = state.followedStrategies.has(s.id); const mine = ME && s.user_id === ME.id;
  const steps = (s.steps.length ? s.steps : [{ kind: 'Setup', title: 'Your first step', body: 'Add steps on the left.', checks: [] }]).map((st, i) => {
    const shot = stepShot(st);
    return `<div class="sp-step"><div class="idx">${String(i + 1).padStart(2, '0')}</div><div class="ticket ${shot ? '' : 'nochart'}"><div>
      <div class="kind">${esc(st.kind)}</div><h3>${esc(st.title || 'Untitled step')}</h3><p>${esc(st.body)}</p>
      ${st.checks && st.checks.length ? `<ul class="checks">${st.checks.map((c) => `<li><label><input type="checkbox" ${preview ? 'tabindex="-1"' : ''} aria-label="${esc(c)}"><span>${esc(c)}</span></label></li>`).join('')}</ul>` : ''}
    </div>${shot}</div></div>`; }).join('');
  const st = s.stats || {};
  return `<div class="sp t-${esc(s.theme)}">
    <div class="sp-url"><span class="dots"><i></i><i></i><i></i></span>thetradingfloor.app/<b>@${esc(u.handle)}/${esc(s.slug || slug(s.title))}</b></div>
    <header class="sp-cover"><div class="meta"><span>${esc(s.market)}</span><span>${esc(s.session)} session</span><span>${esc(s.timeframe)}</span><span>${esc(s.style)}</span></div>
      <h1>${esc(s.title || 'Untitled strategy')}</h1><p class="tag">${esc(s.tagline)}</p>
      <div class="by">${badge(u, 44)}<div class="who"><a href="#/u/${esc(u.handle)}"><strong>${esc(u.handle)}</strong></a><small>${compact(s.followers || 0)} following, ${s.forks || 0} forks</small></div>
      ${preview ? '' : mine ? `<a class="btn btn-floor" href="#/builder?edit=${s.id}">Edit strategy</a>` : `<button class="btn btn-floor" data-act="follow-strat" data-id="${s.id}" aria-pressed="${following}">${following ? 'Following' : 'Follow strategy'}</button><button class="btn btn-line" data-act="fork" data-id="${s.id}">Fork into builder</button>`}</div></header>
    <div class="sp-stats"><div><b>${has(st.winRate) ? st.winRate + '%' : '–'}</b><small>Win rate</small></div><div><b>${has(st.avgR) ? st.avgR + 'R' : '–'}</b><small>Average winner</small></div><div><b>${has(st.sample) ? st.sample : '–'}</b><small>Trades logged</small></div>
      <div class="note">Numbers are reported by the author and are not verified by The Trading Floor.</div></div>
    <section class="sp-steps" aria-label="Steps">${steps}</section>
    ${used.length ? `<section class="sp-used"><h2>Trades using this strategy</h2><div class="thumbs">${used.map(thumbHTML).join('')}</div></section>` : ''}
  </div>`;
}
async function strategyView(id) {
  const [s, used] = await Promise.all([DB.strategy(id), DB.posts({ strategy_id: id, limit: 30 })]);
  if (!s) return shell('discover', `<div class="page">${emptyBlock('Strategy not found.', 'That strategy does not exist or was removed.', `<a class="btn btn-floor" href="#/discover">Discover strategies</a>`)}</div>`);
  document.title = s.title + ' | The Trading Floor';
  return shell('discover', strategyHTML(s, { used: used.rows }));
}

/* ============ PROFILE ============ */
let profTab = 'posts';
function thumbHTML(p) {
  POSTS.set(p.id, p);
  return `<button class="thumb" data-act="open-post" data-id="${p.id}" aria-label="Open ${esc(p.sym)} post, ${money(p.tk.pnl)}">${p.type === 'image' ? `<img src="${esc(p.url)}" alt="" loading="lazy">` : `<video src="${esc(p.url)}#t=0.1" muted playsinline preload="metadata"></video>`}
    <span class="r ${p.tk.pnl > 0 ? 'w' : ''}">${money(p.tk.pnl)}</span>${p.type === 'video' ? '<span class="rp">Video</span>' : ''}</button>`;
}
async function meView() {
  if (ME) return profileView(ME.handle, true);
  if (SESSION) return shell('me', `<div class="page">${emptyBlock('Finish your profile.', 'You are signed in. Pick a handle and a three-letter badge to start posting.', `<button class="btn btn-floor" data-act="setup">Set up profile</button> <button class="btn btn-line" data-act="signout">Sign out</button>`)}</div>`);
  return shell('me', `<div class="page">${emptyBlock('You are not signed in.', 'Sign in with Google or your email to post trades, upload replays, publish strategies and follow other traders.', `<button class="btn btn-floor" data-act="signin">Sign in or join</button>`)}</div>`);
}
async function profileView(h, isMeRoute = false) {
  const u = await DB.profileByHandle(h);
  if (!u) return shell('discover', `<div class="page">${emptyBlock('No trader with that handle.', 'Nobody has signed up as @' + esc(h) + '.', `<a class="btn btn-floor" href="#/floor">Back to the floor</a>`)}</div>`);
  const [pr, strats] = await Promise.all([DB.posts({ user_id: u.id, limit: 60 }), DB.strategies({ user_id: u.id, sort: 'new' })]);
  const posts = pr.rows;
  const wins = posts.filter((p) => p.tk.pnl > 0).length; const me = ME && u.id === ME.id; const fol = state.following.has(u.id);
  const net = posts.reduce((a, p) => a + p.tk.pnl, 0);
  let body = '';
  if (profTab === 'posts') body = posts.length ? `<div class="thumbs">${posts.map(thumbHTML).join('')}</div>` : `<div class="empty">No trades posted yet.${me ? '<br><button class="btn btn-floor" data-act="compose">Post your first trade</button>' : ''}</div>`;
  if (profTab === 'replays') { const r = posts.filter((p) => p.type === 'video'); body = r.length ? `<div class="thumbs">${r.map(thumbHTML).join('')}</div>` : `<div class="empty">No replays yet.${me ? '<br><button class="btn btn-floor" data-act="compose">Upload a screen recording</button>' : ''}</div>`; }
  if (profTab === 'strategies') body = strats.length ? `<div class="sgrid">${strats.map(scardHTML).join('')}</div>` : `<div class="empty">No strategies published.${me ? '<br><a class="btn btn-floor" href="#/builder">Build a strategy</a>' : ''}</div>`;
  document.title = '@' + u.handle + ' | The Trading Floor';
  return shell(me ? 'me' : 'discover', `<div class="page"><header class="prof">${badge(u, 150)}<div>
      <h1>${esc(u.name)}</h1><div class="h">@${esc(u.handle)}, badge ${esc(u.badge)}</div>${u.bio ? `<p>${esc(u.bio)}</p>` : ''}
      <div class="stats"><span><b>${posts.length}</b>posts</span>${posts.length ? `<span><b>${wins}/${posts.length}</b>winners</span><span><b>${money(Math.round(net * 100) / 100)}</b>net P/L</span>` : ''}<span><b>${compact(u.follower_count)}</b>followers</span><span><b>${compact(u.following_count)}</b>following</span><span><b>${strats.length}</b>strategies</span></div>
      <div class="row">${me ? `<button class="btn btn-floor" data-act="compose">${I.plus}Post a trade</button><a class="btn btn-line" href="#/builder">New strategy</a><button class="btn btn-line" data-act="signout">Sign out</button>` : `<button class="btn ${fol ? 'btn-line' : 'btn-floor'}" data-act="follow" data-uid="${u.id}">${fol ? 'Following' : 'Follow'}</button>`}
      ${(u.markets || []).map((m) => `<span class="chip" style="display:inline-grid;place-items:center">${esc(m)}</span>`).join('')}</div>
    </div></header>
    <div class="tabs" role="tablist">${[['posts', 'Posts'], ['replays', 'Replays'], ['strategies', 'Strategies']].map(([k, l]) => `<button role="tab" aria-selected="${profTab === k}" data-act="prof-tab" data-t="${k}">${l}</button>`).join('')}</div>
    ${body}</div>`);
}

/* ============ POST MODAL ============ */
async function openPostModal(id) {
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="Post" style="width:min(620px,100%)"><header><h2>Post</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header><div style="padding:20px" id="pmBody">${loadingBlock()}</div></div>`);
  const p = await DB.post(id); const body = $('#pmBody'); if (!body) return;
  if (!p) { body.innerHTML = '<div class="empty">This post was deleted.</div>'; return; }
  $('#modal h2').textContent = '@' + p.handle; body.innerHTML = postHTML(p); hydrateMedia(body);
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
/* A post is an uploaded image or video plus the trade result:
   profit or loss in dollars (required) and risk:reward (optional). */
let cmp;
async function openComposer() {
  if (!need(openComposer)) return;
  cmp = { side: 'long', sym: (ME.markets && ME.markets[0]) || 'MES', tf: '5m', session: 'New York', result: 'profit', amount: '', rr: '', caption: '', strategy: '', file: null, fileObj: null, ftype: null, busy: false };
  const ids = [...state.followedStrategies];
  const [mineS, followedS] = await Promise.all([DB.strategies({ user_id: ME.id, sort: 'new' }), DB.strategies({ ids })]);
  const mine = [...mineS, ...followedS.filter((s) => s.user_id !== ME.id)];
  openModal(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cmpH"><header><h2 id="cmpH">Post a trade</h2><button class="ib" data-act="close" aria-label="Close">${I.x}</button></header>
    <div class="compose"><div class="left">
      <div class="drop" id="drop"><div id="dropTxt">${I.upload.replace('<svg', '<svg class="drop-ic"')}<strong>Upload a screenshot or screen recording</strong>PNG, JPG, GIF, WebP, MP4, MOV or WebM, up to 50 MB. Drag it here or<br><label class="btn btn-line btn-sm" style="margin-top:14px">Choose file<input type="file" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/quicktime,video/webm" id="cmpFile" class="sr"></label></div></div>
      <div class="drop-acts"><button class="btn btn-line btn-sm" data-act="cmp-clear" id="cmpClear" hidden>Remove file</button></div>
    </div>
    <div class="right">
      <div class="g3"><label class="field"><span>Market</span><select class="input" data-k="sym">${Object.keys(SYMBOLS).map((k) => `<option ${k === cmp.sym ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="field"><span>Timeframe</span><select class="input" data-k="tf">${['1m', '2m', '5m', '15m', '1h'].map((k) => `<option ${k === cmp.tf ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="field"><span>Session</span><select class="input" data-k="session">${['Asia', 'London', 'New York'].map((k) => `<option ${k === cmp.session ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <fieldset class="tk-set"><legend>Trade result</legend>
        <div class="tk-segs"><div class="seg" role="group" aria-label="Side"><button type="button" data-side="long" aria-pressed="true">Long</button><button type="button" data-side="short" aria-pressed="false">Short</button></div>
          <div class="seg seg-pl" role="group" aria-label="Profit or loss"><button type="button" data-res="profit" aria-pressed="true">Profit</button><button type="button" data-res="loss" aria-pressed="false">Loss</button></div></div>
        <div class="g2"><label class="field"><span>Profit / loss</span><div class="money"><i aria-hidden="true">$</i><input class="input num" inputmode="decimal" data-k="amount" placeholder="420" autocomplete="off"></div></label>
          <label class="field"><span>Risk:reward <em class="opt">optional</em></span><div class="money rr"><i aria-hidden="true">1:</i><input class="input num" inputmode="decimal" data-k="rr" placeholder="2.5" autocomplete="off"></div></label></div>
        <div class="rcalc" id="rcalc">Enter how much you made or lost on the trade.</div></fieldset>
      ${mine.length ? `<label class="field"><span>Strategy used</span><select class="input" data-k="strategy"><option value="">None</option>${mine.map((s) => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Caption</span><textarea class="input" data-k="caption" maxlength="600" placeholder="What did you see, and why did you take it?"></textarea></label>
      <div class="err" id="cmpErr" role="alert"></div>
      <button class="btn btn-floor" data-act="cmp-post" id="cmpGo">Post to the floor</button>
    </div></div></div>`);
  const m = $('#modal');
  m.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k === 'rr' && /^\s*1\s*[:/]/.test(e.target.value)) e.target.value = e.target.value.replace(/^\s*1\s*[:/]\s*/, ''); if (k) { cmp[k] = e.target.value; $('#cmpErr').textContent = ''; cmpUpdate(); } });
  m.addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) { cmp[k] = e.target.value; cmpUpdate(); } if (e.target.id === 'cmpFile') cmpFile(e.target.files[0]); });
  $$('[data-side]', m).forEach((b) => b.addEventListener('click', () => { cmp.side = b.dataset.side; $$('[data-side]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); cmpUpdate(); }));
  $$('[data-res]', m).forEach((b) => b.addEventListener('click', () => { cmp.result = b.dataset.res; $$('[data-res]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); cmpUpdate(); }));
  const d = $('#drop'); ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('on'); }));
  ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('on'); }));
  d.addEventListener('drop', (e) => cmpFile(e.dataTransfer.files[0]));
}
function cmpFile(f) {
  if (!f) return; const err = $('#cmpErr');
  if (!/^(image\/(png|jpeg|gif|webp)|video\/(mp4|quicktime|webm))$/.test(f.type)) { err.textContent = 'That file type is not supported. Use PNG, JPG, GIF, WebP, MP4, MOV or WebM.'; return; }
  if (f.size > MAX_UPLOAD) { err.textContent = 'That file is over 50 MB. Trim the recording or export it smaller and try again.'; return; }
  if (cmp.file) URL.revokeObjectURL(cmp.file);
  cmp.file = URL.createObjectURL(f); cmp.fileObj = f; cmp.ftype = f.type.startsWith('video') ? 'video' : 'image'; err.textContent = ''; cmpUpdate();
}
function cmpNums() {
  const amt = cmp.amount.trim() === '' ? NaN : Number(cmp.amount.replace(/[$,\s]/g, ''));
  const m = cmp.rr.trim().match(/^(?:1\s*[:/]\s*)?(\d+(?:\.\d+)?)$/);
  return { amt, rr: cmp.rr.trim() === '' ? null : m ? Number(m[1]) : NaN };
}
function cmpUpdate() {
  const { amt, rr } = cmpNums(); const rc = $('#rcalc'); const drop = $('#drop'); if (!rc) return;
  if (isFinite(amt) && amt >= 0) { const pnl = cmp.result === 'loss' ? -amt : amt; rc.innerHTML = `Shows on your post as <b>${money(pnl)}</b>${rr && isFinite(rr) && rr > 0 ? `, risk:reward <b>${rrTxt(rr)}</b>` : ''}.`; }
  else rc.textContent = 'Enter how much you made or lost on the trade.';
  $('#cmpClear').hidden = !cmp.file;
  const pv = drop.querySelector('img, video');
  if (cmp.file) { if (!pv || pv.dataset.src !== cmp.file) { pv && pv.remove(); drop.insertAdjacentHTML('beforeend', cmp.ftype === 'video' ? `<video src="${cmp.file}" data-src="${cmp.file}" autoplay muted loop playsinline></video>` : `<img src="${cmp.file}" data-src="${cmp.file}" alt="Upload preview">`); } $('#dropTxt').style.visibility = 'hidden'; }
  else { pv && pv.remove(); $('#dropTxt').style.visibility = ''; }
}
async function cmpPost() {
  if (cmp.busy) return;
  const err = $('#cmpErr'); const go = $('#cmpGo');
  if (!cmp.fileObj) return (err.textContent = 'Add a screenshot or screen recording of the trade.');
  const { amt, rr } = cmpNums();
  if (!isFinite(amt) || amt < 0) return (err.textContent = 'Enter the profit or loss as a dollar amount, for example 420. Use the Profit / Loss switch for the sign.');
  if (amt > 1e11) return (err.textContent = 'That amount is too large.');
  if (rr !== null && (!isFinite(rr) || rr <= 0 || rr > 999999)) return (err.textContent = 'Write risk:reward as a number, for example 2.5 for 1:2.5. Or leave it empty.');
  cmp.busy = true; go.disabled = true; go.classList.add('busy'); go.textContent = cmp.ftype === 'video' ? 'Uploading video...' : 'Uploading...';
  const up = await DB.upload(cmp.fileObj, 'posts');
  if (up.error) { cmp.busy = false; go.disabled = false; go.classList.remove('busy'); go.textContent = 'Post to the floor'; err.textContent = up.error; return; }
  go.textContent = 'Posting...';
  const res = await DB.createPost({ media_path: up.path, media_type: cmp.ftype, sym: cmp.sym, tf: cmp.tf, session: cmp.session, side: cmp.side, pnl: cmp.result === 'loss' ? -amt : amt, rr, caption: cmp.caption.trim(), strategy_id: cmp.strategy || null });
  if (res.error) { cmp.busy = false; go.disabled = false; go.classList.remove('busy'); go.textContent = 'Post to the floor'; err.textContent = res.error; return; }
  URL.revokeObjectURL(cmp.file); cmp = null; closeModal(); feedFilter = 'all';
  if (location.hash === '#/floor') render(); else location.hash = '#/floor'; toast('Posted to the floor');
}

/* ============ BUILDER ============ */
const KINDS = ['Setup', 'Trigger', 'Entry', 'Stop', 'Target', 'Management', 'Rule'];
function newDraft() { return { title: '', tagline: '', market: 'MES', session: 'New York', timeframe: '5m', style: 'ICT', theme: 'floor', stats: { winRate: '', avgR: '', sample: '' }, steps: [{ kind: 'Setup', title: '', body: '', checks: [] }], open: 0 }; }
async function builderView(params) {
  const src = params.get('edit') || params.get('fork');
  if (src && (!state.draft || state.draft._src !== src)) {
    const s = await DB.strategy(src);
    if (s && params.get('edit') && ME && s.user_id === ME.id) state.draft = { ...JSON.parse(JSON.stringify(s)), editing: s.id, _src: src, open: 0 };
    else if (s && params.get('fork')) state.draft = { ...JSON.parse(JSON.stringify(s)), id: null, user_id: null, handle: null, title: (s.title + ' (fork)').slice(0, 60), followers: 0, forks: 0, forkOf: s.id, _src: src, open: 0 };
    if (s && state.draft && state.draft._src === src) state.draft.stats = { winRate: s.stats.winRate ?? '', avgR: s.stats.avgR ?? '', sample: s.stats.sample ?? '' };
  }
  if (!state.draft) { try { state.draft = JSON.parse(sessionStorage.getItem('tf_draft') || 'null'); } catch (e) { state.draft = null; } sessionStorage.removeItem('tf_draft'); }
  if (!state.draft) state.draft = newDraft();
  return shell('builder', `<div class="bld"><div class="bld-ed" id="bldEd"></div><div class="bld-pv" aria-label="Live preview"><div class="frame" id="bldPv"></div></div></div>`);
}
function renderBuilder() {
  const d = state.draft; const ed = $('#bldEd'); if (!ed) return;
  const opt = (arr, v) => arr.map((k) => `<option ${k === v ? 'selected' : ''}>${esc(k)}</option>`).join('');
  ed.innerHTML = `<div><h1>Strategy builder</h1><p class="sub">Write your strategy one step at a time. It publishes as its own page on your profile and in Discover.${d.forkOf ? ' This is a fork, your changes publish as a new strategy.' : ''}${ME ? '' : ' You can start writing now and sign in when you publish.'}</p></div>
    <div class="bld-sec"><label class="field"><span>Name</span><input class="input" data-d="title" maxlength="60" value="${esc(d.title)}" placeholder="London Sweep to Fair Value Gap"></label>
      <label class="field"><span>One line summary</span><input class="input" data-d="tagline" maxlength="120" value="${esc(d.tagline)}" placeholder="What this strategy does, in one sentence"></label>
      <div class="bld-grid2"><label class="field"><span>Market</span><select class="input" data-d="market">${opt(Object.keys(SYMBOLS), d.market)}</select></label>
        <label class="field"><span>Session</span><select class="input" data-d="session">${opt(['Asia', 'London', 'New York', 'Any'], d.session)}</select></label>
        <label class="field"><span>Timeframe</span><input class="input" data-d="timeframe" maxlength="20" value="${esc(d.timeframe)}"></label>
        <label class="field"><span>Style</span><select class="input" data-d="style">${opt(['ICT', 'Auction', 'Order flow', 'Breakout', 'Mean reversion', 'Momentum'], d.style)}</select></label></div>
      <div class="field"><span>Page look</span><div class="themes" role="group" aria-label="Page look">${[['floor', '#18A583', 'Phthalo green'], ['paper', '#EFE9D8', 'Ticket paper'], ['board', '#0C1F18', 'Dark board']].map(([k, c, l]) => `<button type="button" data-act="theme" data-v="${k}" style="background:${c}" aria-label="${l}" aria-pressed="${d.theme === k}"></button>`).join('')}</div></div></div>
    <div class="bld-sec"><header><h2>Steps</h2><span class="sub">${d.steps.length} of 12</span></header>
      ${d.steps.map((st, i) => stepEditor(st, i, d.open === i)).join('')}
      ${d.steps.length < 12 ? `<div class="field"><span>Add a step</span><div class="addstep">${KINDS.map((k) => `<button type="button" data-act="add-step" data-k="${k}">${k}</button>`).join('')}</div></div>` : ''}</div>
    <div class="bld-sec"><header><h2>Your numbers</h2><span class="sub">Optional, shown as author-reported</span></header>
      <div class="g3"><label class="field"><span>Win rate %</span><input class="input num" inputmode="decimal" data-st="winRate" value="${esc(d.stats.winRate)}"></label><label class="field"><span>Avg winner R</span><input class="input num" inputmode="decimal" data-st="avgR" value="${esc(d.stats.avgR)}"></label><label class="field"><span>Trades logged</span><input class="input num" inputmode="numeric" data-st="sample" value="${esc(d.stats.sample)}"></label></div></div>
    <div class="bld-bar"><div class="err" id="bldErr" role="alert"></div><button class="btn btn-line" data-act="bld-reset">Start over</button><button class="btn btn-floor" data-act="bld-publish" id="bldGo">${d.editing ? 'Save changes' : 'Publish strategy'}</button></div>`;
  renderPreview();
}
function stepEditor(st, i, open) {
  const n = state.draft.steps.length; const img = st.preview || (st.img ? DB.mediaUrl(st.img) : '');
  return `<div class="stepcard"><header><span class="n">${String(i + 1).padStart(2, '0')}</span><button class="t" data-act="step-open" data-i="${i}" aria-expanded="${open}" style="text-align:left">${esc(st.title || 'Untitled step')}<small>${esc(st.kind)}</small></button>
    <button class="ib" data-act="step-up" data-i="${i}" aria-label="Move step up" ${i === 0 ? 'disabled' : ''}>${I.up}</button><button class="ib" data-act="step-down" data-i="${i}" aria-label="Move step down" ${i === n - 1 ? 'disabled' : ''}>${I.down}</button><button class="ib" data-act="step-del" data-i="${i}" aria-label="Delete step">${I.x}</button></header>
    ${open ? `<div class="ed"><div class="bld-grid2"><label class="field"><span>Type</span><select class="input" data-s="kind" data-i="${i}">${KINDS.map((k) => `<option ${k === st.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="field"><span>Title</span><input class="input" data-s="title" data-i="${i}" maxlength="70" value="${esc(st.title)}" placeholder="Mark the Asia range"></label></div>
      <label class="field"><span>What to do</span><textarea class="input" data-s="body" data-i="${i}" maxlength="600" placeholder="Explain it so someone else could follow it">${esc(st.body)}</textarea></label>
      <div class="field"><span>Checklist</span><div class="chk-list">${st.checks.map((c, j) => `<div class="it"><span>${esc(c)}</span><button class="ib" data-act="chk-del" data-i="${i}" data-j="${j}" aria-label="Remove ${esc(c)}">${I.x}</button></div>`).join('')}</div>
        <div class="chk-row"><input class="input" id="chk-${i}" maxlength="80" placeholder="Something to tick off before acting"><button class="btn btn-line btn-sm" style="height:40px" data-act="chk-add" data-i="${i}">Add</button></div></div>
      <div class="field"><span>Example screenshot</span><div class="media-pick">${img ? `<div class="pv"><img src="${esc(img)}" alt=""></div>` : ''}
        <label class="btn btn-line btn-sm">${img ? 'Replace image' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="sr" data-act="step-img" data-i="${i}"></label>
        ${img ? `<button class="btn btn-line btn-sm" data-act="step-nomedia" data-i="${i}">Remove</button>` : ''}</div></div>
    </div>` : ''}</div>`;
}
let _pvT;
function renderPreview() { clearTimeout(_pvT); _pvT = setTimeout(() => { const pv = $('#bldPv'); if (!pv || !state.draft) return; const d = state.draft; pv.innerHTML = strategyHTML({ ...d, handle: null, followers: d.editing ? d.followers : 0, forks: d.editing ? d.forks : 0 }, { preview: true }); }, 60); }
async function publishDraft() {
  const d = state.draft; const err = $('#bldErr'); const go = $('#bldGo');
  if (d.title.trim().length < 4) { err.textContent = 'Give the strategy a name of at least 4 characters.'; $('[data-d="title"]').focus(); return; }
  if (d.steps.length < 2) { err.textContent = 'Add at least 2 steps.'; return; }
  const bad = d.steps.findIndex((s) => !s.title.trim()); if (bad > -1) { err.textContent = `Step ${bad + 1} needs a title.`; d.open = bad; renderBuilder(); return; }
  if (!need(publishDraft)) return;
  go.disabled = true; go.textContent = 'Publishing...'; err.textContent = '';
  const steps = [];
  for (const st of d.steps) {
    let img = st.img || null;
    if (st.file) { const up = await DB.upload(st.file, 'steps'); if (up.error) { err.textContent = up.error; go.disabled = false; go.textContent = d.editing ? 'Save changes' : 'Publish strategy'; return; } img = up.path; }
    steps.push({ kind: st.kind, title: st.title.trim(), body: st.body.trim(), checks: st.checks, img });
  }
  const num = (v) => (v === '' || v == null || !isFinite(Number(v)) ? null : Number(v));
  const row = { slug: slug(d.title), title: d.title.trim(), tagline: d.tagline.trim(), market: d.market, session: d.session, timeframe: d.timeframe.trim(), style: d.style, theme: d.theme,
    stats: { winRate: num(d.stats.winRate), avgR: num(d.stats.avgR), sample: num(d.stats.sample) }, steps };
  if (!d.editing && d.forkOf) row.fork_of = d.forkOf;
  const res = await DB.saveStrategy(row, d.editing);
  if (res.error) { err.textContent = res.error; go.disabled = false; go.textContent = d.editing ? 'Save changes' : 'Publish strategy'; return; }
  const was = d.editing; state.draft = null; location.hash = '#/s/' + res.id; toast(was ? 'Strategy saved' : 'Strategy published');
}

/* ============ EVENTS (delegated) ============ */
function bump(sel, delta) { $$(sel).forEach((b) => { const s = b.querySelector('span'); if (s) s.textContent = compact(Math.max(0, (parseInt(s.textContent.replace(/[^0-9]/g, '')) || 0) + delta)); }); }
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act; const id = el.dataset.id;
  const d = state.draft; const i = +el.dataset.i;
  switch (a) {
    case 'signin': openAuth(); break;
    case 'setup': openProfileSetup(); break;
    case 'signout': closeModal(); await DB.signOut(); location.hash = '#/floor'; render(); toast('Signed out'); break;
    case 'reload': render(true); break;
    case 'compose': openComposer(); break;
    case 'close': closeModal(); break;
    case 'cmp-post': cmpPost(); break;
    case 'cmp-clear': if (cmp.file) URL.revokeObjectURL(cmp.file); cmp.file = null; cmp.fileObj = null; cmp.ftype = null; $('#cmpFile').value = ''; cmpUpdate(); break;
    case 'like': {
      if (!need()) break; const on = !state.liked.has(id); on ? state.liked.add(id) : state.liked.delete(id);
      $$(`[data-act="like"][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', on)); bump(`[data-act="like"][data-id="${id}"]`, on ? 1 : -1);
      const m = await DB.setLike(id, on); if (m) { toast(m); on ? state.liked.delete(id) : state.liked.add(id); $$(`[data-act="like"][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', !on)); bump(`[data-act="like"][data-id="${id}"]`, on ? -1 : 1); }
      break; }
    case 'save': {
      if (!need()) break; const on = !state.saved.has(id); on ? state.saved.add(id) : state.saved.delete(id);
      $$(`[data-act="save"][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
      const m = await DB.setSave(id, on); if (m) { toast(m); on ? state.saved.delete(id) : state.saved.add(id); $$(`[data-act="save"][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', !on)); } else toast(on ? 'Saved' : 'Removed from saved');
      break; }
    case 'del-post': {
      const p = POSTS.get(id); if (!p || !confirm('Delete this post? This cannot be undone.')) break;
      const m = await DB.deletePost(p); if (m) { toast(m); break; }
      closeModal(); $$(`[data-post="${id}"]`).forEach((n) => n.remove()); toast('Post deleted'); break; }
    case 'focus-cmt': $(`#c-${id}`)?.focus(); break;
    case 'feed-filter': feedFilter = el.dataset.f; render(); break;
    case 'disc-style': disc.style = el.dataset.v; $$('[data-act="disc-style"]').forEach((b) => b.setAttribute('aria-pressed', b === el)); renderDiscGrid(); break;
    case 'follow-strat': { if (!need()) break; const on = !state.followedStrategies.has(id); const m = await DB.setStrategyFollow(id, on); if (m) { toast(m); break; } render(true); toast(on ? 'Following strategy' : 'Unfollowed strategy'); break; }
    case 'fork': state.draft = null; location.hash = '#/builder?fork=' + id; break;
    case 'follow': { if (!need()) break; const u = el.dataset.uid; const on = !state.following.has(u); const m = await DB.setFollow(u, on); if (m) { toast(m); break; } render(true); break; }
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
    case 'step-nomedia': d.steps[i].img = null; d.steps[i].file = null; d.steps[i].preview = null; renderBuilder(); break;
    case 'bld-reset': if (confirm('Clear this draft and start a new strategy?')) { state.draft = newDraft(); location.hash = '#/builder'; renderBuilder(); } break;
    case 'bld-publish': publishDraft(); break;
  }
});
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
document.addEventListener('submit', async (e) => {
  const f = e.target.closest('[data-act="comment"]'); if (!f) return; e.preventDefault();
  if (!need()) return;
  const inp = f.querySelector('input'); const v = inp.value.trim(); if (!v) return;
  inp.disabled = true; const m = await DB.addComment(f.dataset.id, v); inp.disabled = false;
  if (m) { toast(m); return; }
  inp.value = '';
  const c = f.previousElementSibling; c.insertAdjacentHTML('beforeend', `<div><a href="#/u/${esc(ME.handle)}">${esc(ME.handle)}</a>${esc(v)}</div>`);
  bump(`[data-act="focus-cmt"][data-id="${f.dataset.id}"]`, 1);
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
  if (t.dataset.act === 'disc-s') { disc.sort = t.value; render(true); }
  if (t.dataset.s === 'kind' && state.draft) { state.draft.steps[+t.dataset.i].kind = t.value; renderPreview(); }
  if (t.dataset.act === 'step-img' && t.files[0]) {
    const f = t.files[0]; if (!/^image\/(png|jpeg|gif|webp)$/.test(f.type)) { $('#bldErr').textContent = 'Example screenshots need to be PNG, JPG, GIF or WebP.'; return; }
    if (f.size > MAX_UPLOAD) { $('#bldErr').textContent = 'That image is over 50 MB.'; return; }
    const st = state.draft.steps[+t.dataset.i]; st.file = f; st.preview = URL.createObjectURL(f); renderBuilder();
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id && e.target.id.startsWith('chk-')) { e.preventDefault(); $(`[data-act="chk-add"][data-i="${e.target.id.slice(4)}"]`).click(); } });

/* ============ ROUTER ============ */
let lastRoute = null, _tok = 0;
function parseHash() { const h = location.hash.replace(/^#/, '') || '/'; const [path, qs] = h.split('?'); return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') }; }
const ACTIVE = { floor: 'floor', replays: 'replays', discover: 'discover', s: 'discover', u: 'discover', me: 'me', builder: 'builder' };
async function render(keepScroll = false) {
  const tok = ++_tok; const y = scrollY; const { parts, params } = parseHash(); const r = parts[0] || '';
  destroyReplays(); destroyMedia(); if (_moreIO) _moreIO.disconnect(); Landing.destroy(); POSTS.clear();
  const app = $('#app');
  if (r === '') { closeModal(); app.innerHTML = Landing.html(); document.title = 'The Trading Floor'; Landing.init(); window.scrollTo(0, 0); lastRoute = '#/'; return; }
  if (!keepScroll) app.innerHTML = shell(ACTIVE[r] || 'floor', `<div class="page">${loadingBlock()}</div>`);
  let html;
  try {
    if (r === 'floor') html = await feedView();
    else if (r === 'replays') html = await replaysView();
    else if (r === 'discover') html = await discoverView();
    else if (r === 's') html = await strategyView(parts[1]);
    else if (r === 'me') { if (lastRoute !== '#/me') profTab = 'posts'; html = await meView(); }
    else if (r === 'u') { if (ME && parts[1] === ME.handle) { location.replace('#/me'); return; } if (lastRoute !== location.hash.split('?')[0]) profTab = 'posts'; html = await profileView(parts[1] || ''); }
    else if (r === 'builder') html = await builderView(params);
    else html = shell('floor', `<div class="page">${emptyBlock('Not on the floor.', 'That page does not exist.', `<a class="btn btn-floor" href="#/floor">Go to the feed</a>`)}</div>`);
  } catch (err) { console.error(err); html = shell(ACTIVE[r] || 'floor', `<div class="page">${errorBlock('Could not reach the server. Check your connection and try again.')}</div>`); }
  if (tok !== _tok) return; // a newer navigation started while this one was loading
  app.innerHTML = html;
  if (!['s', 'u', 'me'].includes(r) || !document.title.includes('|')) document.title = `${({ floor: 'The Floor', replays: 'Replays', discover: 'Discover strategies', s: 'Strategy', u: 'Profile', me: 'Profile', builder: 'Strategy builder' })[r] || 'Not found'} | The Trading Floor`;
  if (r === 'discover') renderDiscGrid();
  if (r === 'builder') renderBuilder();
  if (r === 'floor') watchFeedMore();
  hydrateMedia(app);
  window.scrollTo(0, keepScroll ? y : 0);
  lastRoute = location.hash.split('?')[0];
}
function go() {
  const was = lastRoute === '#/' || lastRoute === '' || lastRoute === null; const toLanding = (location.hash || '#/') === '#/';
  closeModal();
  if (!reduced && window.gsap && lastRoute !== null && (was !== toLanding)) {
    const sh = $('#shutter');
    gsap.timeline().set(sh, { transformOrigin: 'bottom' }).to(sh, { scaleY: 1, duration: 0.4, ease: 'expo.inOut' })
      .add(() => render()).set(sh, { transformOrigin: 'top' }).to(sh, { scaleY: 0, duration: 0.5, ease: 'expo.inOut' });
  } else render();
}
addEventListener('hashchange', go);
/* re-render when someone signs in or out in this tab or another */
addEventListener('tf:auth', () => { if ((location.hash || '#/') !== '#/') render(true); });
