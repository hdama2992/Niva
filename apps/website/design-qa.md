# Niva Design QA

## Product Design Intent

The original visual direction establishes an editorial, warm, hosted-gathering
world for Niva. This implementation preserves that visual character while
expanding the information architecture to explain the full product promise:

- trusted entry into a women-centred community;
- small, hosted gatherings rather than an open social feed;
- returning circles and familiar faces as the retention mechanism; and
- safety and host accountability as product behaviours, not decorative claims.

The rewritten website is intentionally not a pixel-for-pixel copy of the first
hero concept. It uses that concept as the visual source while making the
membership journey, beta scope, safety model, and host path explicit.

## Comparison Target

- Editorial visual source:
  `/Users/hdama/.codex/generated_images/019f2c1a-c06d-72f2-9aed-905401e5f635/exec-6eac4694-1f5d-4c82-8c36-d790fcf86361.png`
- Local implementation: `http://localhost:3003/`
- Desktop review: default desktop viewport
- Phone review: `390 x 844`

## Evidence

- Website production build: `pnpm --filter @niva/website build` passed.
- Mobile test suite: `flutter test` passed.
- Flutter web build: `flutter build web` passed.
- Desktop website capture:
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/08-website-redesign-desktop.png`
- Phone website capture:
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/09-website-redesign-mobile.png`
- Phone beta form capture:
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/10-website-beta-modal-mobile.png`
- Phone app captures:
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/12-app-login-phone.png`,
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/15-app-home-phone.png`,
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/16-app-activity-detail-phone.png`, and
  `/Users/hdama/Desktop/Niva/tmp/niva-design-audit/17-app-join-request-phone.png`.

## Findings And Resolutions

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | The previous website sold a beautiful gathering, but did not clearly explain Niva as a membership-led friendship product. | Rebuilt the page around why Niva, member journey, plan format, circles, safety, hosts, beta basics, and a closing conversion path. |
| P1 | The previous phone hero clipped the brand area and did not make the mobile menu clear. | Reworked header spacing, added a distinct Menu control, and validated the closed state at `390 x 844`. |
| P1 | The app stopped at a visually generic sign-in flow, so it did not demonstrate the product after authentication. | Added the member dashboard, Explore, Plans, Profile, activity detail, notifications surface, and request-to-join confirmation. |
| P1 | Flutter's web document did not declare a responsive viewport. | Added the viewport meta tag and rebuilt the web bundle; the final phone captures no longer crop the app shell. |
| P2 | Image overlays used gradients, which competed with the editorial system and were unnecessary. | Replaced them with restrained solid scrims and readable flat labels. |

## Interaction Checks

- The website navigation exposes Why Niva, How it works, Safety, and For hosts.
- The hero request button opens the beta form, with city and participation intent.
- The beta form has an explicit prototype-only success state; it does not claim to send data.
- The app accepts a phone-shaped value, shows the six-digit code screen, opens the dashboard after six digits, opens an activity detail, and opens the join-request confirmation.

## Product Honesty

The website and member screens now tell the intended Niva product story, but the
sample activities and the post-code transition are local UI data in this
checkout. They need the Firebase/API integrations in the production launch
guide before they can represent live membership, verification, events, or
join decisions.

## Remaining Launch QA

1. Connect the website beta form to a real, consented waitlist endpoint and add a privacy notice adjacent to submission.
2. Run the mobile app on physical Android devices with real text scaling, keyboard, low bandwidth, and image-upload states.
3. Validate the actual Firebase verification and join-request responses once those integrations exist.
4. Replace sample activity data with reviewed Bangalore inventory before beta invitations.

Final result: passed for the current local website and app prototype; production integration validation remains pending.
