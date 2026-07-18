# Approved mobile redesign QA

## Selected references

- Home: `/Users/hdama/.codex/generated_images/019f6ffe-b782-7681-a241-1716631ff0a2/exec-acae011c-0572-4858-b1db-0e50c81efbdd.png`
- Event detail before approval: `/Users/hdama/.codex/generated_images/019f6ffe-b782-7681-a241-1716631ff0a2/exec-3c2315d3-55a6-4435-9603-dff82b3a23d5.png`
- Event detail after approval: `/Users/hdama/.codex/generated_images/019f6ffe-b782-7681-a241-1716631ff0a2/exec-2d619877-9fec-479b-a7e6-3cdf8f936dd7.png`
- Plans agenda: `/Users/hdama/.codex/generated_images/019f6ffe-b782-7681-a241-1716631ff0a2/exec-3b7bd27f-a15e-4824-bd05-5850ca986386.png`
- Revised approved Profile: `/Users/hdama/Desktop/Niva/artifacts/product-redesign-options-2026-07-18/02-profile-option-revised-approved.png`

## Implemented states

- Sapphire/porcelain Home with asymmetric live-event hero, activity-specific artwork, real approved-member avatars, recommendation cards, shimmer loading, and floating glass navigation.
- Event detail before approval with hidden exact location/member profiles and a join-request CTA.
- Event detail after approval with real approved profiles, maps, chat, icebreakers, calendar, and leave-plan actions.
- Optional host introductions on events and circles, with a profile-bio fallback and a polished “A note from…” detail card.
- Agenda Plans view with upcoming, pending, and history states plus every recurring-circle occurrence.
- Compact-width adaptations for agenda cards and attendee rows.
- Revised Profile with factual verification status only, interests, a visual host pathway, focused settings groups, and the Community Promise.
- No public trust points, trust tiers, attendance score, or unexplained reliability labels.
- Simplified Explore with one activity-type filter and category chips.
- Full-image activity framing, 3:2 custom-cover selection, and separate card/detail artwork.
- Shimmer loading on Home, Explore, Plans, and cohort chat.
- Android status/navigation insets, hardware-back handling, and a keyboard-safe cohort composer.

## Functional verification

- Mobile TypeScript check: passed.
- Backend build: passed.
- Backend test suites: 9 passed; 39 tests passed.
- Prisma schema validation and generation: passed.
- Additive migration applied successfully to local PostgreSQL.
- Seed verification: Makers Night has 4 occurrences; Six-week Running Crew has 6 occurrences.
- `git diff --check`: passed.

## Physical Android captures

- Home: `/private/tmp/niva-home-art-height-fix.png`
- Event detail before approval: `/private/tmp/niva-prejoin-device-final.png`
- Event detail after approval: `/private/tmp/niva-approved-detail-top.png`
- Full host introduction card: `/private/tmp/niva-approved-detail-host-note.png`
- Plans agenda: `/private/tmp/niva-plans-agenda-current.png`
- Login: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/login.png`
- Revised Profile: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/profile.png`
- Host pathway: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/host-pathway.png`
- Simplified Explore: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/explore.png`
- Final Plans artwork: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/plans.png`
- Keyboard-open cohort chat: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/chat-keyboard.png`

## Same-input comparisons

- Home reference + Android capture: `/private/tmp/niva-home-comparison.png`
- Pre-approval reference + Android capture: `/private/tmp/niva-prejoin-comparison.png`
- Approved reference + Android capture: `/private/tmp/niva-approved-comparison.png`
- Plans reference + Android capture: `/private/tmp/niva-plans-comparison.png`
- Revised Profile reference + Android capture: `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/profile-comparison.png`

The physical-device passes resolved membership-state, empty-member, image-frame, Android inset, bottom-navigation, and chat-keyboard issues. The final paired comparisons preserve the approved sapphire/porcelain hierarchy, trust-forward palette, activity imagery, sticky actions, Profile structure, and agenda flow. Differences in dates, attendee count, verification state, profile photo, interests, and artwork reflect the live local QA account and seeded activity data. The floating grey gear visible in captures is Expo development-client tooling and is not part of the production UI.

final result: passed physical-device visual QA

## Connected redesign pack follow-up

### Added and verified

- Removed the standalone Welcome route; onboarding now moves directly from
  authentication into profile creation.
- Rebuilt Login around the approved sapphire/porcelain visual direction with
  real activity artwork, a single phone action, concise security guidance,
  and working Privacy/Terms links.
- Split first-time profile creation into three clear stages: details,
  interests, and the public profile photo. The public photo is deliberately
  last and provides direct camera and library actions.
- Rebuilt the admin landing view as a production moderation queue while
  preserving the existing real approve/reject operations.
- Rebuilt the public Privacy page around public-photo versus private-selfie
  handling, location privacy, reports, retention, and user controls.
- Completing the existing profile declaration now completes onboarding on the
  backend, replacing the removed Welcome confirmation without adding a dummy
  client-only state.

### Physical Android evidence

- Redesigned Login: `/Users/hdama/Desktop/Niva/artifacts/complete-ui-redesign-2026-07-19/final-qa/login-android.png`
- Final profile-photo step: `/Users/hdama/Desktop/Niva/artifacts/complete-ui-redesign-2026-07-19/final-qa/profile-photo-android.png`

