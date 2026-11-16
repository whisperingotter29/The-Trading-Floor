# MVP screen recording (3-5 minutes)

Due before the review with PJ on 2026-11-16. Recorded on the **live site**, https://the-trading-floor-green.vercel.app. The staging database is paused (the free Supabase plan allows two live projects), so the live site is the MVP that testers use too.

## Requirements
- [ ] One continuous screen recording, **3:00 to 5:00** long, MP4, 1080p or better, with your voice over it.
- [ ] Shows the core loop working end to end: join, post a trade, see it on the Floor, and a like and a comment from a second account.
- [ ] Shows what makes it more than a feed: a published strategy, Replays, News, and safety (report, block, delete account).
- [ ] States the problem, who it is for, and what happens next (testers and the feedback form).
- [ ] No passwords, inbox contents or full email addresses on screen. The Google account picker shows your email, so cut or blur that moment.

## Before you press record
1. **Two accounts.**
   - **A** is your own Google account, already set up on the live site.
   - **B** is a second Google account (a spare Gmail, or a friend's laptop) in a private window. B joins during the recording, to show sign-up and profile setup.
   - If B is refused at Google, the OAuth app is still in "Testing": publish it (see `docs/USER_TESTING.md`), or add B as a test user.
2. **Real content.** Everything you post stays on the live site and becomes the first thing testers see, so use real trades:
   - two chart screenshots (PNG)
   - one screen recording of a trade (MP4, under 50 MB)
   - a 3-step strategy you actually use, with one step screenshot
3. **Desktop width.** Record in a laptop-width window (at least 1024 px). Replays is cut off at phone widths until defect D1 is fixed (`docs/UAT.md`).
4. **Clean screen.** Hide bookmarks, close other tabs, turn on Do Not Disturb, browser zoom at 100%. Have the feedback form open in a tab for the last scene.
5. **One timed dry run.** It doubles as the signed-in part of the UAT pre-check: tick UAT-02 and UAT-04 to UAT-08, 12 and 13 in `docs/UAT.md` section 7. Delete duplicate dry-run posts afterwards (that is UAT-13).

## Script (target 4:00)

| Time | Show | Say |
|---|---|---|
| 0:00-0:20 | Landing page: opening bell, candle scene, "Enter the floor" | "Day traders share P/L screenshots with no context. The Trading Floor shows the trade *and* the strategy behind it." Who it is for. |
| 0:20-1:15 | **A:** Post a trade: screenshot, market, timeframe, session, long or short, P/L, R:R, caption, live preview, Post. It lands at the top of the Floor. | Required vs optional fields; uploads up to 50 MB; the ticket shows how the post will look before it goes up. |
| 1:15-1:35 | **A:** post the screen recording, then open Replays | Recordings become a vertical Replays feed, with credited creator clips between them. |
| 1:35-2:15 | **B** (private window): Continue with Google, profile setup (handle, badge, markets), find A in Explore, Follow, like and comment on A's post | A brand-new user joins and interacts in under a minute. Handles are permanent; offensive names are refused. |
| 2:15-2:30 | **A:** the like and comment on the post; profile stats (posts, winners, net P/L, followers) | The social loop closes. |
| 2:30-3:20 | **A:** Strategy builder: 3 steps, a checklist, a step image, live preview, Publish; the strategy page, then Discover | A strategy is its own page; other traders follow or fork it. |
| 3:20-3:40 | News: Video, then Headlines, filter one source | Market news without leaving the app. |
| 3:40-4:00 | **B:** the Report dialog on a post (cancel it), Block; then Delete account on the profile (cancel it). End on the feedback form. | Safety and privacy built in. "Five traders start testing this week, ten by the next checkpoint. Here is how they give feedback." |

## Check before you submit
- [ ] Length between 3:00 and 5:00.
- [ ] A's post shows on the Floor with its media; B's like and comment show on A's side.
- [ ] The strategy opens and appears in Discover.
- [ ] Audio clear throughout; no email address, password or inbox visible.

## Recording tools
- Mac: Cmd+Shift+5, then "Record Selected Portion"; set Options to your microphone. It saves a .mov; QuickTime's File, Export As, 1080p gives an MP4.
- Trim the start and end in QuickTime (Cmd+T) rather than re-recording.
