/* ============ BACKEND (Supabase) ============ */
/* The publishable key is meant to be public. What anyone can read or write is
   decided by the row level security rules in the database, not by this key. */
const SUPABASE_URL = 'https://grcldjuolszcidfitxgo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cfJe5103VSlxakj3FvsJzg_mAH7uQIH';
const MEDIA_BUCKET = 'media';
const MAX_UPLOAD = 50 * 1024 * 1024; // matches the storage bucket limit

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

let SESSION = null; // Supabase auth session (signed in or not)
let ME = null;      // the signed-in person's profile row, null until they set one up

const state = { liked: new Set(), saved: new Set(), clipLiked: new Set(), clipSaved: new Set(), following: new Set(), followedStrategies: new Set(), blocked: new Set(), draft: null };

function dbError(error, fallback) {
  if (!error) return null;
  const m = (error.message || '') + ' ' + (error.details || '');
  if (/PROFANITY_HANDLE/.test(m)) return 'That handle is not allowed. Please choose another one.';
  if (/PROFANITY_NAME/.test(m)) return 'That display name is not allowed. Please choose another one.';
  if (/PROFANITY_BADGE/.test(m)) return 'That badge is not allowed. Please pick three different letters.';
  if (error.code === '23505' && /handle/.test(m)) return 'That handle is taken. Try another one.';
  if (error.code === '23505' && /badge/.test(m)) return 'That badge is taken. Pick another three letters.';
  if (/JWT|not authenticated|permission denied|row-level security/i.test(m)) return 'Your session ended. Sign in again and retry.';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Could not reach the server. Check your connection and try again.';
  return fallback || 'Something went wrong. Please try again.';
}
const uid = () => SESSION?.user?.id || null;

