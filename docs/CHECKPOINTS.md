# MVP screen recording (3-5 minutes)

Due before the review with PJ on 2026-11-16. Recorded on the **live site**, https://the-trading-floor-green.vercel.app. The staging database is paused (the free Supabase plan allows two live projects), so the live site is the MVP that testers use too.

## Requirements
- [ ] One continuous screen recording, **3:00 to 5:00** long, MP4, 1080p or better, with your voice over it.
- [ ] Covers the goal, every main feature (posting, the Floor, profiles, strategies, Replays, News, Explore, safety) and how the backend works.
- [ ] No passwords, inbox contents or full email addresses on screen.

## Before you press record
1. **Signed in** to your own account on the live site.
2. **Real content.** Everything you post stays on the live site and becomes the first thing testers see, so use real trades:
   - two chart screenshots (PNG)
   - one screen recording of a trade (MP4, under 50 MB)
   - a 3-step strategy you actually use, with one step screenshot
   - `docs/architecture-page.html` open in a tab, for the backend section
3. **Desktop width.** Record in a laptop-width window (at least 1024 px). Replays is cut off at phone widths until defect D1 is fixed (`docs/UAT.md`).
4. **Clean screen.** Hide bookmarks, close other tabs, turn on Do Not Disturb, browser zoom at 100%. Have the feedback form open in a tab for the last section.
5. **One timed dry run.** It doubles as part of the signed-in UAT pre-check (UAT-04, 05, 08 and 13 in `docs/UAT.md` section 7). Delete duplicate dry-run posts afterwards.

## Script (about 4:00)

The script is in `docs/MVP_SCRIPT.md`: what the site does, its goal and how the backend works, with what to show on screen for each part. One account is enough.

## Check before you submit
- [ ] Length between 3:00 and 5:00.
- [ ] The post shows on the Floor with its media.
- [ ] The strategy opens and appears in Discover.
- [ ] Audio clear throughout; nothing private visible.

## Recording tools
- Mac: Cmd+Shift+5, then "Record Selected Portion"; set Options to your microphone. It saves a .mov; QuickTime's File, Export As, 1080p gives an MP4.
- Trim the start and end in QuickTime (Cmd+T) rather than re-recording.
