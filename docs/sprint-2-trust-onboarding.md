# Sprint 2: Trust And Onboarding

## Goal

A verified phone user completes profile setup, accepts the community
self-declaration, and can browse Niva. Selfie review starts when she tries to
join an event or circle.

```text
Firebase phone identity -> Niva user -> username -> profile -> declaration -> browse -> join attempt -> selfie review -> basic verified
```

## Implemented backend pieces

- `User` now stores username, display name, provider flags, and
  self-declaration state.
- `UsernameReservation` protects unique usernames.
- `UserProfile` stores city, interests, bio, optional profile photo, and
  completeness.
- `SelfieVerification` stores the selfie review state and future vendor-ready
  check fields.
- `VerificationReview` is the manual-lite admin queue.
- `TrustEvent` stores private point events.
- `TrustProfile` stores private score, tier, and verification status.
- `Event`, `Circle`, membership, chat, feedback, notification, report, block,
  settings, emergency-contact, and connection models define the closed-beta MVP
  surface.

## Endpoints

### Set username

```http
POST /users/me/username
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{
  "username": "himaja"
}
```

Rules:

- 3-20 characters.
- Lowercase letters, numbers, and underscore only.
- Globally unique.

### Update profile

```http
PUT /users/me/profile
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{
  "displayName": "Himaja",
  "city": "Bangalore",
  "bio": "New to the city and looking for weekend activities.",
  "interests": ["Badminton", "Books", "Coffee"]
}
```

### Accept self-declaration

```http
POST /users/me/self-declaration
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{
  "accepted": true,
  "version": "v1"
}
```

### Submit selfie at join time

```http
POST /users/me/selfie
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{
  "selfieUrl": "https://storage.example/selfies/user.jpg"
}
```

This creates or updates a pending `VerificationReview`. The mobile app now
opens this only from a join attempt, not as a mandatory onboarding step.

### Admin review

```http
GET /admin/verification-reviews?status=PENDING
x-niva-admin-key: <NIVA_ADMIN_KEY>
```

```http
PATCH /admin/verification-reviews/<userId>
x-niva-admin-key: <NIVA_ADMIN_KEY>
Content-Type: application/json

{
  "status": "APPROVED",
  "reviewerId": "admin_1"
}
```

Approval records `SELFIE_APPROVED`, recalculates trust, and promotes the user to
`BASIC_VERIFIED` when phone verification and self-declaration are also present.

`NIVA_ADMIN_KEY` is a simple closed-beta shared secret for admin-only backend
routes. The admin dashboard sends it as the `x-niva-admin-key` header. The
dashboard displays the queue, but the backend owns the real approval/rejection,
trust score, and trust tier updates.

## Mobile flow

The Expo prototype now includes:

1. Login screen.
2. Phone OTP screen.
3. Username screen.
4. Profile setup screen.
5. Self-declaration screen.
6. Home/Profile state for browsing.
7. Join-triggered selfie upload screen.
8. Verification pending screen.
9. Join permissions blocked until approval.

## Product rule

Selfie check is for real-person, image-quality, and abuse-prevention review.
Niva must not infer gender from face, name, style, or appearance.

## Safety and foundation additions

Sprint 2 also defines:

- Report user, event, or circle.
- Block user.
- Community guidelines acceptance.
- Notification records.
- Settings.
- Optional emergency contact.
- Event/circle chat tables, limited to joined activities.
