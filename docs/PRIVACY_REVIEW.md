# Privacy policy review

Reviewed 2026-11-06 against `privacy.html` (last updated 14 September 2026), the `staging` code and the production database schema.

**Verdict:** the policy was accurate for the September site but is now out of date in five places, silent on the iPhone app and on third parties the pages load, and promises two things the system does not yet do. Fix the four database issues first, then update the policy, then merge `staging` to `main`. The private-account features are not live yet, and production has 0 posts and 0 private accounts, so nothing has leaked.

## 1. Where the policy is now wrong
| Policy says | Reality | Fix |
|---|---|---|
| "Delete your account. Email us and we will delete your account, your posts, your uploads and your strategies." | Deletion is self-serve in the app (Settings), and it does **not** delete uploaded files: they stay in the public media bucket. | Delete the files as part of account deletion (issue), then reword the policy to describe the in-app button. |
| "Assume anything you post is public." | **(staging)** Private accounts, hidden P/L and comment permissions exist. | Explain private accounts and what stays visible: profile name, handle, badge and bio stay public. |
| "The posts you save are private to you." | True. Favourites, mutes, blocks, hidden creators and reports are private too but not mentioned. | List them. |
| What we collect: account, profile, posts, activity, logs | Also stored: reports you file, blocks and mutes, favourites, settings (privacy, notifications, reduce motion), hidden creators, and in the iOS app a push notification device token. | Add to "What we collect". |
| "Last updated 14 September 2026" | Several features since. | Update the date when the new text ships. |

## 2. What the policy does not mention
- **iPhone app:** camera and photo library access (only when you choose to attach a picture, nothing uploaded until you post), the push token stored in `push_tokens`, and haptics (no data).
- **Third parties the pages load:**
  - Google Fonts (`fonts.googleapis.com`), plus cdnjs (Cloudflare) and jsDelivr for scripts. Each sees the visitor's IP address.
  - YouTube players for creator clips and news videos. They load only when on screen or tapped, but YouTube can then set cookies.
  - News thumbnails are loaded straight from publishers' servers.
- **Email delivery:** sign-in emails are sent by Supabase's mailer now, and by Resend or SendGrid once custom SMTP is added.
- **Browser storage:** the sign-in session and the sound preference are kept in local storage. There are no tracking or advertising cookies; say so.
- **Moderation:** handles, names and badges are checked automatically against a word list; reports are reviewed by the owner.
- **Testing:** staging is a separate Supabase project holding test accounts. If outside testers sign up there, the policy should cover it.
- **Feedback form:** Google Forms (Google) receives answers; the email is optional.
- **Retention** of reports and blocks after an account is deleted. Today they cascade away with the profile; say so.

## 3. Technical issues that undermine the policy (filed as GitHub issues)
| Severity | Issue | Effect |
|---|---|---|
| High | Hidden P/L is only hidden in the `posts_feed` view; the `posts` table still returns `pnl` to anyone allowed to see the post. | "Hide my P/L" does not hide it from someone using the API directly. |
| High | Comments, likes and follows have no privacy check (their read policies are `true`). | Comments and likes on a private account's posts, and private accounts' follower lists, are readable by anyone. |
| Medium | Account deletion leaves the person's images, videos and avatar in the public `media` bucket. | Breaks the policy's promise and Apple guideline 5.1.1(v). |
| Low | The `profiles` table is readable in full, including notification preferences and reduce-motion. | Small but avoidable exposure; the code comments say these are private. |

## 4. App Store privacy label (draft for App Store Connect)
| Data type | Collected | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| Email address | Yes | Yes | No | App functionality (sign-in) |
| Name (display name) | Yes | Yes | No | App functionality |
| Photos or videos (posts, avatar) | Yes | Yes | No | App functionality |
| Other user content (captions, comments, strategies, P/L figures) | Yes | Yes | No | App functionality |
| User ID | Yes | Yes | No | App functionality |
| Device ID (push token) | Yes | Yes | No | App functionality |
| Product interaction (likes, follows, saves) | Yes | Yes | No | App functionality |
| Crash data, diagnostics, location, contacts, financial info, purchases | No | | | |

The privacy policy URL for App Store Connect is the live `/privacy` page, so it must be updated before submission.

## 5. Suggested wording
**Your choices, Delete your account:** "Go to Settings, then Delete account. This permanently removes your profile, posts, uploaded files, comments, likes, follows, strategies and settings, and signs you out. You can also email us and we will do it for you."

**What other people can see:** "Your profile name, handle, badge, picture and bio are public. If your account is public, so are your posts, the media in them, your comments and your strategies. If you make your account private, only people you approve can see your posts and strategies, and only they can see comments on them. You can hide your profit and loss figures from everyone except yourself. Your email address, saved posts, favourites, blocks, mutes and settings are never shown to anyone."

**iPhone app:** "If you use the iPhone app, it asks for camera or photo library access only when you choose to attach an image, and nothing is uploaded until you post. If you allow notifications, we store a device token so we can send them; turning notifications off in iOS Settings stops them."

**Services the site loads:** "Pages load fonts from Google Fonts and code libraries from Cloudflare (cdnjs) and jsDelivr. Videos from YouTube creators and news channels play in YouTube's player, which loads only when a video is on screen, and YouTube's own privacy policy applies to it. News thumbnails load from the publisher's site. These services can see your IP address. We use no advertising or analytics cookies."

## 6. Checklist
- [ ] Fix the four database issues above (GitHub issues).
- [ ] Update `privacy.html` with sections 1, 2 and 5 and a new date.
- [ ] Check `terms.html` mentions private accounts and in-app deletion the same way.
- [ ] Fill in the App Store privacy label from section 4.
- [ ] Merge `staging` to `main` only after the above.
