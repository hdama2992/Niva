# Niva mobile UI flows

These flows run against the installed Android development build and the local
beta backend. They intentionally use a dedicated test phone number and never
submit a profile photo.

```sh
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$PATH:$HOME/.maestro/bin"
maestro test .maestro/login.yaml
maestro test .maestro/onboarding.yaml
maestro test .maestro/profile-photo-step.yaml
```

Prerequisites:

- `com.niva.niva` is installed on the target device.
- The device is connected through ADB.
- Metro and the backend are running and reachable by the device.
- The Niva development client is open in the foreground on the login screen.
- `EXPO_PUBLIC_AUTH_MODE=beta` is used for the deterministic OTP flow.
- For a wireless physical device, tunnel local services first with
  `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3001 tcp:3001`.
  If Metro is running on another port (for example the beta QA server on
  `8082`), reverse that port as well: `adb reverse tcp:8082 tcp:8082`.
