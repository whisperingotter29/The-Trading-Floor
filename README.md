# The Trading Floor

Static front end (HTML/CSS/JS, GSAP from cdnjs) backed by Supabase for accounts, database and media storage. Deploy the folder to Vercel as a static site; there is no build step.

## Backend
- Supabase project `The-Trading-Floor` (`grcldjuolszcidfitxgo`). URL and publishable key are in `data.js` — the publishable key is meant to be public, access is controlled by row level security.
- Tables: `profiles`, `posts`, `comments`, `likes`, `saves`, `follows`, `strategies`, `strategy_follows`. Read views: `posts_feed`, `comments_list`, `strategies_list`, `profiles_stats`.
- Every table has RLS: anyone can read public content, you can only write rows that belong to you, and `saves` are private to you.
- Uploads go to the public `media` bucket under `<user-id>/posts/` or `<user-id>/steps/`. 50 MB cap, images plus MP4/MOV/WebM.
- News: `news_items` + `news_sources` tables, filled by the `fetch-news` Edge Function on a 15-minute pg_cron schedule. Sources are public RSS feeds (YouTube per-channel feeds plus publisher feeds); no API keys. Only headline, link, thumbnail and a short summary are stored, and everything links back to the publisher.
- Profanity filter on profile handles, display names and badges only (DB trigger + `banned_terms`/`allowed_terms`). Captions, comments and strategy text are deliberately unfiltered.
- Auth: Google OAuth and emailed sign-in link/6-digit code. Sign-in is step one; the handle and badge profile is step two.

## Routes (hash-based)
- `#/` landing: opening-bell preloader, candle Scene, strategy book, replays, badge picker
- `#/floor` feed (filters, like, double-tap like, comments, save) and `Post a trade` composer (image or video upload, profit/loss in dollars, optional risk:reward)
- `#/replays` vertical snap feed of uploaded screen recordings (MP4, MOV, WebM)
- `#/news` market video and headlines pulled from public RSS feeds (see Backend)
- `#/discover` strategy search, style and market filters, sorting
- `#/s/:id` strategy page (its own mini-site: cover, author stats, step tickets with checklists, trades using it, follow, fork)
- `#/builder` step-by-step strategy builder with live preview, publish, edit, fork
- `#/me` your profile (or a create-account prompt), `#/u/:handle` other profiles with Posts / Replays / Strategies tabs

Accounts are created in the sign-up sheet (name, handle, three-letter badge). Posting, liking, commenting, following and publishing ask for an account first.

## Editing
- Backend calls and keys: `data.js`
- Colors and fonts: `:root` tokens at the top of `styles.css`; empty states and sign-up in `floor.css`
- Scene timing: the `KF` keyframe table in `landing.js`

## Before a public launch
- Enable the Google provider in Supabase Auth and add the site URL + redirect URLs.
- Add custom SMTP (Resend/SendGrid) — the built-in email sender is rate limited and testing-only.
- Turn off Vercel deployment protection so the site is publicly reachable.
- Add terms, privacy policy, reporting and account deletion.
