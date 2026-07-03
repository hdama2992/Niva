# Niva Mobile

Flutter mobile application for Niva.

Run it from the repository root with:

```bash
cd apps/mobile
flutter pub get
flutter run
```

The mobile app stays outside the JavaScript workspace scripts because Flutter
needs a connected simulator or device, while the admin and backend run with
`pnpm dev`.
