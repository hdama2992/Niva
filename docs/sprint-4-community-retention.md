# Sprint 4: Community And Retention

## Goal

Sprint 4 turns Niva from a discovery app into a controlled community loop.

```text
Join -> attend -> chat safely -> give feedback -> continue circle -> earn trust -> maybe host
```

## MVP pieces

- Host flow for trusted members.
- Workshops as curated activity formats.
- Recommendations from interests and trust signals.
- Icebreakers on event and circle details.
- Event reviews and post-event feedback.
- Basic analytics around attendance, no-shows, reports, and repeat joins.
- Circle continuity prompts after a cohort ends.
- Trust graph usage for permissions and host eligibility.

## Current implementation state

Sprint 4's closed-beta loop is now backed by PostgreSQL and guarded API
routes:

- Host-gated event and circle creation, member approval/decline, attendance,
  edits, and cancellation.
- Event/circle chats scoped to approved cohorts; there are no random DMs.
- Firebase-token-authenticated real-time delivery for cohort messages and
  activity/member updates, with PostgreSQL remaining the authoritative history.
- Post-event rating and private note, plus host-only aggregate feedback
  insights with anonymous comments.
- Approved-member icebreakers that expose every mutual interest and two
  prompts, but never the other member's full profile interests or a DM action.
- A per-member opt-out for icebreakers in Settings.
- Continuity choices after attendance, saved per event, and server-ranked
  similar-event/circle recommendations.
- Persistent aggregate beta metrics shown to admins without user-level
  analytics.
- Trust tiers and host approvals for hosting permissions, and notifications
  for membership and activity changes.

The `Connection` model remains reserved for a future explicit relationship
feature. It is not used to create member-to-member links in the current MVP.

## Closed beta launch shape

```text
City: Bangalore
Users: 50-200 women
Events: manually curated
Hosts: manually approved
Verification: manual selfie review at first join
Community: event chats and circle chats only
```

This is enough for a closed beta MVP. It is not a public-scale moderation,
payments, or host marketplace system yet.
