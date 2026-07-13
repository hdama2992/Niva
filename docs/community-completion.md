# Community Completion: End-to-End Implementation

This document describes the real community functionality completed after
Sprint 3 and the external work still required for a public launch.

## Local Status

The local `niva` PostgreSQL database is synchronized with the Prisma schema,
including the `20260713150000_activity_lifecycle` migration. The mobile app,
API, and admin dashboard use
the following persistent records rather than device-only or mock state:

| Flow | Records |
| --- | --- |
| Guidelines | `User.communityGuidelinesAccepted*` |
| Join requests | `EventMember` and `CircleMember` |
| Host review | `HostApproval` |
| Cohort chat | `ChatThread` and `ChatMessage` |
| Held reporting model | `UserReport` |
| Admin decisions | `AdminAuditLog` |
| Attendance and trust | `EventMember` and `TrustEvent` |
| In-app alerts | `Notification` |
| Push delivery queue | `DevicePushToken` and `NotificationDelivery` |

## Member Flow

### Guidelines and joining

Browsing events and circles remains available before verification. A member's
first join attempt follows this order:

1. The API checks the existing verification state. An unverified member enters
   the private selfie-review flow.
2. A verified member who has not agreed to the guidelines sees the dedicated
   community-guidelines screen.
3. That screen explicitly says Niva is women-centered and can be joined only
   by women or people who identify as women. It also covers respect, privacy,
   no harassment, and event-chat boundaries.
4. **I agree and continue** calls `POST /users/me/community-guidelines` and
   stores the version plus timestamp.
5. The normal join confirmation sends `POST /community/events/:id/join` or
   `POST /community/circles/:id/join`, which creates a `REQUESTED` membership.

The join methods repeat verification and guideline checks on the server. A
modified app client cannot bypass them.

### Host approval and activity management

A trust tier alone does not unlock event creation. The server requires an
approved `HostApproval` record as well.

1. A trusted member selects **Request host access** in Profile.
2. `POST /community/host-approval/request` creates or resets a `PENDING`
   request.
3. An operator approves or rejects the request in the admin dashboard.
4. An approved host can create an event or a recurring circle. The backend
   assigns her as its `hostId` and creates its `ChatThread`.
5. Opening an event or circle displays the corresponding member-management
   screen, backed by guarded event or circle member routes.
6. The host approves or declines each request through a guarded API route.
   Approved members receive an in-app notification and gain chat access.
7. After the event, the host marks approved members `ATTENDED` or `NO_SHOW`.
   The API changes the membership, creates a +5/-10 trust event, recalculates
   the trust profile, and notifies the member.

Event and circle member routes verify the caller is the stored `hostId`; a
member cannot approve herself or manage another host's activity.

### Activity lifecycle

Hosts can edit a published event or circle from its details screen. The API
rechecks the stored host ID, rejects edits to cancelled/completed activities,
and prevents capacity being reduced below active memberships. Each saved change
creates an `ACTIVITY_UPDATED` notification for members with pending or approved
places.

Hosts must give a cancellation reason. Cancelling changes the persisted activity
status to `CANCELLED`, stores the reason and time, removes it from discovery,
and sends `ACTIVITY_CANCELLED` notifications. Members see the cancelled state
and reason in **My plans** and activity details. The admin dashboard has the
same cancellation control for any published event or circle, with an audit row.

### Cohort chat

The API now exposes persistent event and circle chat:

```text
GET  /community/chats/EVENT/:eventId/messages
POST /community/chats/EVENT/:eventId/messages
GET  /community/chats/CIRCLE/:circleId/messages
POST /community/chats/CIRCLE/:circleId/messages
```

Only the host or an `APPROVED`/`ATTENDED` member may use those routes. No
direct-message endpoint exists. The mobile Messages tab lists only approved
cohorts and the chat screen persists messages in PostgreSQL, refreshing every
twelve seconds. That is real persistence and authorized retrieval, though it
is polling rather than WebSocket delivery.

