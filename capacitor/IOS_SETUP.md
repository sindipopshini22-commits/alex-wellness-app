# Capacitor iOS Configuration

## Production checklist (do these BEFORE `npx cap sync ios`)

1. `npx cap add ios` — generates the iOS shell
2. Open `ios/App/App/Info.plist` and merge the contents of `ios-info-plist-patch.xml`
3. Open `ios/App/App/capacitor.config.json` (auto-generated, no manual changes needed)
4. In Xcode → Signing & Capabilities, set your Team and Bundle Identifier
5. Set Deployment Target to iOS 16.0 or later
6. Archive and ship via Xcode → Organizer

## Required Info.plist additions

```xml
<!-- Required for the app to reach your /api endpoints when in the web view -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>alex.yourcompany.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>

<!-- Microphone for voice view -->
<key>NSMicrophoneUsageDescription</key>
<string>Alex uses your microphone to transcribe your voice in real time. Audio is processed but never stored.</string>

<!-- Speech recognition disclosure -->
<key>NSSpeechRecognitionUsageDescription</key>
<string>Alex uses on-device speech recognition only to transcribe what you say. Nothing is sent to Apple without your consent.</string>

<!-- Apple-required health/wellness disclosures (we use neither, but say so explicitly) -->
<key>NSHealthShareUsageDescription</key>
<string>Alex does not access Apple Health data.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Alex does not write to Apple Health.</string>

<!-- Camera is NOT used -->
<key>NSCameraUsageDescription</key>
<string>Alex does not use the camera.</string>

<!-- Background audio for live voice view -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>remote-notification</string>
</array>
```

## Production server.url

Before shipping, edit `capacitor.config.ts` and change:
```typescript
server: {
  url: "https://api.alex.yourcompany.com",  // <-- your real domain
  cleartext: false
}
```

Then `npx cap sync ios` and rebuild.
