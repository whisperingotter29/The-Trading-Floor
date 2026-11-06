# The Trading Floor v1: what it does

v1 is everything on the `staging` branch as of 2026-11-06. Most of it is live; anything marked **(staging)** is built but not yet on the live site.

| | Live site | Staging |
|---|---|---|
| URL | https://the-trading-floor-green.vercel.app | https://the-trading-floor-git-staging-arjun-s-projects12.vercel.app |
| Branch | `main` (4abe4ba) | `staging` |
| Database | Supabase `grcldjuolszcidfitxgo` | Supabase `oekffltpjxnpmzbqnwvk` (separate accounts and posts) |

Stack: static HTML/CSS/JS with hash routing and GSAP; Supabase for auth, Postgres with row level security, storage, the `fetch-news` Edge Function and pg_cron; Vercel hosting; Capacitor 7 iOS wrapper (`app.thetradingfloor.ios`).

## Accounts and profile
- Sign in with Google (OAuth, PKCE) or an emailed link / 6-digit code. Sign-in first, then profile setup.
- Profile: display name, handle (3-20 chars, permanent), three-letter badge, badge colour, markets traded, bio (160 chars). Required fields marked with a red asterisk **(staging)**.
- Optional profile picture: square-cropped, shrunk to 512px WebP in the browser, replaces the badge.
- Profanity filter on handle, display name and badge (database trigger). Captions, comments and strategy text are not filtered.
- Browsing needs no account. Every write action (27 of them) goes through one sign-in gate and resumes after sign-in **(gate centralised on staging)**.
- Sign out; self-serve account deletion (type your handle to confirm).

## The Floor (`#/floor`)
- Feed of trade posts, 20 at a time with infinite scroll.
- **(staging)** A following feed: your own trades and people you follow. When that is thin it is topped up with labelled "Suggested" posts, each with a Follow button.
- Filters: For you, Following, Photos, Videos, Wins, Losses.
- Post card: badge or picture, handle, market, timeframe, session, media, ticket strip (side, risk:reward, P/L stamp), caption, recent comments, time ago.
- Like (and double-tap like), private save, comment (280 chars), share (native share or copy link), delete your own post, report someone else's.
- Side panel: "The tape" (latest trades) and rising strategies. Deep link to a post: `#/p/:id`.

## Post a trade
- Upload a screenshot (PNG/JPG/GIF/WebP) or screen recording (MP4/MOV/WebM), up to 50 MB, with drag and drop.
- Market (free text with suggestions **(staging)**), timeframe, session (Asia/London/New York), long or short, P/L in dollars, optional risk:reward, strategy used, caption (600 chars).
- Live preview of how the post will look; inline validation.
- iOS app: camera and photo library buttons.

## Replays (`#/replays`)
- Vertical snap feed of uploaded screen recordings: autoplay in view, tap for sound, pause, sound preference remembered.
- Creator clips (YouTube Shorts from trading channels) after every two user replays, credited to the channel, tagged YouTube and linked out; like, save and comment here, share links to YouTube.
- **(staging)** Creator picker: switch individual creators off, from the feed or Settings.

## News (`#/news`)
- Video tab (vertical reels; YouTube players mount only on screen) and Headlines tab (cards linking to the publisher).
- Source filter chips (Bloomberg, CNBC, WSJ, FT, Fox, NBC, CBS, MarketWatch).
- Refreshed every 15 minutes from public RSS and the YouTube Data API by the `fetch-news` function.
- **(staging)** Headlines tagged by topic; market news by default with an Everything switch; stories matching the markets on your profile rank up to 12 hours higher, and the page explains why.

## Explore (`#/explore`)
- Search traders, trades and strategies; tabs Top, Traders, Videos, Posts, Strategies; debounced live search; follow from results.
- Browse mode when the box is empty: traders to follow, recent trades grid, strategies.
- **(staging)** Trending (last 7 days, weighted by posts, replies and likes) next to Top.

## Strategies
- Discover (`#/discover`): search, market filter, style chips, sort by most followed, newest or most forked. **(staging)** Its own nav tab.
- Strategy page (`#/s/:id`): cover, author, self-reported stats flagged as unverified, numbered steps with checklists and example screenshots, trades that used it, follow, fork.
- Builder (`#/builder`): up to 12 steps (Setup, Trigger, Entry, Stop, Target, Management, Rule), reorder, delete, checklists, an image per step, 3 page looks, live preview, draft survives sign-in, edit your own, fork others, publish.

## Profiles (`#/me`, `#/u/:handle`)
- Stats (posts, winners, net P/L, followers, following, strategies); tabs Posts, Replays, Strategies; follow; edit profile.
- **(staging)** Favourites: privately bookmark traders and strategies.

## Settings (`#/settings`) **(staging)**
- Account privacy: private account with follow requests to approve; hide your P/L; who can comment (everyone, followers, nobody); show activity.
- Follow requests, notification preferences, saved posts and clips, blocked and muted accounts, display (reduce motion), about.
- Remove a follower; mute (hides someone from your feed without blocking).

## Safety and legal
- Report a post, comment or trader (8 reasons plus detail); block and unblock, applied both ways in every feed; account deletion.
- Terms and Privacy pages; "not financial advice" footer.

## Landing (`#/`)
- Opening-bell preloader, GSAP candle-chart scene, strategy book, replays demo, badge picker, page-transition shutter.

## iOS app (Capacitor)
- Status bar and splash, back gesture through app history, outside links in the system browser, Google sign-in through the system browser with a deep-link return, native share, camera and photo library, haptics.
- Push: registers the device token (`push_tokens`). Push Notifications and Background Modes (remote notifications) capabilities are on. Nothing sends pushes yet.

## Look **(staging)**
- Navy, cream and coral: navy surfaces, cream type and trade tickets, coral for buttons, the active section and likes. Green and red are kept only for profit and loss.

## Not in v1 (do not demo these)
- Direct messages, an in-app notifications screen, a moderation queue, verified P/L or broker connections, payments, or actually sending push notifications.
- Known bugs are tracked in GitHub issues.
