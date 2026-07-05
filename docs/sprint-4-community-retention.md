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

The codebase now has the core data scaffolding for Sprint 4:

- Host-gated event creation endpoint.
- Event feedback model and endpoint.
- Connections model for continuity.
- Event/circle chats scoped to joined activities.
- Trust tiers that can later unlock host tools.
- Notifications for reminders and community state changes.

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
