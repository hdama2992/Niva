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
- Event/circle detail modal.
- Join confirmation modal.
- Permission-blocked modal.
- Join-time selfie verification path.
- Verification pending screen.
- My Events section.
- Notifications panel.
- Settings panel.
- Profile screen with trust tier, verification status, interests, and profile
  metadata.
- Event/circle chats only in UI; no random DMs.
- Empty states.
- Icebreakers in activity details.
- Block host action shown in activity details.
- Host tools entry with create-event draft UI for trusted members and hosts.
- Post-event feedback UI from My Events.
- Mobile onboarding writes username, profile, self-declaration, and selfie
  review submission to the backend.
- Home loads events, circles, memberships, and notifications from the backend.
- Join requests and event feedback now persist through backend APIs.
- Local beta auth bridge for Expo preview through `NIVA_BETA_AUTH_ENABLED`.
- Firebase-ready Phone Auth with reCAPTCHA and Firebase ID-token exchange.
- Firebase refresh-token persistence in Expo SecureStore.
- Firebase Storage upload path for profile photos and join-time verification
  selfies, with camera and photo-library selection UI.

### Sprint 4: Community And Retention

- Sprint 4 documentation added.
- Host-gated event creation backend route.
- Event feedback backend route.
- Bangalore seed data script for beta events and circles.
- Local PostgreSQL migration applied for the MVP schema.
- Mobile API client functions for community endpoints.
- Connection model for future circle continuity.
- Chat-thread and chat-message models scoped to events/circles.
- Notification model for reminders and community updates.
- Trust tier fields that can later unlock host tools.
- Product/MVP analysis document.
- Live admin verification queue with approve, hold, and reject actions.

## Pending

### Product And UX

- Dedicated Event Details screen instead of only a modal.
- Dedicated Circle Details screen instead of only a modal.
- Dedicated Notifications screen instead of only a panel.
- Dedicated Settings screen with editable rows.
- Dedicated My Events screen with upcoming, past, and cancelled sections.
- Proper Create Event host flow UI.
- Proper report flow UI with reasons. Held by product decision for now:
  - spam
  - fake profile
  - harassment
  - inappropriate behaviour
  - other
- Proper block/unblock management UI.
- Community guidelines screen or page before first join. Held by product
  decision for now.
- More polished empty states and loading states.
- Real responsive QA across phone sizes.

### Mobile Integration

- Enter real Firebase project configuration and run the Phone Auth release flow
  on physical iOS/Android devices.
- Google sign-in in the Expo app.
- Verify session restoration with real Firebase credentials on physical devices.
- Logout wired to auth state.
- Apply and verify production Firebase Storage security rules with real
  credentials and physical-device uploads.
- Push notification registration with FCM/Expo notifications.
- Real event/circle chat implementation.
- Leave API calls wired into dedicated UI.
- Real report API calls. Report UI is intentionally held for now.
- Full block/unblock API calls from a dedicated management UI.
- Real notification read state.

### Backend And Data

- Real authorization policy tests.
- Admin report moderation endpoints.
- Admin event/circle management endpoints.
- Admin host approval endpoints.
- Host create/manage circle endpoint.
- Attendance marking endpoint.
- No-show handling.
- Post-event feedback trust updates.
- Notification dispatch worker or Cloud Function.
- Trust recalculation job.
- Connection/circle-continuity logic.
- Stronger input validation for phone, profile photo URL, and event timing.

### Admin

- Replace the beta shared key with individual admin authentication.
- Add report moderation queue.
- Add event/circle management.
- Add member lookup.
- Add host approval controls.
- Add audit history for verification and moderation decisions.

### Legal, Privacy, And Safety

- Privacy policy.
- Terms/community guidelines.
- Consent copy for selfie and profile data.
- Data retention policy for selfies.
- Deletion request flow.
- Admin access controls beyond a shared beta key.
- Audit logging for admin actions.
- Abuse escalation process.
- Safety playbook for reports.

## Required Before Closed Beta

These are the minimum items needed before inviting real users.

1. Configure real Firebase Phone Auth on mobile and test it on physical devices.
2. Verify production Firebase-backed mobile session restoration.
3. Real backend API integration from mobile. Local beta path is now wired.
4. Seeded Bangalore event/circle inventory.
5. Real join request persistence.
6. Apply Storage rules and complete join-time selfie upload/review testing.
7. Replace beta-key admin access with named administrator authentication.
8. Block flow wired end to end. Report flow is intentionally held for now.
9. Event/circle chat for joined members only.
10. Notifications for verification, join status, event reminders, and host
    updates.
11. Attendance and feedback collection.
12. Basic admin moderation for reports.
13. Privacy policy and selfie consent copy. Dedicated community-guidelines page
    is intentionally held for now.
14. Closed beta operating process:
    - who reviews selfies
    - who approves hosts
    - who handles reports
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

Sprint 1-4 now gives Niva a strong closed-beta MVP shape with real local
PostgreSQL-backed onboarding, discovery, join requests, notifications, and
feedback. It is not yet a production app because Firebase phone auth, file
storage, push notifications, chat, and admin dashboard wiring still need to be
finished. The next highest value work is production integration, not more
features.
