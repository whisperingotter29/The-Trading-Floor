# Checkpoint 2: MVP screen recording (5-6 minutes)

## Requirements
- [ ] One continuous screen recording, **5:00 to 6:00** long, MP4, 1080p or better, with your voice over it.
- [ ] Recorded on **staging** (https://the-trading-floor-git-staging-arjun-s-projects12.vercel.app), never the live site, so test posts stay out of production.
- [ ] Shows the full core loop working end to end: sign up, post a trade, see it in the feed, get a like and a comment from a second account.
- [ ] Shows what makes it more than a feed: a published strategy, discovery, privacy and safety controls.
- [ ] States the problem, who it is for, what is not built yet, and how testers give feedback (the Google Form).
- [ ] No keys, passwords, inbox contents or personal emails visible on screen.

## Before you press record
1. **Two staging accounts.** Staging is a separate database, so live accounts do not exist there.
   - Email sign-in on staging only delivers to members of your Supabase organisation until custom SMTP is set up (see the runbook). Use your own email for account A.
   - For account B, either invite a second email to the Supabase organisation, turn on custom SMTP, or enable Google sign-in on the staging project.
   - Finish both profiles first. Pick a badge colour from Coral, Cream or Navy: the other 8 do not save yet (GitHub issue).
2. **Media ready:** two chart screenshots (PNG) and one screen recording of a trade (MP4, under 50 MB).
3. **A strategy outline** of 3-4 steps you can type quickly, with one step screenshot.
4. **Browser:** account A in a normal window, account B in a private window. Hide bookmarks, close other tabs, turn on Do Not Disturb, zoom to 100%.
5. **Feedback form link** open in a tab for the last scene.
6. Do one timed dry run. Delete the dry-run posts afterwards so the feed is clean.

## Script (target 5:30)

| Time | Show | Say |
|---|---|---|
| 0:00-0:25 | Landing page: opening bell, candle scene | "Day traders share P/L screenshots with no context. The Trading Floor shows the trade *and* the strategy behind it." |
| 0:25-1:05 | Account A: Join, email code, profile setup (handle, badge, markets, picture) | Sign-in first, profile second; handles are permanent; profanity filter on names. |
| 1:05-2:00 | Post a trade: screenshot, market, timeframe, long, P/L, R:R, caption, live preview, post | Required vs optional fields; 50 MB uploads; the ticket shows how it will look. |
| 2:00-2:25 | Post a second trade with the screen recording; open Replays | Recordings become a vertical Replays feed, with credited creator clips between them. |
| 2:25-3:05 | Account B (private window): follow A, like, comment | Two real users interacting. |
| 3:05-3:30 | Back to A: The Floor (following feed), the comment, the like count | The social loop closes. |
| 3:30-4:25 | Strategy builder: 3 steps, checklist, step screenshot, live preview, publish; open the strategy page | A strategy is its own page; others follow or fork it. |
| 4:25-4:50 | Explore (Trending) and Discover; News headlines ranked by your markets | How people find traders, strategies and market news. |
| 4:50-5:15 | Settings: private account and hide P/L; on B, report a post and block (cancel the delete-account dialog) | Privacy and safety, needed for the App Store. |
| 5:15-5:30 | Feedback form link; "not built yet" list from `docs/V1_FEATURES.md` | Ask for testers; what comes next. |

## Check before you submit
- [ ] Length between 5:00 and 6:00.
- [ ] The post from A appears in the feed with its media; B's like and comment show on A's side.
- [ ] The published strategy opens and shows in Discover.
- [ ] Audio is clear all the way through; nothing private is visible on screen.

## Recording tools
- Mac: Cmd+Shift+5, then "Record Selected Portion", with Options set to your microphone. Saves a .mov; QuickTime's File, Export As 1080p gives an MP4.
- iPhone app (optional cut-in): boot the simulator, run the app, then `xcrun simctl io booted recordVideo ~/Desktop/app.mp4` and Ctrl+C to stop.
