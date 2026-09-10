# The Trading Floor

Static front-end prototype (HTML/CSS/JS, GSAP + ScrollTrigger from cdnjs). Open `index.html` or deploy the folder to Vercel as a static site.

## Routes (hash-based)
- `#/` landing: opening-bell preloader, candle Scene, strategy book, replays, badge picker
- `#/floor` feed (filters, like, double-tap like, comments, save) and `Post a trade` composer (image/video upload or chart drawn from the ticket)
- `#/replays` vertical snap feed of chart replays and uploaded videos
- `#/discover` strategy search, style and market filters, sorting
- `#/s/:id` strategy page (its own mini-site: cover, author stats, step tickets with checklists, trades using it, follow, fork)
- `#/builder` step-by-step strategy builder with live preview, publish, edit, fork
- `#/u/:handle` profile with Trades / Replays / Strategies tabs

## Editing
- Seed traders, posts, strategies: `data.js`
- Colors and fonts: `:root` tokens at the top of `styles.css`
- Scene timing: the `KF` keyframe table in `landing.js`

## Not built yet
State is in memory (resets on reload). Accounts, storage for uploads, and persistence need a backend (Supabase fits: auth, Postgres for posts/strategies, Storage for media).
