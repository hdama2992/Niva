# Niva complete UI redesign review pack

Date: 19 July 2026

Status: visual direction only; these screens have not been implemented in the app.

## Approved direction

The pack extends the approved preview-first plan design across Niva using:

- deep sapphire and warm porcelain for trust and clarity;
- muted sage for positive and verified states;
- coral only for warnings, pending work, rejection, or destructive actions;
- restrained glass effects at top-level controls and sticky actions;
- humanist sans typography rather than playful display type;
- clear back navigation and one primary decision per screen;
- factual trust evidence instead of numerical trust scores or tiers.

## Screens

1. `00-login.png` — phone login/sign-up with concise privacy guidance and ten-digit input.
2. `01-otp.png` — SMS verification, autofill, resend timing, and safe error space.
3. `02-profile-photo-guidance.png` — final profile step, public-photo purpose, framing guidance, camera and gallery choices.
4. `03-community-promise.png` — concise behavioural agreement.
5. `04-verification-selfie-guidance.png` — private live selfie capture with lighting and framing guidance.
6. `05-verification-pending.png` — review status and realistic expectations.
7. `07-notifications.png` — actionable and informational updates.
8. `08-report-concern.png` — private safety reporting.
9. `09-event-feedback.png` — fast post-plan feedback without a public score.
10. `10-icebreakers.png` — shared interests and optional adult conversation prompts.
11. `11-create-plan.png` — preview-first host creation with host-owned activity photography.
12. `12-manage-plan.png` — focused host operations.
13. `13-review-join-request.png` — one-request-at-a-time approval using only shared profile information.
14. `14-admin-review-queue.png` — named-admin identity, host-access, and report operations.
15. `15-public-privacy-safety.png` — reusable public template for Privacy, Terms, Community Promise, Support, and account deletion.

## Photo rules

### Profile photo

- The final step after the member has completed profile details and interests.
- Public in the member profile and approved plan contexts.
- A recent solo photo with the face clearly visible.
- Natural light and no heavy filters.
- Camera and gallery are both appropriate.

### Verification selfie

- Private and visible only to authorised Niva reviewers.
- Never displayed on the member profile.
- Current live front-camera capture for production verification.
- Face centred, evenly lit, and unobstructed.
- No filters, edits, sunglasses, masks, or hats.

The current app still offers an existing-photo option for the verification selfie. Implementing this approved design means changing production verification to live camera capture only. A future liveness vendor can strengthen this further without changing the user-facing distinction.

## Navigation rules

- Every secondary screen has a visible, comfortably tappable back arrow.
- Android hardware Back performs the same action as the header arrow.
- Leaving a changed form offers Save draft, Discard changes, or Keep editing.
- Onboarding screens use Back, Cancel, or Sign out according to whether returning is safe.
- Destructive actions require confirmation and state the consequence before completion.

## Welcome behaviour

- There is no standalone Welcome page.
- Completing the profile opens the real Home screen immediately.
- No welcome banner, confirmation page, or additional interruption is shown.

## Implementation boundary

No production UI code was changed while preparing this pack. Implementation should begin only after the pack is approved or annotated.