const DB = {
  /* ---------- auth ---------- */
  async init() {
    const { data } = await sb.auth.getSession();
    SESSION = data.session;
    await DB.loadMe();
    sb.auth.onAuthStateChange(async (event, session) => {
      const was = SESSION?.user?.id; SESSION = session;
      if ((session?.user?.id || null) !== (was || null)) { await DB.loadMe(); window.dispatchEvent(new CustomEvent('tf:auth', { detail: event })); }
    });
  },
  async loadMe() {
    ME = null; state.liked.clear(); state.saved.clear(); state.clipLiked.clear(); state.clipSaved.clear(); state.following.clear(); state.followedStrategies.clear(); state.blocked.clear();
    if (!uid()) return;
    const { data } = await sb.from('profiles_stats').select('*').eq('id', uid()).maybeSingle();
    ME = data || null;
    if (ME) {
      const [f, sf] = await Promise.all([
        sb.from('follows').select('following_id').eq('follower_id', uid()),
        sb.from('strategy_follows').select('strategy_id').eq('user_id', uid()),
      ]);
      (f.data || []).forEach((r) => state.following.add(r.following_id));
      (sf.data || []).forEach((r) => state.followedStrategies.add(r.strategy_id));
      await DB.loadBlocks();
    }
  },
  /* Inside the iOS app, sign-in pages can't load in the app's own webview
     (Google refuses embedded browsers), so the app opens the system browser
     and Supabase sends the person back through the app's own link scheme. */
  APP_CALLBACK: 'app.thetradingfloor.ios://auth-callback',
  redirectTo() { return window.TF_NATIVE ? DB.APP_CALLBACK : location.origin + location.pathname; },
  async signInGoogle() {
    if (window.TF_NATIVE && window.tfOpenAuth) {
      const { data, error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: DB.APP_CALLBACK, skipBrowserRedirect: true } });
      if (error) return /provider is not enabled|Unsupported provider/i.test(error.message) ? 'Google sign-in is not switched on yet. Use email for now.' : dbError(error);
      await window.tfOpenAuth(data.url);
      return null;
    }
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: DB.redirectTo() } });
    return error ? (/provider is not enabled|Unsupported provider/i.test(error.message) ? 'Google sign-in is not switched on yet. Use email for now.' : dbError(error)) : null;
  },
  async sendEmailLink(email) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: DB.redirectTo(), shouldCreateUser: true } });
    if (!error) return null;
    if (/rate limit|too many|seconds/i.test(error.message)) return 'Too many sign-in emails were sent recently. Wait a few minutes and try again.';
    return dbError(error, 'Could not send the email. Check the address and try again.');
  },
  async verifyEmailCode(email, token) {
    const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
    return error ? 'That code did not work. Check it, or request a new email.' : null;
  },
  /* called when the system browser hands the app back its callback link */
  async finishAppSignIn(url) {
    try {
      const u = new URL(url.replace('app.thetradingfloor.ios://', 'https://callback/'));
      const q = new URLSearchParams(u.search); const h = new URLSearchParams(u.hash.replace(/^#/, ''));
      const err = q.get('error_description') || h.get('error_description');
      if (err) return err.replace(/\+/g, ' ');
      const code = q.get('code');
      if (code) { const { error } = await sb.auth.exchangeCodeForSession(code); if (error) return dbError(error, 'Sign-in did not finish. Try again.'); }
      else if (h.get('access_token')) {
        const { error } = await sb.auth.setSession({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token') });
        if (error) return dbError(error, 'Sign-in did not finish. Try again.');
      } else return 'Sign-in did not finish. Try again.';
      const { data } = await sb.auth.getSession(); SESSION = data.session; await DB.loadMe();
      return null;
    } catch (e) { return 'Sign-in did not finish. Try again.'; }
  },
  async signOut() {
    try { await DB.dropPushToken(window.tfPushToken); } catch (e) {}
    await sb.auth.signOut(); SESSION = null; await DB.loadMe();
  },

  /* ---------- profiles ---------- */
  async createProfile(p) {
    const { error } = await sb.from('profiles').insert({ id: uid(), ...p });
    if (error) return dbError(error, 'Could not create your profile.');
    await DB.loadMe(); return null;
  },
  async isTaken(col, value) {
    const { data } = await sb.from('profiles').select('id').eq(col, value).limit(1);
    return !!(data && data.length);
  },
  async profileByHandle(h) {
    const { data } = await sb.from('profiles_stats').select('*').eq('handle', h).maybeSingle();
    return data;
  },

  /* ---------- profile picture ---------- */
  /* Shrink and square-crop in the browser first: a phone photo is often several
     MB, and all we ever show is a small circle. */
  async avatarBlob(file, size = 512) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas'); c.width = c.height = Math.min(size, side);
      const x = c.getContext('2d');
      x.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, c.width, c.height);
      return await new Promise((res) => c.toBlob(res, 'image/webp', 0.85));
    } finally { URL.revokeObjectURL(url); }
  },
  async setAvatar(file) {
    const blob = await DB.avatarBlob(file);
    if (!blob) return { error: 'That image could not be read. Try a PNG or JPG.' };
    const path = `${uid()}/avatar/${Date.now()}.webp`;
    const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
    if (error) return { error: dbError(error, 'The picture could not be uploaded.') };
    const old = ME && ME.avatar_path;
    const msg = await DB.updateProfile({ avatar_path: path });
    if (msg) return { error: msg };
    if (old && old !== path) await sb.storage.from(MEDIA_BUCKET).remove([old]);
    return { path };
  },
  async removeAvatar() {
    const old = ME && ME.avatar_path; if (!old) return null;
    const msg = await DB.updateProfile({ avatar_path: null });
    if (msg) return msg;
    await sb.storage.from(MEDIA_BUCKET).remove([old]);
    return null;
  },
  async updateProfile(patch) {
    const { error } = await sb.from('profiles').update(patch).eq('id', uid());
    if (error) return dbError(error, 'Could not save your profile.');
    await DB.loadMe(); return null;
  },

  /* ---------- media ---------- */
  mediaUrl(path) {
    if (!path) return '';
    if (/^(https?:|blob:|data:)/.test(path)) return path;
    return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  },
  async upload(file, folder) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
    const path = `${uid()}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
    if (error) return { error: /size|too large|exceed/i.test(error.message) ? 'That file is over 50 MB. Trim it and try again.' : /mime|type/i.test(error.message) ? 'That file type is not allowed. Use PNG, JPG, GIF, WebP, MP4, MOV or WebM.' : dbError(error, 'The upload failed. Try again.') };
    return { path };
  },

  /* ---------- posts ---------- */
  norm(r) {
    return { id: r.id, user_id: r.user_id, handle: r.handle, badge: r.badge, tone: r.tone, avatar_path: r.avatar_path, type: r.media_type, path: r.media_path, url: DB.mediaUrl(r.media_path),
      sym: r.sym, tf: r.tf, session: r.session, tk: { side: r.side, pnl: Number(r.pnl), rr: r.rr == null ? null : Number(r.rr) },
      caption: r.caption, strategy_id: r.strategy_id, likes: r.like_count || 0, commentCount: r.comment_count || 0, comments: [], t: Date.parse(r.created_at), created_at: r.created_at };
  },
  async posts({ filter = 'all', user_id, strategy_id, video, before, limit = 20 } = {}) {
    let q = sb.from('posts_feed').select('*').order('created_at', { ascending: false }).limit(limit);
    if (user_id) q = q.eq('user_id', user_id);
    if (strategy_id) q = q.eq('strategy_id', strategy_id);
    if (video || filter === 'videos') q = q.eq('media_type', 'video');
    if (filter === 'photos') q = q.eq('media_type', 'image');
    if (filter === 'wins') q = q.gt('pnl', 0);
    if (filter === 'losses') q = q.lt('pnl', 0);
    if (filter === 'following') { const ids = [...state.following]; if (uid()) ids.push(uid()); if (!ids.length) return { rows: [] }; q = q.in('user_id', ids); }
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q;
    if (error) return { rows: [], error: dbError(error, 'Could not load posts.') };
    const rows = data.map(DB.norm);
    await DB.decorate(rows);
    return { rows };
  },
  async post(id) {
    const { data } = await sb.from('posts_feed').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    const p = DB.norm(data); await DB.decorate([p], 50); return p;
  },
  /* adds recent comments plus my likes and saves to a list of posts */
  async decorate(rows, perPost = 2) {
    if (!rows.length) return;
    const ids = rows.map((r) => r.id);
    const jobs = [sb.from('comments_list').select('*').in('post_id', ids).order('created_at', { ascending: true }).limit(perPost > 2 ? 200 : ids.length * 12)];
    if (ME) { jobs.push(sb.from('likes').select('post_id').eq('user_id', uid()).in('post_id', ids)); jobs.push(sb.from('saves').select('post_id').eq('user_id', uid()).in('post_id', ids)); }
    const [c, l, s] = await Promise.all(jobs);
    const by = {}; (c.data || []).forEach((x) => (by[x.post_id] = by[x.post_id] || []).push(x));
    rows.forEach((r) => { r.comments = (by[r.id] || []).slice(-perPost); });
    (l?.data || []).forEach((x) => state.liked.add(x.post_id));
    (s?.data || []).forEach((x) => state.saved.add(x.post_id));
  },
  async createPost(p) {
    const { data, error } = await sb.from('posts').insert({ user_id: uid(), ...p }).select('id').single();
    return error ? { error: dbError(error, 'Could not publish the post.') } : { id: data.id };
  },
  async deletePost(p) {
    const { error } = await sb.from('posts').delete().eq('id', p.id);
    if (error) return dbError(error, 'Could not delete the post.');
    if (p.path && !/^(https?:|blob:)/.test(p.path)) await sb.storage.from(MEDIA_BUCKET).remove([p.path]);
    return null;
  },

  /* ---------- interactions ---------- */
  async setLike(postId, on) {
    const q = on ? sb.from('likes').insert({ user_id: uid(), post_id: postId }) : sb.from('likes').delete().eq('user_id', uid()).eq('post_id', postId);
    const { error } = await q; return error && error.code !== '23505' ? dbError(error) : null;
  },
  async setSave(postId, on) {
    const q = on ? sb.from('saves').insert({ user_id: uid(), post_id: postId }) : sb.from('saves').delete().eq('user_id', uid()).eq('post_id', postId);
    const { error } = await q; return error && error.code !== '23505' ? dbError(error) : null;
  },
  async addComment(postId, body) {
    const { error } = await sb.from('comments').insert({ user_id: uid(), post_id: postId, body });
    return error ? dbError(error, 'Could not post the comment.') : null;
  },
  async setFollow(userId, on) {
    const q = on ? sb.from('follows').insert({ follower_id: uid(), following_id: userId }) : sb.from('follows').delete().eq('follower_id', uid()).eq('following_id', userId);
    const { error } = await q; if (!error) on ? state.following.add(userId) : state.following.delete(userId);
    return error && error.code !== '23505' ? dbError(error) : null;
  },

  /* ---------- search ---------- */
  /* Free-text search across traders, posts and strategies. PostgREST's or()
     filter treats commas and parens as syntax, so the query is stripped first. */
  clean(q) { return String(q || '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60); },
  async searchProfiles(q, limit = 24) {
    const s = DB.clean(q); if (!s) return [];
    const { data } = await sb.from('profiles_stats').select('*')
      .or(`handle.ilike.%${s}%,name.ilike.%${s}%,bio.ilike.%${s}%`).limit(limit);
    return data || [];
  },
  async searchPosts(q, { video, limit = 30 } = {}) {
    const s = DB.clean(q);
    let sel = sb.from('posts_feed').select('*').order('created_at', { ascending: false }).limit(limit);
    if (video) sel = sel.eq('media_type', 'video');
    if (s) sel = sel.or(`caption.ilike.%${s}%,sym.ilike.%${s}%,handle.ilike.%${s}%,session.ilike.%${s}%`);
    const { data, error } = await sel;
    if (error) return { rows: [], error: dbError(error, 'Could not search posts.') };
    return { rows: data.map(DB.norm) };
  },
  async searchStrategies(q, limit = 24) {
    const s = DB.clean(q);
    let sel = sb.from('strategies_list').select('*').order('follower_count', { ascending: false }).limit(limit);
    if (s) sel = sel.or(`title.ilike.%${s}%,tagline.ilike.%${s}%,market.ilike.%${s}%,style.ilike.%${s}%,handle.ilike.%${s}%`);
    const { data } = await sel;
    return (data || []).map(DB.normS);
  },
  async topTraders(limit = 12) {
    const { data } = await sb.from('profiles_stats').select('*').order('follower_count', { ascending: false }).limit(limit);
    return data || [];
  },

  /* ---------- safety: reporting, blocking, account deletion ---------- */
  /* Required for the App Store (guidelines 1.2 and 5.1.1) and sensible anyway. */
  async report({ post_id = null, comment_id = null, profile_id = null, reason, detail = '' }) {
    const { error } = await sb.from('reports').insert({ reporter_id: uid(), post_id, comment_id, profile_id, reason, detail: detail.slice(0, 500) });
    if (error && error.code === '23505') return 'You have already reported this. Thanks, we are looking at it.';
    return error ? dbError(error, 'Could not send the report.') : null;
  },
  async loadBlocks() {
    state.blocked.clear();
    if (!uid()) return;
    const { data } = await sb.from('blocks').select('blocked_id').eq('blocker_id', uid());
    (data || []).forEach((b) => state.blocked.add(b.blocked_id));
  },
  async setBlock(userId, on) {
    const q = on ? sb.from('blocks').insert({ blocker_id: uid(), blocked_id: userId })
                 : sb.from('blocks').delete().eq('blocker_id', uid()).eq('blocked_id', userId);
    const { error } = await q;
    if (error && error.code !== '23505') return dbError(error, 'Could not update the block.');
    on ? state.blocked.add(userId) : state.blocked.delete(userId);
    if (on) { state.following.delete(userId); await sb.from('follows').delete().eq('follower_id', uid()).eq('following_id', userId); }
    return null;
  },
  async deleteAccount() {
    const { error } = await sb.rpc('delete_my_account');
    if (error) return dbError(error, 'Could not delete the account.');
    await sb.auth.signOut(); SESSION = null; await DB.loadMe();
    return null;
  },

  /* ---------- push notifications ---------- */
  /* A phone that allows notifications hands us a token; we keep one row per
     device so a follow or comment can be delivered to it later. */
  async savePushToken(token, platform = 'ios') {
    if (!uid() || !token) return;
    await sb.from('push_tokens').upsert({ token, user_id: uid(), platform, last_seen: new Date().toISOString() }, { onConflict: 'token' });
  },
  async dropPushToken(token) {
    if (!token) return;
    await sb.from('push_tokens').delete().eq('token', token);
  },

  /* ---------- creator clips ---------- */
  /* Public clips from trading channels, pulled by the scheduled function.
     They are shown as embedded YouTube videos credited to the channel,
     never as posts by a trader on this site. */
  async creatorClips({ shortsOnly = false, limit = 20, before } = {}) {
    let q = sb.from('clips_feed').select('*').order('published_at', { ascending: false }).limit(limit);
    if (shortsOnly) q = q.eq('is_short', true);
    if (before) q = q.lt('published_at', before);
    const { data, error } = await q;
    if (error) return { rows: [], error: dbError(error, 'Could not load creator clips.') };
    const rows = (data || []).map((r) => ({ ...r, t: Date.parse(r.published_at), creator: true,
      likes: r.like_count || 0, commentCount: r.comment_count || 0, comments: [] }));
    await DB.decorateClips(rows);
    return { rows };
  },
  /* my likes and saves, plus the last couple of comments, for a batch of clips */
  async decorateClips(rows) {
    if (!rows.length) return;
    const ids = rows.map((r) => r.id);
    const jobs = [sb.from('clip_comments_list').select('*').in('clip_id', ids).order('created_at', { ascending: true }).limit(ids.length * 8)];
    if (ME) {
      jobs.push(sb.from('clip_likes').select('clip_id').eq('user_id', uid()).in('clip_id', ids));
      jobs.push(sb.from('clip_saves').select('clip_id').eq('user_id', uid()).in('clip_id', ids));
    }
    const [c, l, s] = await Promise.all(jobs);
    const by = {}; (c.data || []).forEach((x) => (by[x.clip_id] = by[x.clip_id] || []).push(x));
    rows.forEach((r) => { r.comments = (by[r.id] || []).slice(-2); });
    (l?.data || []).forEach((x) => state.clipLiked.add(x.clip_id));
    (s?.data || []).forEach((x) => state.clipSaved.add(x.clip_id));
  },
  async clip(id) {
    const { data } = await sb.from('clips_feed').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    const row = { ...data, t: Date.parse(data.published_at), creator: true, likes: data.like_count || 0, commentCount: data.comment_count || 0, comments: [] };
    const { data: cs } = await sb.from('clip_comments_list').select('*').eq('clip_id', id).order('created_at', { ascending: true }).limit(200);
    row.comments = cs || [];
    await DB.decorateClips([]);
    return row;
  },
  async setClipLike(clipId, on) {
    const q = on ? sb.from('clip_likes').insert({ clip_id: clipId, user_id: uid() })
                 : sb.from('clip_likes').delete().eq('clip_id', clipId).eq('user_id', uid());
    const { error } = await q; return error && error.code !== '23505' ? dbError(error) : null;
  },
  async setClipSave(clipId, on) {
    const q = on ? sb.from('clip_saves').insert({ clip_id: clipId, user_id: uid() })
                 : sb.from('clip_saves').delete().eq('clip_id', clipId).eq('user_id', uid());
    const { error } = await q; return error && error.code !== '23505' ? dbError(error) : null;
  },
  async addClipComment(clipId, body) {
    const { error } = await sb.from('clip_comments').insert({ clip_id: clipId, user_id: uid(), body });
    return error ? dbError(error, 'Could not post the comment.') : null;
  },

  /* ---------- news ---------- */
  /* Headlines and video links pulled from public RSS feeds by a scheduled
     function. We store only title, link, thumbnail and a short summary, and
     always send people to the publisher to read or watch. */
  async news({ kind, source, before, limit = 24 } = {}) {
    let q = sb.from('news_items').select('*').order('published_at', { ascending: false }).limit(limit);
    if (kind) q = q.eq('kind', kind);
    if (source && source !== 'All') q = q.eq('source', source);
    if (before) q = q.lt('published_at', before);
    const { data, error } = await q;
    if (error) return { rows: [], error: dbError(error, 'Could not load the news.') };
    return { rows: data.map((r) => ({ ...r, t: Date.parse(r.published_at) })) };
  },
  async newsSources() {
    const { data } = await sb.from('news_sources').select('label, kind, enabled').eq('enabled', true);
    return data || [];
  },

  /* ---------- strategies ---------- */
  normS(r) {
    return { id: r.id, user_id: r.user_id, handle: r.handle, badge: r.badge, tone: r.tone, avatar_path: r.avatar_path, slug: r.slug, title: r.title, tagline: r.tagline, market: r.market, session: r.session,
      timeframe: r.timeframe, style: r.style, theme: r.theme, stats: r.stats || {}, steps: r.steps || [], followers: r.follower_count || 0, forks: r.fork_count || 0, fork_of: r.fork_of, created: Date.parse(r.created_at) };
  },
  async strategies({ user_id, ids, sort = 'followers', limit = 100 } = {}) {
    let q = sb.from('strategies_list').select('*').limit(limit);
    if (user_id) q = q.eq('user_id', user_id);
    if (ids) { if (!ids.length) return []; q = q.in('id', ids); }
    q = sort === 'new' ? q.order('created_at', { ascending: false }) : sort === 'forks' ? q.order('fork_count', { ascending: false }) : q.order('follower_count', { ascending: false });
    const { data } = await q; return (data || []).map(DB.normS);
  },
  async strategy(id) {
    const { data } = await sb.from('strategies_list').select('*').eq('id', id).maybeSingle();
    return data ? DB.normS(data) : null;
  },
  async saveStrategy(row, editingId) {
    const q = editingId ? sb.from('strategies').update(row).eq('id', editingId).select('id').single() : sb.from('strategies').insert({ user_id: uid(), ...row }).select('id').single();
    const { data, error } = await q;
    return error ? { error: dbError(error, 'Could not publish the strategy.') } : { id: data.id };
  },
  async setStrategyFollow(id, on) {
    const q = on ? sb.from('strategy_follows').insert({ user_id: uid(), strategy_id: id }) : sb.from('strategy_follows').delete().eq('user_id', uid()).eq('strategy_id', id);
    const { error } = await q; if (!error) on ? state.followedStrategies.add(id) : state.followedStrategies.delete(id);
    return error && error.code !== '23505' ? dbError(error) : null;
  },
};
