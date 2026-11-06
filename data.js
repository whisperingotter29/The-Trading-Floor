/* ============ BACKEND (Supabase) ============ */
/* The publishable key is meant to be public. What anyone can read or write is
   decided by the row level security rules in the database, not by this key. */
/* Staging is a separate project with its own accounts and posts, so nothing tried
   there reaches the live site. The live domain is pinned to production no matter
   what env.js says. */
const BACKENDS = {
  production: { url: 'https://grcldjuolszcidfitxgo.supabase.co', key: 'sb_publishable_cfJe5103VSlxakj3FvsJzg_mAH7uQIH' },
  staging: { url: 'https://oekffltpjxnpmzbqnwvk.supabase.co', key: 'sb_publishable_ASwy-kcy1iB3-JavmSas7g_6IjCCiEa' },
};
const PRODUCTION_HOSTS = ['the-trading-floor-green.vercel.app'];
const TF_ENV = PRODUCTION_HOSTS.includes(location.hostname) ? 'production' : (window.TF_ENV === 'production' ? 'production' : 'staging');
const SUPABASE_URL = BACKENDS[TF_ENV].url;
const SUPABASE_KEY = BACKENDS[TF_ENV].key;
const MEDIA_BUCKET = 'media';
const MAX_UPLOAD = 50 * 1024 * 1024; // matches the storage bucket limit

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

let SESSION = null; // Supabase auth session (signed in or not)
let ME = null;      // the signed-in person's profile row, null until they set one up

/* `following` holds accepted follows only. A follow of a private account sits in
   `requested` until they approve it, so the button can say "Requested" rather
   than claiming you are following someone who has not let you in. */
