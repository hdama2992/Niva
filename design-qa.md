# Niva mobile redesign QA

Date: 22 July 2026
Branch: `codex/firebase-only-backend`

## Scope

- Login, OTP, profile completion, and returning-session recovery.
- Home, Explore, Plans, Chats, Profile, and Settings navigation.
- Firebase-only host and participant activity lifecycle.
- Terms and Privacy acceptance without a Community Promise step or policy.
- Android keyboard, calendar, category-filter, account-deletion, and host-management behavior.
- Same-state visual comparison against the approved sapphire/porcelain mobile deck.

## Release checks

- Workspace typecheck: passed.
- Workspace lint: passed.
- Full workspace production build: passed.
- Android production JavaScript export: passed (2,727 modules and all eight required assets).
- Git whitespace validation: passed.
- Backend unit tests: previously passed (3/3); this run could not rebind its local test server inside the Codex sandbox.
- Firebase emulator end-to-end suite: previously passed from a clean emulator. The repeated run against the long-lived QA emulator completed the functional journey but its final analytics count assertion encountered pre-existing seeded records.

## Physical Android journeys

1. **Authentication and onboarding — passed**
   - Phone and OTP actions remain reachable above the Android keyboard.
   - Firebase-emulator OTP, session creation, Terms, Privacy, and profile completion work.
   - An expired Firebase ID token refreshes through the authenticated Firebase user instead of leaving the user at “session invalid or expired”.
   - Android Back closes onboarding modals, goes to the previous step, and returns Edit profile to Profile.

2. **Participant discovery and joining — passed**
   - Home opens the exact next plan when one exists and falls back to discovery when none exists.
   - Explore builds category filters from the live activities and filters Books, Fitness, and Photography correctly.
   - Join confirmation, request submission, pending state, withdrawal, host approval, approved detail, and protected chat all work.

3. **Plans and chat — passed**
   - Dates are selectable in the week rail.
   - Dates with plans have markers in the week rail and month calendar.
   - Recurring-circle occurrences appear on their applicable dates.
   - Chats is present in bottom navigation, contains approved non-cancelled activities once, and persists a sent message.
   - The Android keyboard resizes the chat composer above the keyboard.

4. **Host lifecycle — passed**
   - Host event creation, editing, request review, approval, and cancellation work through the UI.
   - Cancelled activities move to History, display Cancelled, and do not expose Chat or participant actions.

5. **Profile, settings, and deletion — passed**
   - Edit profile, verification, recommendation visibility, blocked members, legal/help, and Log out are reachable.
   - Preferences and Community Promise are absent.
   - Delete account is last and requires a destructive confirmation before deletion.

## Visual acceptance

Reference/current comparison sheets are in `artifacts/final-device-audit-2026-07-22/comparisons/` for Home, activity detail, Plans, and Profile.

- P0 functional mismatch: none found.
- P1 hierarchy/layout mismatch: none found.
- P2 polish mismatch: none blocking acceptance. Content density and Android system chrome differ from the static deck by design.
- Home, detail, Plans, and Profile use the approved trust-led navy, porcelain, warm illustration, rounded-card, and restrained glass treatment.
- Plan cards now use a purpose-built portrait book-swap asset; uploaded custom event photography continues to take precedence.
- The floating grey gear visible in device screenshots belongs to Expo Dev Client and is absent from release builds.

## Accessibility and real-environment limits

- Labels, roles, keyboard reachability, destructive confirmation, and Android hardware Back were checked.
- TalkBack traversal, font scaling, switch access, and contrast under device accessibility overrides still require a manual accessibility pass.
- Real SMS/Play Integrity, push notifications, production Storage uploads, and a Play Internal Testing build cannot be proven by the emulator-only Firebase environment.

final result: passed for implementation and connected-device QA; remaining items are production-service acceptance checks
