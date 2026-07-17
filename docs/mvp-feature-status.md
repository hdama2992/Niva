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
- Firebase-token-authenticated Socket.IO delivery for cohort messages and
  member updates. The chat screen loads durable history once and receives new
  messages, activity updates, membership outcomes, and in-app notifications
  immediately rather than polling every twelve seconds.
- Report model and guarded API retained, with member/admin report UI held.
- Admin audit history for verification, host approvals, access grants,
  and notification dispatch.
- Device push-token and delivery-queue model with an Expo dispatch endpoint.
- Host circle creation and circle-member approval/decline.
- Post-event feedback UI for completed events with persisted rating and note.
- Host event/circle edit controls with persisted notifications to affected members.
- Host cancellation with a mandatory reason, member-visible cancelled state, and
  admin cancellation controls with an audit record.
- Approved-member icebreakers on event and circle details. Members see every
  interest they have in common with another approved member, plus two scoped
  conversation prompts. They never see the other member's full interest list
  or a direct-message control.
- A persisted icebreaker privacy toggle. Turning it off removes that member
  from other members' icebreaker results.
- Post-attendance continuity choices for similar-event and small-circle
  suggestions, stored per member and event.
- Server-side recommendations that use city, mutual interests, prior
  memberships, blocks, the member's continuity choices, and settings rather
  than a device-only filter.
- Host feedback insights with aggregate rating, response count, and anonymous
  feedback notes.
- Persistent beta analytics for joins, approvals, attendance, feedback,
  icebreaker views, recommendation views, and continuity choices. The admin
  dashboard shows aggregates only.
- Bangalore seed data script for beta events and circles.
- Local PostgreSQL migration applied for the MVP schema.
- Mobile API client functions for community endpoints.
- Native iOS/Android date and time pickers for event/circle creation and
  editing, with the same no-typed-date control for Expo web previews.
- Admin member lookup, server-side activity/city search, and audited
  event/circle location corrections with member notifications.
- Role-scoped access checks for named Firebase admins. The temporary bootstrap
  key remains available only for closed-beta operations.
- Post-attendance feedback now awards a one-time, event-scoped trust event.
- Manual and optional interval-based trust recalculation from durable trust
  events.
- Optional interval-based notification queue dispatch, in addition to the
  manual admin dispatch action.
- Connection model for future circle continuity.
- Chat-thread and chat-message models scoped to events/circles.
- Notification model for reminders and community updates.
- Trust tier fields that can later unlock host tools.
- Product/MVP analysis document.
- Live admin verification and host-approval queues.
- Foreground-only host location selection with reverse geocoding, persisted
  coordinates, and map directions from activity details.
- Expo notification permission, token registration, Android channel setup,
  provider-ticket validation, and stale-device deactivation.
- Named Firebase email/password admin dashboard sessions with backend role
  enforcement.
- In-app account deletion, Firebase identity/media cleanup, cascaded product
  data deletion, a public deletion-request page, and an admin processing queue.
- Public privacy, beta terms, and account-deletion pages.
- Backend-persisted website beta access requests.

## Pending

### Product And UX

- Final visual and responsive QA across supported phone sizes.

### Mobile Integration

- Enter real Firebase project configuration and run the Phone Auth release flow
  on physical iOS/Android devices.
- Complete Firebase PNV billing, OAuth brand verification, carrier testing, and
  Android development-build testing before enabling the one-tap PNV path.
- Google/Facebook sign-in remain deliberately excluded from the phone-first
  closed beta; add them only after account-linking and trust policy are defined.
- Verify session restoration with real Firebase credentials on physical devices.
- Apply and verify production Firebase Storage security rules with real
  credentials and physical-device uploads.
- Configure EAS/FCM/APNs credentials and verify the implemented native push
  registration/delivery path on physical devices.

### Backend And Data

- Direct member-to-member connection/follow logic and automatic circle
  completion workflows. Current continuity is opt-in recommendation logic,
  not a social graph or direct messaging feature.

### Legal, Privacy, And Safety

- Obtain legal review for the implemented privacy/terms drafts and formal
  community-guideline policy.
- Finalize consent and retention policy for selfie and profile data.
- Restrict the shared bootstrap key to recovery, then remove it after named
  administrator provisioning is proven in production.
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
7. Provision and test named Firebase administrators, then restrict the
   bootstrap-key fallback to documented recovery.
8. Configure EAS/FCM/APNs and prove the implemented device registration and
   automatic dispatch path on physical devices.
9. Deploy Firebase Storage rules and complete physical-device selfie testing.
10. Legal review and publication of privacy, selfie consent, retention, and
    operator safety procedures; deletion code and public drafts are implemented.
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
Firebase/Storage/push testing, production admin provisioning, legal review,
and safety operations are the next launch blockers. See
`docs/community-completion.md` for end-to-end behavior.