const state = { liked: new Set(), saved: new Set(), clipLiked: new Set(), clipSaved: new Set(), following: new Set(), requested: new Set(), followedStrategies: new Set(), blocked: new Set(), muted: new Set(), favProfiles: new Set(), favStrategies: new Set(), hiddenCreators: new Set(), draft: null };

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
    ME = null; state.liked.clear(); state.saved.clear(); state.clipLiked.clear(); state.clipSaved.clear(); state.following.clear(); state.requested.clear(); state.followedStrategies.clear(); state.blocked.clear(); state.muted.clear(); state.favProfiles.clear(); state.favStrategies.clear(); state.hiddenCreators.clear();
    if (!uid()) return;
    const { data } = await sb.from('profiles_stats').select('*').eq('id', uid()).maybeSingle();
    ME = data || null;
    if (ME) {
      /* profiles_stats leaves reduce_motion out, since it is nobody else's
         business, so it is read from my own row and carried on ME. */
      const { data: mine } = await sb.from('profiles').select('reduce_motion, notify_likes, notify_comments, notify_follows, notify_news').eq('id', uid()).maybeSingle();
      if (mine) Object.assign(ME, mine);
      const [f, sf] = await Promise.all([
        sb.from('follows').select('following_id, status').eq('follower_id', uid()),
        sb.from('strategy_follows').select('strategy_id').eq('user_id', uid()),
      ]);
      (f.data || []).forEach((r) => (r.status === 'pending' ? state.requested : state.following).add(r.following_id));
      (sf.data || []).forEach((r) => state.followedStrategies.add(r.strategy_id));
      await Promise.all([DB.loadBlocks(), DB.loadMutes(), DB.loadFavorites(), DB.loadHiddenCreators()]);
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
      sym: r.sym, tf: r.tf, session: r.session,
      /* pnl comes back null when the trader keeps it private, and null is not
         zero: it must stay null so nothing prints "$0" for a hidden result. */
      tk: { side: r.side, pnl: r.pnl == null ? null : Number(r.pnl), rr: r.rr == null ? null : Number(r.rr) },
      allow_comments: r.allow_comments !== false, show_activity: r.show_activity !== false, is_private: !!r.is_private,
      caption: r.caption, strategy_id: r.strategy_id, likes: r.like_count || 0, commentCount: r.comment_count || 0, comments: [], t: Date.parse(r.created_at), created_at: r.created_at };
  },
  /* `activity` is for the places that put a trade in front of people who did not
     ask for it, the tape and Explore, which is what "show my activity" governs. */
  async posts({ filter = 'all', user_id, strategy_id, video, before, activity = false, limit = 20 } = {}) {
    let q = sb.from('posts_feed').select('*').order('created_at', { ascending: false }).limit(limit);
    if (activity) q = q.eq('show_activity', true);
    if (user_id) q = q.eq('user_id', user_id);
    if (strategy_id) q = q.eq('strategy_id', strategy_id);
    if (video || filter === 'videos') q = q.eq('media_type', 'video');
    if (filter === 'photos') q = q.eq('media_type', 'image');
    if (filter === 'wins') q = q.gt('pnl', 0);
    if (filter === 'losses') q = q.lt('pnl', 0);
    /* The Floor is a following feed: your own posts and the people you follow.
       Nothing else belongs in it. */
    if (filter === 'following') { const ids = [...state.following]; if (uid()) ids.push(uid()); if (!ids.length) return { rows: [] }; q = q.in('user_id', ids); }
    /* Suggested fills a thin feed with real posts from traders you do NOT
       follow. It is always labelled as suggested, never mixed in silently. */
    if (filter === 'suggested') {
      const skip = [...state.following, ...state.muted]; if (uid()) skip.push(uid());
      if (skip.length) q = q.not('user_id', 'in', `(${skip.join(',')})`);
      q = q.eq('show_activity', true);
    }
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q;
    if (error) return { rows: [], error: dbError(error, 'Could not load posts.') };
    /* A mute clears your feed but does not blank the person's own page, so it is
       applied to the feed rather than to the view. Asking for one person's posts
       on purpose (their profile, a strategy) is exempt. */
    const hideMuted = !user_id && state.muted.size > 0;
    const rows = (hideMuted ? data.filter((r) => !state.muted.has(r.user_id)) : data).map(DB.norm);
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
  /* Whether this becomes a follow or a request is the database's call, not ours:
     a trigger sets the status from the other person's privacy setting. So we ask
     for the row back and believe what it says. Returns 'pending' when it went in
     as a request, so the caller can label the button honestly. */
  async setFollow(userId, on) {
    if (!on) {
      const { error } = await sb.from('follows').delete().eq('follower_id', uid()).eq('following_id', userId);
      if (error) return { error: dbError(error) };
      state.following.delete(userId); state.requested.delete(userId);
      return { status: null };
    }
    const { data, error } = await sb.from('follows')
      .insert({ follower_id: uid(), following_id: userId }).select('status').maybeSingle();
    if (error && error.code !== '23505') return { error: dbError(error) };
    const status = data?.status
      || (await sb.from('follows').select('status').eq('follower_id', uid()).eq('following_id', userId).maybeSingle()).data?.status
      || 'accepted';
    if (status === 'pending') { state.requested.add(userId); state.following.delete(userId); }
    else { state.following.add(userId); state.requested.delete(userId); }
    return { status };
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
    let sel = sb.from('posts_feed').select('*').eq('show_activity', true).order('created_at', { ascending: false }).limit(limit);
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
  /* Trending is about the last week, not all time: who has been posting and
     getting a reaction lately. Top is the all-time follower count, so a quiet
     veteran stays near the top there while a newcomer can trend. */
  async trendingTraders(limit = 12) {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data } = await sb.from('posts_feed').select('user_id, like_count, comment_count')
      .gte('created_at', since).eq('show_activity', true).limit(600);
    const by = new Map();
    (data || []).forEach((p) => {
      const s = by.get(p.user_id) || { id: p.user_id, posts: 0, score: 0 };
      s.posts++; s.score += 1 + (p.like_count || 0) + 2 * (p.comment_count || 0);
      by.set(p.user_id, s);
    });
    const ranked = [...by.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    if (!ranked.length) return [];
    const { data: people } = await sb.from('profiles_stats').select('*').in('id', ranked.map((r) => r.id));
    const pm = new Map((people || []).map((p) => [p.id, p]));
    return ranked.map((r) => ({ ...pm.get(r.id), weekPosts: r.posts, weekScore: r.score })).filter((p) => p.id);
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
    /* blocking cuts the tie both ways, including a request still waiting */
    if (on) {
      state.following.delete(userId); state.requested.delete(userId);
      await sb.from('follows').delete().eq('follower_id', uid()).eq('following_id', userId);
      await sb.from('follows').delete().eq('follower_id', userId).eq('following_id', uid());
    }
    return null;
  },
  async deleteAccount() {
    const { error } = await sb.rpc('delete_my_account');
    if (error) return dbError(error, 'Could not delete the account.');
    await sb.auth.signOut(); SESSION = null; await DB.loadMe();
    return null;
  },

  /* ---------- settings ---------- */
  /* Every one of these is enforced in the database too, not just here: a
     private account is gated by can_view() and the follows policies, comment
     permissions by the comments policy. Turning a switch off in this screen is
     not the only thing standing between a stranger and the content. */

  /* profiles_stats deliberately leaves the notification and motion columns out,
     since they are nobody else's business, so my own settings come from the
     profiles row itself. */
  async mySettings() {
    if (!uid()) return null;
    const { data } = await sb.from('profiles').select('*').eq('id', uid()).maybeSingle();
    return data || null;
  },
  async setSetting(patch) { return DB.updateProfile(patch); },

  /* Going private does not retroactively withdraw anything: people who already
     follow you stay accepted. Only new follows have to be approved. */
  async followRequests() {
    if (!uid()) return [];
    const { data } = await sb.from('follow_requests').select('*')
      .eq('following_id', uid()).order('created_at', { ascending: false });
    return data || [];
  },
  async answerRequest(followerId, accept) {
    const q = accept
      ? sb.from('follows').update({ status: 'accepted' }).eq('following_id', uid()).eq('follower_id', followerId)
      : sb.from('follows').delete().eq('following_id', uid()).eq('follower_id', followerId);
    const { error } = await q;
    return error ? dbError(error, 'Could not answer that request.') : null;
  },

  /* Muting hides someone's posts from your feed without them being told, which
     is what makes it different from blocking. */
  async loadMutes() {
    state.muted.clear();
    if (!uid()) return;
    const { data } = await sb.from('mutes').select('muted_id').eq('muter_id', uid());
    (data || []).forEach((m) => state.muted.add(m.muted_id));
  },
  async setMute(userId, on) {
    const q = on ? sb.from('mutes').insert({ muter_id: uid(), muted_id: userId })
                 : sb.from('mutes').delete().eq('muter_id', uid()).eq('muted_id', userId);
    const { error } = await q;
    if (error && error.code !== '23505') return dbError(error, 'Could not update that.');
    on ? state.muted.add(userId) : state.muted.delete(userId);
    return null;
  },
  /* for the blocked and muted lists, which hold ids and need the people */
  async profilesByIds(ids) {
    if (!ids.length) return [];
    const { data } = await sb.from('profiles_stats').select('*').in('id', ids);
    return data || [];
  },

  async savedPosts({ limit = 60 } = {}) {
    if (!uid()) return { rows: [] };
    const { data: s } = await sb.from('saves').select('post_id, created_at').eq('user_id', uid())
      .order('created_at', { ascending: false }).limit(limit);
    const ids = (s || []).map((r) => r.post_id);
    if (!ids.length) return { rows: [] };
    const { data, error } = await sb.from('posts_feed').select('*').in('id', ids);
    if (error) return { rows: [], error: dbError(error, 'Could not load your saved posts.') };
    /* posts_feed is filtered by can_view, so a save can outlive the access:
       keep the order the saves were made in and drop anything gone. */
    const by = new Map((data || []).map((r) => [r.id, r]));
    const rows = ids.map((id) => by.get(id)).filter(Boolean).map(DB.norm);
    await DB.decorate(rows);
    return { rows };
  },
  async savedClips({ limit = 60 } = {}) {
    if (!uid()) return { rows: [] };
    const { data: s } = await sb.from('clip_saves').select('clip_id, created_at').eq('user_id', uid())
      .order('created_at', { ascending: false }).limit(limit);
    const ids = (s || []).map((r) => r.clip_id);
    if (!ids.length) return { rows: [] };
    const { data, error } = await sb.from('clips_feed').select('*').in('id', ids);
    if (error) return { rows: [], error: dbError(error, 'Could not load your saved clips.') };
    const by = new Map((data || []).map((r) => [r.id, r]));
    const rows = ids.map((id) => by.get(id)).filter(Boolean).map((r) => ({
      ...r, t: Date.parse(r.published_at), creator: true,
      likes: r.like_count || 0, commentCount: r.comment_count || 0, comments: [],
    }));
    await DB.decorateClips(rows);
    return { rows };
  },

  /* ---------- favourites ---------- */
  /* Traders and strategies you want kept to hand. Private to you: nobody is
     told they were favourited, which is what separates it from following. */
  async loadFavorites() {
    state.favProfiles.clear(); state.favStrategies.clear();
    if (!uid()) return;
    const { data } = await sb.from('favorites').select('kind, target_id').eq('user_id', uid());
    (data || []).forEach((f) => (f.kind === 'profile' ? state.favProfiles : state.favStrategies).add(f.target_id));
  },
  async setFavorite(kind, targetId, on) {
    const set = kind === 'profile' ? state.favProfiles : state.favStrategies;
    const q = on ? sb.from('favorites').insert({ user_id: uid(), kind, target_id: targetId })
                 : sb.from('favorites').delete().eq('user_id', uid()).eq('kind', kind).eq('target_id', targetId);
    const { error } = await q;
    if (error && error.code !== '23505') return dbError(error, 'Could not update your favourites.');
    on ? set.add(targetId) : set.delete(targetId);
    return null;
  },
  async favoriteProfiles() {
    const ids = [...state.favProfiles]; if (!ids.length) return [];
    const { data } = await sb.from('profiles_stats').select('*').in('id', ids);
    return data || [];
  },
  async favoriteStrategies() {
    const ids = [...state.favStrategies]; if (!ids.length) return [];
    return DB.strategies({ ids });
  },

  /* ---------- which creators show up in Replays ---------- */
  /* Only the ones switched OFF are stored, so a creator added later appears for
     everyone instead of staying invisible until each person opts in. */
  async loadHiddenCreators() {
    state.hiddenCreators.clear();
    if (!uid()) return;
    const { data } = await sb.from('creator_hidden').select('source').eq('user_id', uid());
    (data || []).forEach((r) => state.hiddenCreators.add(r.source));
  },
  async setCreatorHidden(source, hidden) {
    const q = hidden ? sb.from('creator_hidden').insert({ user_id: uid(), source })
                     : sb.from('creator_hidden').delete().eq('user_id', uid()).eq('source', source);
    const { error } = await q;
    if (error && error.code !== '23505') return dbError(error, 'Could not save that.');
    hidden ? state.hiddenCreators.add(source) : state.hiddenCreators.delete(source);
    return null;
  },
  /* Creators that actually have clips stored, newest first. A source can be
     configured and still have pulled nothing, and a dead entry in the picker
     would just be a switch that does nothing. */
  async creatorSources() {
    const { data } = await sb.from('clips_feed').select('source, published_at').eq('is_short', true).limit(1000);
    const by = new Map();
    (data || []).forEach((r) => {
      const c = by.get(r.source) || { source: r.source, count: 0, newest: r.published_at };
      c.count++; if (r.published_at > c.newest) c.newest = r.published_at;
      by.set(r.source, c);
    });
    return [...by.values()].sort((a, b) => b.count - a.count);
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
  async creatorClips({ shortsOnly = false, limit = 20, before, all = false } = {}) {
    let q = sb.from('clips_feed').select('*').order('published_at', { ascending: false }).limit(limit);
    if (shortsOnly) q = q.eq('is_short', true);
    /* creators this person has switched off in Replays */
    if (!all && state.hiddenCreators.size) q = q.not('source', 'in', `(${[...state.hiddenCreators].map((s) => `"${s.replace(/"/g, '')}"`).join(',')})`);
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
  /* Headlines come from news_feed, which ranks them for whoever is reading:
     a story on a topic you trade gets a twelve-hour head start over one that
     does not, and after that recency wins again. `market` keeps out the sport,
     crime and advice columns these wires also carry, which is most of what
     they publish. Paging is keyset on rank_at so it cannot repeat or skip. */
  async news({ kind, source, before, market = true, limit = 24 } = {}) {
    let q = sb.from('news_feed').select('*').order('rank_at', { ascending: false }).limit(limit);
    if (kind) q = q.eq('kind', kind);
    if (market) q = q.eq('is_market', true);
    if (source && source !== 'All') q = q.eq('source', source);
    if (before) q = q.lt('rank_at', before);
    const { data, error } = await q;
    if (error) return { rows: [], error: dbError(error, 'Could not load the news.') };
    return { rows: data.map((r) => ({ ...r, t: Date.parse(r.published_at), cursor: r.rank_at })) };
  },
  /* the topics this person's markets map to, for explaining the ranking */
  async myNewsTopics() {
    const { data } = await sb.rpc('my_news_topics');
    return data || [];
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
