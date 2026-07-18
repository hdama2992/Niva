# Niva connected deck — physical Android QA

This folder contains final Samsung SM-M017F screenshots from the implemented
mobile app, not static mockups. The app used the local Niva API and PostgreSQL
database in beta-auth mode so host and participant mutations could be tested
without consuming live Firebase SMS.

## Key role-flow evidence

- `host-profile-android.png` — approved host tools.
- `create-plan-android.png` — working create-plan UI.
- `host-created-plan-android.png` — event published through the app.
- `participant-request-sent-android.png` — default participant request.
- `manage-plan-pending-android.png` — host sees a real pending request.
- `review-request-top-android.png` and `review-join-request-android.png` — host
  sees profile context and the approval controls.
- `request-approved-android.png` — queue clears after the real approval.
- `participant-approved-plan-android.png` — approved event in Plans.
- `participant-approved-detail-android.png` — approved event detail with the
  corrected full artwork frame.
- `chat-keyboard-shift-android.png` — composer moves above Android keyboard.
- `participant-chat-message-android.png` — persisted participant message.

## Design comparisons

The `comparisons/` folder places each approved source screen and its Android
implementation in the same image for direct visual review.

The floating grey gear is Expo development-client tooling, not Niva UI. It is
not included in preview or production builds.
