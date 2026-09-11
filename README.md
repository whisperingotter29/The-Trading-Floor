# The Trading Floor

Static front-end prototype (HTML/CSS/JS, GSAP + ScrollTrigger from cdnjs). The platform starts empty: no accounts, posts or strategies until visitors sign up and post. Open `index.html` or deploy the folder to Vercel as a static site.

## Routes (hash-based)
- `#/` landing: opening-bell preloader, candle Scene, strategy book, replays, badge picker
- `#/floor` feed (filters, like, double-tap like, comments, save) and `Post a trade` composer (image or video upload, profit/loss in dollars, optional risk:reward)
- `#/replays` vertical snap feed of uploaded screen recordings (MP4, MOV, WebM)
- `#/discover` strategy search, style and market filters, sorting
- `#/s/:id` strategy page (its own mini-site: cover, author stats, step tickets with checklists, trades using it, follow, fork)
- `#/builder` step-by-step strategy builder with live preview, publish, edit, fork
- `#/me` your profile (or a create-account prompt), `#/u/:handle` other profiles with Posts / Replays / Strategies tabs

Accounts are created in the sign-up sheet (name, handle, three-letter badge). Posting, liking, commenting, following and publishing ask for an account first.

## Editing
- App state (starts empty): `data.js`
- Colors and fonts: `:root` tokens at the top of `styles.css`; empty states and sign-up in `floor.css`
- Scene timing: the `KF` keyframe table in `landing.js`

## Not built yet
State is in memory (resets on reload). Accounts, storage for uploads, and persistence need a backend (Supabase fits: auth, Postgres for posts/strategies, Storage for media).
