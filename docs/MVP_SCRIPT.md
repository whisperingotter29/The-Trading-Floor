# MVP recording script (about 4:00)

Record on the live site at laptop width. One account is enough. Each section gives what is on screen, then what you say.

## 1. What it is (0:00-0:20)
**Screen:** landing page.

The Trading Floor is a social network for day traders. Traders post the trades they took, with the chart, the result and the strategy behind it. The goal is to replace bare P/L screenshots with context: what the trade was, why it was taken, and the plan it came from.

## 2. Posting a trade (0:20-1:00)
**Screen:** Post a trade. Upload a screenshot, fill in the ticket, post it.

To post a trade, you upload a chart screenshot or a screen recording, up to 50 MB. Then you fill in the ticket: market, timeframe, session, long or short, profit or loss, and an optional risk-to-reward. The caption explains the trade, and a live preview shows the post before it goes up. Posts go to the Floor, the main feed.

## 3. The Floor and profiles (1:00-1:25)
**Screen:** the Floor (like, comment, filter), then Profile.

On the Floor you can like, comment on, save and share posts, and follow traders. Filters show only photos, videos, wins or losses. Each profile shows the trader's posts, number of winners, net P/L, followers and strategies.

## 4. Strategies (1:25-2:05)
**Screen:** Strategy builder. Add steps, publish, open the strategy page, then Discover.

Strategies are the core of the site. The builder writes a strategy step by step (setup, trigger, entry, stop, target, management), with a checklist and an example chart for each step. When it's published it becomes its own page, which other traders can follow or fork into their own version, and every trade tagged with it is listed there. Discover lists all strategies, searchable and sorted by most followed, most forked or newest.

## 5. Replays, News and Explore (2:05-2:35)
**Screen:** Replays, News (Video, then Headlines), Explore search.

Screen recordings go into Replays, a vertical video feed, mixed with credited Shorts from trading creators on YouTube. News has market video and headlines from Bloomberg, CNBC, the Wall Street Journal and others, filterable by source. Explore searches traders, posts and strategies.

## 6. Safety (2:35-2:45)
**Screen:** report flag on a post, Block on a profile, Delete account.

Any post or trader can be reported or blocked, and users can delete their own account.

## 7. How the backend works (2:45-3:45)
**Screen:** `docs/architecture-page.html` (open the file in a browser) or the Supabase dashboard's Table Editor.

The front end is plain HTML, CSS and JavaScript, with no framework. It's hosted on Vercel: a push to the main branch on GitHub rebuilds and deploys the site. The same files are wrapped into an iPhone app with Capacitor.

The backend is Supabase. Supabase Auth handles sign-in with Google or email and gives each user a token that goes with every request. The data is in a Postgres database of 21 tables, every one with row-level security, so the database itself decides who can read or change each row, not the web page. The app reads through views that join posts with their authors, likes and comment counts, and filter out blocked users. Database triggers enforce rules like the profanity filter on handles. Images and videos are stored in Supabase Storage.

The only server-side code is an Edge Function called fetch-news. A cron job in the database runs it every 15 minutes. It pulls publisher RSS feeds and the YouTube Data API and saves the results, which feed the News page and the creator clips. The YouTube API key stays on the server and never reaches the browser.

## 8. Next steps (3:45-4:00)
**Screen:** the feedback form.

Next is user testing: five traders now, at least ten by Checkpoint 5, and 30 to 40 after that, all giving feedback through this form. Private accounts, privacy settings and a new design are already built and in testing.
