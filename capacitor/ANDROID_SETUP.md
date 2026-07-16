# Capacitor Android Configuration

## Production checklist (do these BEFORE `npx cap sync android`)

1. `npx cap add android` — generates the Android shell
2. Open `android/app/src/main/AndroidManifest.xml` and merge the contents of `android-manifest-patch.xml`
3. Create `android/app/src/main/res/xml/network_security_config.xml` with the contents of `network-security-config.xml`
4. Open `android/app/build.gradle` and set `minSdkVersion 24` or higher
5. `npx cap sync android`
6. Build with `./gradlew assembleRelease` or open in Android Studio

## Required AndroidManifest.xml additions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<application
    android:label="Alex"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config"
    android:allowBackup="false">

    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
        android:windowSoftInputMode="adjustResize">

        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>

        <!-- Universal Links for account-deletion flow -->
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="alex.yourcompany.com" />
        </intent-filter>
    </activity>
</application>
```

## network_security_config.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">alex.yourcompany.com</domain>
    </domain-config>
</network-security-config>
```

## Production server.url

Before shipping, edit `capacitor.config.ts` and change:
```typescript
server: {
  url: "https://api.alex.yourcompany.com",  // <-- your real domain
  cleartext: false
}
```

Then `npx cap sync android` and rebuild.