### Maestro regression evidence

- Login shell flow: passed.
- Complete deterministic onboarding flow: passed on the connected Android
  device, including OTP, details, city selection, interests, and the final
  profile-photo actions.
- Focused profile-photo action flow: passed.
- Reusable flows live in `.maestro/` and intentionally run in beta auth mode;
  they do not upload a real personal photo.

Live Firebase SMS remains an external environment check: the configured
Firebase project currently reports `auth/operation-not-allowed`, which means
Phone authentication must be enabled in Firebase Authentication before a live
OTP pass can succeed. The app maps this to a friendly user-facing message
instead of exposing the provider error.

## Profile policy placement and startup follow-up

### Current-flow captures

1. Profile — healthy: Community Promise no longer adds another card to the main Profile hierarchy.
   - `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/profile-community-moved.png`
2. Support & policies — healthy: Community Promise is the first policy entry, beside support, privacy, terms, and account deletion.
   - `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/support-community-promise.png`
3. Optimized beta startup — healthy after the development-client transition: Login no longer has an intentional 900 ms application delay.
   - `/Users/hdama/Desktop/Niva/artifacts/product-audit-2026-07-18/final-qa/startup-login-optimized.png`

### Startup findings and changes

- Local session creation measured 128 ms; community endpoints measured 26–84 ms individually.
- Removed the fixed 900 ms delay before the beta Login route.
- Reduced blocking Home startup from eight API calls to the three calls required to render plans and discovery. Notifications, settings, blocks, host status, and recommendations now hydrate after first content.
- Replaced the mobile runtime's 2.0 MB pottery PNG dependency with a 76 KB WebP asset.
- Metro's latest cached bundle completed in 58–70 ms. The remaining multi-second blank transition on a force-stopped development build belongs to Expo Dev Launcher; warm launches measured 215 ms. Production builds do not include the development launcher.

Accessibility evidence is limited to visible hierarchy, labels, contrast, and physical Android interaction. Screen-reader ordering still requires a dedicated TalkBack pass.

## Complete connected deck implementation — 19 July 2026

### Implemented as working product screens

- Login, OTP, final-step profile photo guidance, Community Promise, private
  verification selfie, and verification pending.
- Notifications, report concern, private event feedback, and cohort
  icebreakers.
- Host create-plan, manage-plan, member attendance, private feedback insights,
  and join-request review screens.
- Admin identity/host/report review queue using the real moderation endpoints.
- Public Community Promise, Support, Privacy, Terms, and account-deletion
  routes using one shared policy layout.
- Real activity cover selection, camera/library actions, host introductions,
  membership status, approved attendee data, cohort chat, and moderation
  decisions; these are not placeholder-only controls.

### Physical Android role acceptance

The connected Samsung SM-M017F completed the following real local-data flow:

1. An approved host logged in and opened the hosting tools.
2. The host created and published `Maestro Host Supper 0319` through the UI.
3. A separate default participant discovered the event and sent a one-time
   join request.
4. The host opened Manage plan, reviewed the participant's verified profile,
   interests, city, bio, and public photo, then approved the request.
5. The participant saw the event under Upcoming with `You’re going`, opened
   the approved detail state, and entered the cohort chat.
6. The Android keyboard moved the composer above the keyboard, and the
   participant successfully sent a persisted chat message.

The activity-detail image bug found during this pass was fixed by giving the
detail artwork an explicit measured frame. The entire 3:2 image now renders;
it is neither stretched nor silently clipped to the left portion. Host action
and review controls also received enough Android bottom clearance to remain
fully tappable above system navigation.

### Automated acceptance

- Live local role-flow test: passed. It verifies host approval, event creation,
  participant discovery, one-time request creation, prevention of participant
  self-approval, host profile review, host approval, participant Plans state,
  and two-role cohort chat.
- Mobile TypeScript: passed.
- Backend build: passed.
- Backend Jest: 9 suites and 39 tests passed.
- Backend ESLint: passed.
- Admin ESLint and production build: passed.
- Public website ESLint and production build: passed.
- `git diff --check`: passed.

### Same-input deck comparisons

- Login: `artifacts/deck-runtime-qa-2026-07-19/comparisons/01-login.png`
- Profile photo: `artifacts/deck-runtime-qa-2026-07-19/comparisons/02-profile-photo.png`
- Community Promise: `artifacts/deck-runtime-qa-2026-07-19/comparisons/03-community-promise.png`
- Verification selfie: `artifacts/deck-runtime-qa-2026-07-19/comparisons/04-selfie.png`
- Create plan: `artifacts/deck-runtime-qa-2026-07-19/comparisons/05-create-plan.png`
- Manage plan: `artifacts/deck-runtime-qa-2026-07-19/comparisons/06-manage-plan.png`
- Review request: `artifacts/deck-runtime-qa-2026-07-19/comparisons/07-review-request.png`

Differences in names, dates, counts, profile images, and activity artwork are
intentional live-test data. The grey floating gear is Expo development-client
tooling and is absent from production builds.

final result: passed complete connected deck and two-role Android acceptance QA
