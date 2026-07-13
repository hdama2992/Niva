# Sprint 3: Home And Discovery

## Goal

When a user opens Niva, she should immediately see what is happening nearby,
which recurring circles are starting soon, and what action is available next.

Sprint 3 makes the app feel usable before the full cohort engine exists.

## Implemented mobile pieces

- Home header with greeting and city.
- Private trust card with pending or verified state.
- "This week near you" event cards loaded from the backend.
- "Circles starting soon" cards loaded from the backend.
- Interest-based recommendations.
- Safety/community tips.
- Bottom tabs: Home, Explore, Circles, Messages, Profile.
- Explore search.
- Interest filters.
- Join request flow backed by event/circle membership records.
- Dedicated event and circle detail screens.
- Dedicated My Plans screen with upcoming, past, and cancelled filters.
- Dedicated Notifications screen with persisted read state.
- Dedicated Settings screen with persisted notification, recommendation, and
  circle-continuity toggles.
- Blocked member list with real unblock action.
- Dedicated host event form with server-side host-tier enforcement.
- Event and circle chats only.
- Privacy-preserving activity details. Other members are not previewed before
  a join request is approved.
- Permission-blocked modal for users who are not basic verified.
- Empty states for recommendations, search, and messages.
- Server-side capacity checks that prevent join requests after an activity is
  full.
- Discovery queries exclude activities hosted by a member the user blocked.

## MVP home hierarchy

```text
Top
  Good morning, Himaja
  Bangalore

Trust card
  Complete verification / You're verified / Become trusted member

Sections
  This week near you
  Circles starting soon
  Workshops
  Recommended for your interests
  Safety and community tips

Bottom tabs
  Home
  Explore
  Circles
  Messages
  Profile
```

## Permission behavior

Logged-in users can browse events and circles.

Only basic verified users can:

- Join events.
- Join circles.
- Enter cohort chats.

The blocked modal copy is:

```text
Complete verification to join events and circles.
This helps us keep Niva safer for everyone.
```

Selfie review begins from the first join attempt. It is not required before a
new user reaches Home.

## Data behavior

The mobile app loads published events, circles, memberships, notifications,
settings, and blocks through authenticated `/community` API routes. A card is
joinable only when it includes a backend activity ID. The app does not show a
successful join state for local placeholder content.

On a join request, the backend checks the member's verification state, the
published status of the activity, current active membership count, and the
activity capacity. It then persists a `REQUESTED` membership and creates a
notification. Leaving changes the membership to `CANCELLED`; it does not delete
history.

The current UI deliberately does not list attendee identities before approval.
That prevents the static icebreaker content from being mistaken for real member
data and keeps cohort visibility within the approved, joined-member boundary.

## Product principle

Home is not a feed. It is an action surface for real-world activities.

## Still outside Step 3

- Real event/circle chat transport and message UI. The Messages tab only shows
  the access boundary for now.
- Host approval and event moderation workflow.
- Calendar integration, location maps, and date/time picker controls.
- Push notification delivery. Notifications are persisted and displayed, but a
  worker/FCM delivery path is still required.
- Report flow and community guidelines, intentionally held by product decision.
