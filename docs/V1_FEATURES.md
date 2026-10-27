# The Trading Floor v1: functionality inventory

Source: code review of `main` (commit 4abe4ba). Stack: static HTML/CSS/JS, hash routing, GSAP, Supabase (auth, Postgres + RLS, storage, Edge Function `fetch-news`, pg_cron), Vercel hosting, Capacitor iOS wrapper (`app.thetradingfloor.ios`).

## Accounts and profile
- Sign in with Google (OAuth, PKCE) or emailed magic link / 6-digit code.
- Two-step onboarding: sign in, then profile setup (display name, handle 3-20 chars, 3-letter badge, badge colour, markets traded, bio up to 160).
- Handles are permanent; other fields editable. Profanity filter on handle, name, badge (DB trigger).
- Optional profile picture (square-cropped, 512px WebP, replaces badge); remove picture.
- Sign out; self-serve account deletion (type handle to confirm, `delete_my_account` RPC).
- Sign-in gate: any write action prompts sign-in / profile setup, then resumes the action.

## The Floor (`#/floor`)
- Feed of user trade posts, newest first, infinite scroll (20 per page).
- Filters: For you, Following, Photos, Videos, Wins, Losses.
- Post card: badge, handle, market + timeframe + session, media, ticket strip (side, risk:reward, P/L stamp), caption, recent comments, time ago.
- Like (with double-tap heart), save (private), comment (280 chars), share (native share / copy link), delete own post, report other posts.
- Side panel: "The tape" (latest trades ticker), rising strategies.
- Deep link to a post: `#/p/:id`.

## Post a trade (composer)
- Upload screenshot (PNG/JPG/GIF/WebP) or screen recording (MP4/MOV/WebM), 50 MB cap, drag and drop.
- Fields: market, timeframe (1m-1h), session (Asia/London/New York), long/short, profit/loss in dollars, optional risk:reward, strategy used, caption (600 chars).
- Live "shows on your post as" preview; validation messages.
- iOS app: camera and photo-library buttons.

## Replays (`#/replays`)
- Vertical snap feed of uploaded screen recordings, autoplay when in view, tap for sound.
- Creator clips (YouTube Shorts) interleaved after every two user replays; credited to channel, tagged YouTube, linked out; like/save/comment on this site, share link to YouTube.

## News (`#/news`)
- Video tab (vertical reels, YouTube embeds that mount only when on screen, sound toggle) and Headlines tab (cards linking to publisher).
- Source filter chips (Bloomberg, CNBC, WSJ, FT, Fox, NBC, CBS, MarketWatch ...).
- Fed every 15 min from public RSS by the `fetch-news` Edge Function.

## Explore (`#/explore`)
- Search traders, trades and strategies; tabs Top / Traders / Videos / Posts / Strategies.
- Browse mode when empty: traders to follow, recent trades grid, strategies.
- Debounced live search, follow buttons on trader cards.

## Strategies
- Discover (`#/discover`): search, market filter, style chips, sort (most followed / newest / most forked).
- Strategy page (`#/s/:id`): cover, author, author-reported stats (win rate, avg R, sample, flagged unverified), numbered steps with checklists and example screenshots, trades that used it, follow, fork.
- Builder (`#/builder`): up to 12 steps (Setup, Trigger, Entry, Stop, Target, Management, Rule), reorder, delete, checklists, image per step, 3 page themes, live preview, draft survives sign-in, edit own, fork others, publish.

## Profiles (`#/u/:handle`, `#/me`)
- Stats (posts, winners, net P/L, followers, following, strategies), tabs Posts / Replays / Strategies, follow, edit profile.

## Safety and compliance
- Report post, comment or trader (8 reasons + detail), block / unblock (applied inside read views), account deletion.
- Terms page, Privacy page, legal footer disclaimer "not financial advice".

## Landing (`#/`)
- Opening-bell preloader, candle chart scene (GSAP), strategy book, replays demo, badge picker, page-transition shutter.

## iOS wrapper (Capacitor)
- Status bar, splash, back gesture, system-browser OAuth with deep-link return, native share, camera/photos, push token capture (`push_tokens` table; no sender implemented yet).

## Not in v1 (so you do not demo them)
- No DMs, no notifications UI, no in-app admin / moderation queue, no verified P/L, no brokerage connection, no payments, no push sending.