Block relationships are checked in both directions for discovery and chat. If
either member blocked the other, the blocked sender's messages are omitted from
the other member's chat response.

### Held reporting workflow

The report data model and guarded backend routes remain in the codebase, but
the member report screen and admin report queue are intentionally hidden for
this beta iteration. No member can currently submit Spam, Fake profile,
Harassment, Inappropriate behaviour, or Other through the released UI.

Before re-enabling this feature, the product needs a staffed moderation
process, response expectations, escalation guidance, and a decision on whether
confirmed reports should change trust automatically. The retained routes and
`UserReport` model allow that work to resume without a database redesign.

### Post-event feedback

A member can now open a past event in **My plans**, choose **Give feedback**,
select a one-to-five rating, and optionally leave a note. The mobile app sends
the response to the existing feedback API, which persists it in PostgreSQL.
Feedback is limited to past event memberships and is not exposed as a public
review feed.

### Notifications and push queue

All app notifications go through `NotificationService`:

1. It creates an in-app `Notification` row.
2. It respects the member's saved notification preference.
3. It finds active `DevicePushToken` rows and creates a `PENDING`
   `NotificationDelivery` per token.

`POST /community/push-tokens` is the mobile token registration API. An operator
can call `POST /admin/notification-deliveries/dispatch`; it sends pending rows
to Expo Push, persists `SENT` or `FAILED`, and audits the dispatch action.

The queue and dispatch code are implemented. Actual phone delivery is still
pending because the Expo app does not yet include `expo-notifications` or
register native push tokens; FCM/APNs credentials and native builds are also
required.

## Admin Access and Audit

`NIVA_ADMIN_KEY` remains the closed-beta dashboard fallback. The API also now
supports named administrators:

1. The admin first signs in through Firebase, so she has a local `User` row.
2. A bootstrap operator calls `POST /admin/access` with the local user ID and
   an `AdminRole`.
3. The admin can then use a Firebase Bearer token. `AdminAccessGuard` verifies
   Firebase and requires an active `AdminAccess` record.
4. Verification, host-approval, access-grant, and notification-dispatch
   actions all create `AdminAuditLog` rows with the actor identity.

The dashboard still enters the shared key because it does not yet have a
Firebase browser sign-in screen. Before public launch, switch the dashboard to
Bearer tokens and remove the key fallback.

## Added API Routes

```text
POST  /users/me/community-guidelines
GET   /community/chats/:type/:activityId/messages
POST  /community/chats/:type/:activityId/messages
POST  /community/host-approval/request
GET   /community/host-approval
POST  /community/circles
PATCH /community/events/:eventId
POST  /community/events/:eventId/cancel
PATCH /community/circles/:circleId
POST  /community/circles/:circleId/cancel
GET   /community/events/:eventId/members
PATCH /community/events/:eventId/members/:memberId
PATCH /community/events/:eventId/members/:memberId/attendance
GET   /community/circles/:circleId/members
PATCH /community/circles/:circleId/members/:memberId
POST  /community/push-tokens

GET   /admin/me
POST  /admin/access
GET   /admin/host-approvals
PATCH /admin/host-approvals/:userId
GET   /admin/activities
POST  /admin/events/:eventId/cancel
POST  /admin/circles/:circleId/cancel
POST  /admin/notification-deliveries/dispatch
```

## Remaining Before Public Launch

1. Add `expo-notifications`, native device-token registration, and FCM/APNs
   setup; schedule delivery with a worker or Cloud Function rather than the
   manual admin endpoint.
2. Add Firebase sign-in to the admin dashboard, enforce permissions per
   `AdminRole`, and retire the shared-key fallback.
3. Add a validated map/location picker and replace the compact date/time stepper
   with platform-native date/time controls once the native dependency can be
   added to the Expo build.
4. Decide whether to re-enable the held reporting flow with moderation
   operations in place.
5. Test real Firebase Phone Auth, Storage rules, and selfie upload/review on
   physical iOS and Android builds.
6. Add privacy, retention/deletion, legal consent, and operator escalation
   procedures.
