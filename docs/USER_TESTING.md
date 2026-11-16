# User testing plan: 5, then 10, then 30-40 testers

Testers use the **live site**, https://the-trading-floor-green.vercel.app, and give feedback through the [feedback form](https://docs.google.com/forms/d/e/1FAIpQLSeJ0w3AAMrQ9xkamegBcJvvmDU-46kA9L7X72-eOEIjG69C9A/viewform). What counts as a pass, and the defects found so far, are in `docs/UAT.md`.

| Round | Goal | Due |
|---|---|---|
| 1 | 5 selected testers, 5 forms | Start now (2026-11-16) |
| 2 | Feedback from at least 10 users | Checkpoint 5, mid-December 2026 |
| 3 | 30-40 unique users, feedback analysed | End of 2026 / early 2027 |

## Once, before the first invite
1. **Google sign-in for outsiders.** Open Google Cloud Console, then Google Auth Platform, then Audience, and check the publishing status:
   - If it says "Testing", click **Publish app**. The app only asks for name, email and picture, so Google does not need to review it.
   - Or keep "Testing" and add each tester's Gmail under Test users (up to 100).
2. **Test it with someone outside the team.** Ask one friend to sign in with Google on the live site before you invite all five.
3. **Seed the Floor.** The posts and strategy from the MVP recording do this. Aim for at least 5 real trades and 1 strategy.
4. **Link responses to a sheet.** In the form's edit view, open Responses and click **Link to Sheets**.
5. Fill the [tester tracker](https://docs.google.com/spreadsheets/d/1X_lD9bCQk2W8Z4qL1hFcDQfwZE-5VIyFrS6YaNsLq80/edit) (Google Sheet, private to you) as you go.

## Round 1: five testers
**Who:** people who day-trade or are learning to, ideally:
- 2 or more on a phone
- 1 or more who has never seen the app
- 1 who trades futures and 1 who trades something else (forex, stocks or crypto)
- no more than 2 close friends, since they are too kind

**Invite** (send it yourself; edit to taste):

> Hey [name], I'm building The Trading Floor, a social network where day traders post the trades they took (screenshot or screen recording, P/L, R:R) and the strategy behind them. Would you test it for about 15 minutes this week?
>
> 1. Go to https://the-trading-floor-green.vercel.app and sign in with **Google** (email sign-in isn't switched on for everyone yet).
> 2. Set up your profile, then post one real trade (a chart screenshot is enough).
> 3. Like or comment on someone's trade, follow a trader, and look at Replays and News.
> 4. Optional: write a strategy in the Strategy builder.
> 5. Fill in this form (3 minutes): https://docs.google.com/forms/d/e/1FAIpQLSeJ0w3AAMrQ9xkamegBcJvvmDU-46kA9L7X72-eOEIjG69C9A/viewform
>
> Everything you post is public on the site. Anything that breaks or confuses you is exactly what I need to hear. Thanks!

**Follow-up after 2 days** if they haven't filled in the form:

> Quick nudge on The Trading Floor test: even 5 minutes and the form helps a lot. Anything confusing so far?

**Watch one in person (or on a call).** Ask one tester to share their screen and think aloud while doing the tasks. Don't help; just note where they hesitate. This finds more usability problems than any form.

## Round 2: at least 10 users (Checkpoint 5)
- Before inviting: ship the D1 and D2 fix (ready on branch `fix/phone-replays`) and fix issue #3 (account deletion leaves files). Set up custom email so people without Google can join:
  - Supabase dashboard (project The-Trading-Floor), Authentication, Emails, SMTP Settings
  - Host `smtp.gmail.com`, port `465`, username your Gmail address
  - Password: a Google **app password** (Google Account, Security, 2-Step Verification, App passwords). Type it into Supabase yourself; it never goes in a note or the repo.
- Sources: round 1 testers each bring 1-2 trader friends; a school or uni trading or investing club; one trading Discord you already belong to (read its self-promotion rules first).
- Count only people who signed in **and** sent the form.

## Round 3: 30-40 unique users
- Same invite, posted to 2-3 communities, plus everyone from rounds 1 and 2 sharing it once.
- Keep counting unique people (a name or email in the tracker), not form submissions.
- Analyse every 10 responses (below), not only at the end.

## Tester tracker columns
Name · How you know them · Device · Round · Invited (date) · Signed up (Y/N) · Posted a trade (Y/N) · Form done (Y/N) · Watched live (Y/N) · Notes

Signed up and posted can be checked on the site itself: their profile shows their posts.

## Analysing feedback (every 10 responses)
1. From the linked sheet, average Q3 (sign-up ease), Q4 (posting ease), Q5 (usefulness) and Q6 (look).
2. NPS from Q11: % who gave 9-10, minus % who gave 0-6.
3. Copy every answer to Q7-Q9 into a "Feedback log" tab. Tag each: bug, usability, feature request or praise. Give bugs a severity and a D-number in `docs/UAT.md`.
4. Count tags. A theme raised by 3 or more people is a finding.
5. Count Q10 votes (what to build next).
6. Write a 5-line summary for the round in `docs/UAT.md` section 10.

## Which fixes go in before the MVP is final
Only "valuable minor" fixes, all three of:
- they block or confuse a core task, or at least 2 testers raised them
- they take less than a day
- they don't change the database design

Everything else goes on the post-MVP list. Ship fixes to the live site in small batches, not during a tester's session.
