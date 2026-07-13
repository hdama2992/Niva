# Niva MVP Feature Status

## Scope

This document tracks what is implemented in this repository, what is still
pending, and what is required before a closed beta launch.

Target launch shape:

```text
Launch type: Closed beta
City: Bangalore
Users: 50-200 women
Events: manually curated
Hosts: manually approved
Verification: self-declaration plus join-time selfie review
Community: event chats and circle chats only
```

## Implemented

### Sprint 1: App Base

- Expo mobile app shell.
- NestJS backend.
- Next.js admin dashboard.
- Next.js documentation app.
- PostgreSQL and Prisma setup.
- Firebase Admin verification service.
- Phone-auth session endpoint shape.
- Basic mobile login, OTP, username, and home navigation prototype.
- Shared theme tokens and reusable mobile form/button components.

### Sprint 2: Foundation

- Username rules: lowercase letters, numbers, underscore, 3-20 characters.
- Backend username reservation model.
- Profile setup fields:
  - display name
  - username
  - bio
  - city
  - age range
  - languages
  - occupation
  - interests
  - profile photo URL field in backend
- Self-declaration screen with explicit women-centered eligibility checkbox.
- Selfie verification model.
- Selfie verification is now triggered from the first join attempt, not forced
  before Home.
- Verification review queue model.
- Admin review endpoints protected by `NIVA_ADMIN_KEY`.
- Admin dashboard copy explaining review queue, admin key, and backend relation.
- Trust profile model.
- Trust event model.
- Trust score and tier recalculation on verification actions.
- Safety data scaffolding:
  - reports
  - blocks
  - settings
  - emergency contact
  - notifications
- Backend community routes for:
  - events
  - circles
  - joining and leaving
  - my activities
  - notifications
  - reports
  - blocks
  - settings
  - emergency contact
  - host-gated event creation
  - event feedback

### Sprint 3: User Experience

- Home dashboard.
- Explore screen.
- Event cards.
- Circle cards.
- Workshop cards.
- Search.
- Interest filters.
- Recommended activities from interests.
- Dedicated event and circle detail screens with verified join and leave states.
- Join confirmation modal.
- Permission-blocked modal.
- Join-time selfie verification path.
- Verification pending screen.
- My Events section.
- Dedicated notifications screen with persisted read state.
- Dedicated settings screen with persisted notification, recommendation, and
  circle-continuity settings.
- Profile screen with trust tier, verification status, interests, and profile
  metadata.
- Event/circle chat access boundary only; no random DMs.
- Empty states.
- Block host action shown in activity details.
- Blocked-member management with a persisted unblock action.
- Host event creation form for trusted members and hosts.
- Mobile onboarding writes username, profile, self-declaration, and selfie
  review submission to the backend.
- Home loads events, circles, memberships, and notifications from the backend.
- Join requests and event feedback now persist through backend APIs.
- My Plans groups persisted memberships into upcoming, past, and cancelled
  states.
- Activity capacity is enforced by the backend for new join requests.
- Discovery excludes activities hosted by members the current user has blocked.
- The mobile UI does not present placeholder activities as joinable.
- Local beta auth bridge for Expo preview through `NIVA_BETA_AUTH_ENABLED`.
- Firebase-ready Phone Auth with reCAPTCHA and Firebase ID-token exchange.
- Firebase refresh-token persistence in Expo SecureStore.
- Android Firebase Phone Number Verification bridge with one-tap SIM consent,
  SMS fallback, and a backend Firebase custom-token exchange path.
- Firebase Storage upload path for profile photos and join-time verification
  selfies, with camera and photo-library selection UI.
- Firebase Storage rule configuration for member-owned image uploads, private
  verification-selfie reads, and backend selfie-path ownership validation.

### Sprint 4: Community And Retention

- Explicit community-guideline acceptance before the first authorized join.
- Admin-reviewed host approval and host-gated event creation.
- Host member management: approve/decline requests and record attendance/no-show.
- Persistent event/circle cohort chat for approved members only; no random DMs.
- Report model and guarded API retained, with member/admin report UI held.
- Admin audit history for verification, host approvals, access grants,
  and notification dispatch.
