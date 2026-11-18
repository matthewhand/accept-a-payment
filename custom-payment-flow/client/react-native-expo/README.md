# Accept a payment in React Native with Expo

The sample uses Expo SDK 58 and the Stripe React Native SDK on Android and iOS.
Use Node.js 24.22.1 or newer in the 24.x line.

1. Start one of the [custom payment flow servers](../../server) with Stripe test
   credentials.
2. In this directory, run `npm ci` and `npm start`. Open the project with the
   matching SDK version of Expo Go for standard test cards, or run a development
   build with `npx expo run:android` or `npx expo run:ios` to exercise the
   `accept-a-payment://` return URL for redirect-based authentication.

The Android emulator uses `http://10.0.2.2:4242` and the iOS simulator uses
`http://localhost:4242`. On a physical device, set `EXPO_PUBLIC_API_URL` in
`.env.local` to the server URL reachable by the device. Store Stripe secret keys
on the server. Use the [HTML sample](../html) for browser payments.

Run `npm run typecheck` and `npx expo export --platform android` or
`npx expo export --platform ios` to validate the sample without Stripe
credentials. The manual **React Native Android e2e tests** workflow exercises
successful and declined Stripe test cards with
`TEST_STRIPE_PUBLISHABLE_KEY` and `TEST_STRIPE_SECRET_KEY` repository secrets.
