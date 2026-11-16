# The Trading Floor: User Acceptance Testing (UAT)

| | |
|---|---|
| Product | The Trading Floor, a social network for day traders (web app) |
| Version under test | Live site, `main` at 4abe4ba (deployed 2026-09-24) |
| Test environment | https://the-trading-floor-green.vercel.app (production database) |
| Owner | Arjun |
| Reviewer | PJ (review session 2026-11-16) |
| Feedback form | https://docs.google.com/forms/d/e/1FAIpQLSeJ0w3AAMrQ9xkamegBcJvvmDU-46kA9L7X72-eOEIjG69C9A/viewform |
| Status | Plan written; developer pre-check run on 2026-11-16; round 1 (5 testers) starting |
| Shareable copy | [Google Doc](https://docs.google.com/document/d/1SXpv3fphF1yJ2LhDr_1Rzt27k6O5wP5yuxq_vLkbStI/edit) (snapshot of 2026-11-16; this file is the working copy) |

## 1. Purpose
Confirm that real day traders can join The Trading Floor, post their trades, interact with other traders and publish a strategy without help, and that they find it useful enough to come back. The results decide which minor fixes go in before the MVP is finalised at Checkpoint 5.

## 2. Scope
**In scope:** the live web app on desktop and phone browsers: browsing, sign-up and profile, posting trades (images and screen recordings), the Floor feed, likes, comments, saves and shares, following, Replays, News, Explore, the strategy builder and Discover, reporting and blocking, deleting posts and accounts, and the Terms and Privacy pages.

**Out of scope:**
- The iPhone app: there is no TestFlight build yet.
- Features that exist only on staging (settings and private accounts, the following feed, Trending, the navy, cream and coral look).
- Features not built: direct messages, notifications, verified P/L.

## 3. Testers and rounds
| Round | Who | Target | When |
|---|---|---|---|
| 1 | 5 selected testers | 5 completed feedback forms | Starting 2026-11-16 |
| 2 | Round 1 plus new testers | At least 10 users' feedback (Checkpoint 5) | By mid-December 2026 |
| 3 | Wider group | 30-40 unique users, feedback analysed | End of 2026 / early 2027 |

Tester profile: people who day-trade or are learning to (futures, forex, stocks or crypto), with a mix of phone and laptop users. Round 1 should include at least two people testing on a phone.

## 4. Entry criteria (before inviting testers)
- [x] Live site up; every page loads (pre-check, section 7).
- [x] Feedback form accepting responses.
- [ ] Google sign-in works for an account outside the project team. In Google Cloud, OAuth consent screen, the publishing status must be **In production**; in "Testing", only listed test users can sign in.
- [ ] The Floor has content. Today it has 0 posts and 0 strategies. Post at least 5 real trades (including 1 screen recording) and publish 1 strategy first.
- [ ] Form responses linked to a Google Sheet (Form, Responses, Link to Sheets).
- [ ] Known issues written down, so testers are told about them (section 8).

## 5. Acceptance criteria (exit)
The MVP is accepted when, across the testers in a round:
1. At least 80% complete the core tasks UAT-02, UAT-04, UAT-06 and UAT-08 without help.
2. No open critical or high defect in the core loop: sign up, post, see it in the feed, interact.
3. Average "How easy was it to sign up" (form Q3) is at least 4 out of 5, and "How easy was it to post a trade" (Q4) is at least 4 out of 5.
4. Average "How useful would it be for your own trading" (Q5) is at least 3.5 out of 5.
5. Every bug reported is logged with a severity and a decision (fix now, fix later or won't fix).

## 6. Test scenarios
Testers get the task list in plain words. The "expected" column is what counts as a pass.

| ID | Task for the tester | Expected result |
|---|---|---|
| UAT-01 | Open the site and look around without signing in: landing page, the Floor, Replays, News | Every page loads in under 5 seconds with no error. Signing in is only asked for when you try to do something. |
| UAT-02 | Join with Google and set up your profile: handle, badge, colour, markets, optional picture | Profile is created and you land on the Floor. The handle is shown as permanent; offensive names are refused. |
| UAT-03 | Sign in with the email link or 6-digit code instead | The email arrives within a minute and signs you in. |
| UAT-04 | Post a trade from a chart screenshot: market, timeframe, session, long or short, P/L, R:R, caption | The live preview matches. The post appears at the top of the Floor and on your profile with the right P/L stamp. |
| UAT-05 | Post a screen recording of a trade (under 50 MB) | It uploads with progress, plays in the post and appears in Replays. |
| UAT-06 | On another trader's post: like (or double-tap), comment, save, share | Counts update at once. The author sees the like and the comment. The share link opens that post. |
| UAT-07 | Find a trader in Explore and follow them | The button changes to Following and both follower counts change. |
| UAT-08 | Build a strategy with at least 3 steps, a checklist and one step image, then publish it | It opens as its own page and shows in Discover. Another tester can follow or fork it. |
| UAT-09 | Search Explore for a trader's handle, a market (for example MGC) and a strategy name | Each search finds the right result; no matches gives a clear message. |
| UAT-10 | News: watch a video, switch to Headlines, filter by one source, open a headline | Videos play; the filter works; the headline opens the publisher's page. |
| UAT-11 | Replays: scroll the feed, turn the sound on, open a creator's credit | Videos play in view and pause out of view; the credit links to the creator on YouTube. |
| UAT-12 | Report a post, then block that trader, then unblock | The report is confirmed. While blocked, neither of you sees the other's posts. |
| UAT-13 | Delete one of your posts, then (optional, at the end) delete your account | The post disappears everywhere. Account deletion asks for your handle, signs you out and removes your profile. |
| UAT-14 | Repeat UAT-01, 04, 06 and 11 on a phone browser | Nothing is cut off or needs sideways scrolling; buttons are easy to tap. |
| UAT-15 | Open the Terms and Privacy pages from the footer | Both load and are readable. |

## 7. Developer pre-check (2026-11-16)
Run by Arjun's development assistant on the live site, signed out, in Chrome at desktop width (1024 px) and phone width (375 px). Signed-in tasks are run during the MVP recording dry run (two accounts) and by the testers.

| ID | Result | Notes |
|---|---|---|
| UAT-01 | Pass | The Floor, Replays, News, Explore, Discover, the builder and the profile all load. The data the pages read (`posts_feed`, `news_feed`, `clips_feed`, `strategies_list`, `profiles_stats`) all return 200. The Floor shows its empty state: 0 posts. |
| UAT-02 | Partly checked | "Post a trade" while signed out opens the sign-in sheet, which offers Continue with Google and email. Google sign-in is in use: all 5 existing accounts joined through Google. Profile setup to be run with a new account. |
| UAT-03 | Fail | See D3. The only email sign-up on the live site never confirmed. Supabase's built-in mailer only sends to members of the project team. |
| UAT-04 to UAT-08 | Not run yet | Need signed-in accounts; covered by the recording dry run. |
| UAT-09 | Pass (empty) | Search runs as you type and shows "No matches" with a hint. Needs content to test hits. |
| UAT-10 | Pass | 8 source filter chips; 24 headline links on Headlines; news refreshed today. |
| UAT-11 | Pass on desktop, fail on phone | See D1. |
| UAT-12, UAT-13 | Not run yet | Need two signed-in accounts. |
| UAT-14 | Fail (Replays only) | No sideways scrolling on the Floor, News, Explore, Discover or the builder at 375 px. Replays is cut off (D1). |
| UAT-15 | Pass | Both pages load ("Last updated 14 September 2026"). |

## 8. Defects and known issues
Severity: **critical** blocks the core loop for everyone; **high** blocks a core task for some testers; **medium** works but is wrong or confusing; **low** is cosmetic.

| ID | Severity | Where | Problem | Plan |
|---|---|---|---|---|
| D1 | Medium | Live + staging, phones | Replays: the creator clip is pushed right and cut off, and the action row (like, comment, sound) runs off the screen at phone widths. Cause: the reel's grid column (`.clip-reel`, `grid-template-columns: 1fr` in `floor.css`) grows to the 9:16 player's width (517 px on a 375 px screen). | Fix written and checked at 375 px on branch `fix/phone-replays` (9f90941); not live yet. |
| D2 | Low | Live | Signed out, the Profile page keeps the previous page's browser-tab title (for example "Strategy builder"). | Fixed on the same branch; not live yet. |
| D3 | High (for testers) | Live | Email sign-in only reaches the project team, so a tester without a Google account cannot join. | Tell testers to use Google sign-in. Before round 2, set up custom SMTP in Supabase (Auth, SMTP). |
| #3 | Medium | Live + staging | Deleting an account leaves the person's uploaded images and videos in the public media bucket, while the Privacy page promises they are deleted. | Fix before round 2. |
| #4 | Low | Live + staging | Notification and display preferences can be read through the API. | Later. |
| R1 | Readiness | Live | The Floor is empty: 0 posts, 0 strategies. | Seed content before round 1 (section 4). |

Issues #1, #2 and #5 affect only staging features and are not part of this UAT.

## 9. How feedback is collected and analysed
- **Collect:** each tester gets the site link, the task list (section 6) and the feedback form. Ask them to finish the form the same day. Note each tester in the tester tracker: name, device, invited, signed up, posted, form done.
- **Tag** every free-text answer (form Q7-Q9) as: bug, usability, feature request or praise. Bugs get a severity and a D-number here.
- **Measure:** average Q3, Q4, Q5 and Q6; NPS from Q11 (% of 9-10 minus % of 0-6); and the vote count for Q10, "what to build next".
- **Decide minor fixes:** a fix goes in before the MVP is finalised only if it (a) blocks or confuses a core task or was raised by at least 2 testers, (b) takes less than a day, and (c) does not change the database design. Everything else goes on the post-MVP list.

## 10. Results by round
| Round | Testers | Core tasks completed | Q3 sign-up | Q4 posting | Q5 usefulness | NPS | New bugs | Accepted? |
|---|---|---|---|---|---|---|---|---|
| 1 | 0 / 5 | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

## 11. Sign-off
| Role | Name | Decision | Date |
|---|---|---|---|
| Developer | Arjun | | |
| Reviewer | PJ | | |
