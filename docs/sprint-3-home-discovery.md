# Sprint 3: Home And Discovery

## Goal

When a user opens Niva, she should immediately see what is happening nearby,
which recurring circles are starting soon, and what action is available next.

Sprint 3 makes the app feel usable before the full cohort engine exists.

## Implemented mobile pieces

- Home header with greeting and city.
- Private trust card with pending or verified state.
- "This week near you" event cards.
- "Circles starting soon" cards.
- Workshops.
- Interest-based recommendations.
- Safety/community tips.
- Bottom tabs: Home, Explore, Circles, Messages, Profile.
- Explore search.
- Interest filters.
- Join request flow.
- Event detail screen.
- Circle detail screen.
- My events.
- Notifications UI.
- Event and circle chats only.
- Basic settings entry.
- Icebreakers in activity details.
- Permission-blocked modal for users who are not basic verified.
- Empty states for recommendations, search, and messages.

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

## Product principle

Home is not a feed. It is an action surface for real-world activities.
