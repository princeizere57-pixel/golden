# Golden on iPhone and Android (Capacitor)

The native apps in `ios/` and `android/` are thin Capacitor shells around the live site (`server.url` in `capacitor.config.ts`). Push to GitHub → Vercel deploys → the apps show the update on next open. Only change the native projects for icons, splash screens, permissions or a new app version.

## One-time setup

| | Android | iPhone |
|---|---|---|
| Computer | Windows, Mac or Linux | **Mac only** (Apple requires Xcode) |
| Software | [Android Studio](https://developer.android.com/studio) (includes Java and the SDK) | Xcode from the Mac App Store |
| Store account | Google Play Console, $25 once | Apple Developer Program, $99/year |

After pulling the repo: `npm install`, then `npx cap sync` (copies the config into both projects).

## Android: test on a phone, then publish
1. `npx cap open android` opens the project in Android Studio.
2. Plug in an Android phone (USB debugging on) and press **Run** to install Golden on it.
3. To publish: **Build → Generate Signed App Bundle**, create a keystore (keep it safe: you need it for every update), and upload the `.aab` to the Play Console.

## iPhone: test, then publish (on a Mac)
1. `npx cap open ios` opens the project in Xcode.
2. Select the **App** target → **Signing & Capabilities** → choose your Apple team.
3. Plug in an iPhone and press **Run**.
4. To publish: **Product → Archive → Distribute App → App Store Connect**, then submit in App Store Connect.

## App identity
- App ID: `com.golden.cooking` (change in `capacitor.config.ts` before the first store upload; it can't change afterwards).
- Name: Golden. Replace the default icons with Golden's logo before publishing (`npx @capacitor/assets generate` from a 1024 px icon).

## Store rules to plan for
- **Subscriptions on iPhone:** Apple requires In-App Purchase for digital subscriptions bought inside an iOS app. The Whop checkout must not be offered inside the iPhone app (or Golden must add Apple In-App Purchase). The Golden codebase already has App Store server notifications (`/api/billing/app-store/notifications`). Google Play has a similar rule; check its current billing policy for your countries.
- **"Just a website" rejections:** Apple can reject apps that only wrap a website (guideline 4.2). Native touches help: push notifications for timers, haptics, offline fallback (already included), and a native share sheet.
- **Sign in with Google:** Apple requires offering Sign in with Apple when an iOS app offers Google sign-in.
