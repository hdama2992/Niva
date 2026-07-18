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
- Backend test suites: 9 passed; 38 tests passed.
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
