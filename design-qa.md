# Niva mobile redesign QA

Date: 22 July 2026
Branch: `codex/pvt-firebase-only-backend`

## Scope

- Home, Explore, Plans, Chats, Profile, and Settings navigation.
- Firebase-only host and participant activity lifecycle.
- Terms and Privacy acceptance without a Community Promise step or policy.
- Android keyboard, calendar, category-filter, account-deletion, and host-management behavior.
- Visual comparison against the approved sapphire/porcelain mobile deck.

## Automated checks completed

- Workspace typecheck: passed.
- Workspace lint: passed.
- Full workspace production build: passed.
- Android production JavaScript export: passed (2,726 modules).
- Backend unit tests: passed (3/3).
- Firebase emulator end-to-end suite: passed.
- Git whitespace validation: passed.

The emulator suite covers Terms and Privacy acceptance, profile completion,
two event categories, event creation and editing, production-safe event
cancellation, recurring-circle creation and occurrences, participant join
requests, host approvals, protected chat, attendance, feedback, host access,
safety reports, notifications, analytics, and account deletion.

## Physical Android checks completed before disconnect

- Login phone field remains reachable above the keyboard.
- OTP action remains reachable above the keyboard.
- Legal acceptance contains Terms and Privacy only.
- Profile setup reaches the final photo step with corrected bottom clearance.
- A seeded approved plan appears under **Your next plan** on Home.
- Opening the Home plan hero opens that exact activity detail.
- The populated activity detail displays the host note and approved attendees.

## Remaining physical and visual acceptance

The Android device is no longer visible to ADB. The last known address,
`192.168.0.7:42497`, is unreachable. The following checks require the device
to be reconnected:

1. Create two activities through the host UI and confirm their live Explore
   categories and category filtering.
2. Edit and cancel an activity through the host UI and verify the participant
   sees the updated/cancelled state.
3. Select populated dates in Plans and verify plan dots in the week rail and
   full calendar, including recurring-circle occurrences.
4. Open Chats from the bottom navigation, enter a cohort chat, and verify the
   composer moves above the Android keyboard.
5. Recheck Profile and Settings, including Edit profile, verification,
   recommendation visibility, blocked members, Help & legal, Log out, and the
   irreversible account-deletion warning.
6. Capture populated implementation screenshots at the same viewport and
   state as the approved source screens, compare them in one image, and fix
   any visible P0-P2 mismatch.

final result: blocked