- Device push-token and delivery-queue model with an Expo dispatch endpoint.
- Host circle creation and circle-member approval/decline.
- Post-event feedback UI for completed events with persisted rating and note.
- Host event/circle edit controls with persisted notifications to affected members.
- Host cancellation with a mandatory reason, member-visible cancelled state, and
  admin cancellation controls with an audit record.
- Bangalore seed data script for beta events and circles.
- Local PostgreSQL migration applied for the MVP schema.
- Mobile API client functions for community endpoints.
- Connection model for future circle continuity.
- Chat-thread and chat-message models scoped to events/circles.
- Notification model for reminders and community updates.
- Trust tier fields that can later unlock host tools.
- Product/MVP analysis document.
- Live admin verification and host-approval queues.

## Pending

### Product And UX

- Platform-native date/time picker and location-map integration for host
  creation/editing. The current UI has controlled day and 30-minute time
  controls rather than manual date entry.
- More polished empty states and loading states.
- Real responsive QA across phone sizes.

### Mobile Integration

- Enter real Firebase project configuration and run the Phone Auth release flow
  on physical iOS/Android devices.
- Complete Firebase PNV billing, OAuth brand verification, carrier testing, and
  Android development-build testing before enabling the one-tap PNV path.
- Google sign-in in the Expo app.
- Verify session restoration with real Firebase credentials on physical devices.
- Logout wired to auth state.
- Apply and verify production Firebase Storage security rules with real
  credentials and physical-device uploads.
- Expo native push-token registration and FCM/APNs provider configuration. The
  backend queue and manual dispatch API are implemented.

### Backend And Data

- Role-specific authorization policy tests.
- Admin event/circle location-management endpoints.
- Post-event feedback trust updates and host-facing feedback insights.
- Scheduled notification dispatch worker or Cloud Function. A manual admin
  dispatch endpoint exists.
- Trust recalculation job.
- Connection/circle-continuity logic.
- Stronger input validation for phone, profile photo URL, and event timing.

### Admin

- Switch the dashboard from its beta key field to named Firebase admin login.
- Restrict each admin action by role instead of allowing all active roles.
- Add member lookup tools and richer activity search/filtering.

### Legal, Privacy, And Safety

- Privacy policy.
- Terms/community guidelines.
- Consent copy for selfie and profile data.
- Data retention policy for selfies.
- Deletion request flow.
- Admin access controls beyond a shared beta key.
- Audit logging for admin actions.
- Abuse escalation process.
- Moderation safety playbook, then re-enable report submission and review UI.

## Required Before Closed Beta

These are the minimum items needed before inviting real users.

1. Configure real Firebase Phone Auth on mobile and test it on physical devices.
2. Verify production Firebase-backed mobile session restoration.
3. Real backend API integration from mobile. Local beta path is now wired.
4. Seeded Bangalore event/circle inventory.
5. Real join request persistence.
6. Deploy the checked-in Storage rules and complete join-time selfie
   upload/review testing with real Firebase credentials.
7. Configure named Firebase admin login in the dashboard and retire the
   bootstrap-key fallback.
8. Add Expo/FCM/APNs device notification registration and automatic dispatch.
9. Deploy Firebase Storage rules and complete physical-device selfie testing.
10. Privacy policy, selfie consent, retention/deletion, and operator safety
    procedures.
11. Closed beta operating process:
    - who reviews selfies
    - who approves hosts
    - whether reports are enabled and who handles them
    - how fast moderation responds

## Not Required Before Closed Beta

- Global public feed.
- Random direct messages.
- AI gender detection.
- Full government ID verification for every user.
- Payments.
- In-app ticketing.
- Public host marketplace.
- Complex AI matching.
- Ads or creator/influencer tools.

## Current Product Judgment

Sprint 1-4 now gives Niva a closed-beta MVP with real local PostgreSQL-backed
onboarding, discovery, verification-gated joins, host decisions, circle
management, cohort chat, attendance, post-event feedback, and in-app
notifications. The reporting model is held from the active UI. Physical-device
Firebase/Storage testing, native push registration, named dashboard sign-in,
and privacy/operations are the next launch blockers. See
`docs/community-completion.md` for end-to-end behavior.
