# Niva mobile product audit — 18 July 2026

## Verdict

The approved sapphire/porcelain direction is strong, but several supporting screens still behave like development utilities rather than a finished consumer product. The highest-impact work is simplifying Login, rebuilding Profile and host onboarding, fixing Android chat insets, removing duplicate Explore filters, and making artwork framing deterministic.

## Audited flow

1. **Home — needs refinement.** The greeting is too close to the Android status bar. The hero hierarchy is strong, but its image frame still relies on cover cropping.
2. **Explore — needs simplification.** All/Events/Circles duplicates the category-chip row. Activity type should move into one Filter sheet.
3. **Profile — redesign required.** The three metric boxes feel administrative, the public trust number is unexplained, and primary/account actions have no hierarchy.
4. **Settings — simplify.** Keep Notifications and Privacy. Move blocked members into Safety, group support/legal links under “Support & safety,” and remove product-behavior toggles such as circle-continuity suggestions.
5. **Cohort chat — functional fix required.** The header overlaps the Android status bar. The keyboard fully covers the message composer because Android receives no keyboard-avoidance behavior.
6. **Login — simplify.** “Continue securely” is vague and the legal/SMS copy dominates. Use “Continue with phone,” one benefit line, and one concise SMS/legal line.
7. **Host pathway — redesign required.** “Request host access” currently submits immediately. It should open an explanatory “Host with Niva” journey with benefits, eligibility, responsibilities, review timing, and an explicit Apply action.

## Recommended product decisions

- Add `Photography` to the standard interest taxonomy.
- Keep custom interests under Other, but disable autocomplete/autocorrect on that field.
- Replace `Help and legal` with `Support & safety` or `Support & policies`.
- Add a concise Community Promise: be kind and inclusive; respect consent and boundaries; show up or cancel early; no harassment, spam, or pressure to move off-platform.
- Expand shimmer skeletons beyond Home to Explore, Plans, activity details, and chat.

## Trust score as currently implemented

The score is an uncapped sum of events:

- Phone verified: +15
- Google linked: +5
- Username set: +5
- Profile completed: +10
- Self-declaration accepted: +10
- Selfie approved: +25
- Event attended: +5
- Feedback submitted: +2
- No-show: -10
- Confirmed report: -50

The QA account displays 40 because phone verification (15), username (5), profile completion (10), and self-declaration (10) total 40.

Current tiers:

- New: default
- Basic verified: phone + self-declaration + approved selfie
- Trusted: verified and score >= 85
- Host eligible: verified and score >= 120

There are no special 60 or 100 thresholds, and the score can exceed 100. That makes a public number misleading. Recommended V1 approach: keep points internal and show understandable public evidence such as Profile verified, plans attended, reliable attendance, and host status. Provide a private “How trust works” progress view.

## Artwork framing recommendation

`resizeMode="cover"` necessarily crops whenever the source and frame aspect ratios differ. Use separate 4:5 card and 16:9/detail variants, add a crop preview for host uploads, and store a focal point for custom images. A focal-position-aware image component such as `expo-image` can keep faces and key subjects inside each frame.

## Evidence limits

The screenshots prove visible hierarchy, spacing, filter duplication, safe-area overlap, and keyboard coverage. They do not establish full accessibility compliance; TalkBack order, dynamic-type scaling, contrast calculations, and reduced-motion behavior still require dedicated testing.
