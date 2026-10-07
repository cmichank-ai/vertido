# Runbook de publicación

## Secretos de GitHub (Settings → Secrets → Actions)
Android: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON` (cuenta de servicio con rol Release manager en Play Console).
iOS: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT` (.p8 en base64), `MATCH_GIT_URL` (repo privado de certificados), `MATCH_PASSWORD`, `MATCH_GIT_BASIC_AUTHORIZATION`.

## Crear el keystore (una vez, en la Mac)
`keytool -genkeypair -v -keystore vertido.keystore -alias vertido -keyalg RSA -keysize 2048 -validity 10000` → `base64 -i vertido.keystore | pbcopy`.

## Primer certificado iOS (una vez)
`fastlane match init` → repo privado; `fastlane match appstore`.

## Flujo
1. `git tag v0.5.0 && git push --tags` → workflows `android-beta` e `ios-beta` suben a pista interna y TestFlight.
2. Probar; `fastlane android release` promueve a producción al 10 %.
3. APK de debug para probar sin firmar: workflow `android-debug-apk` (artefacto descargable).

## IDs reales (no en el repo)
AdMob: sustituir `APPLICATION_ID` en AndroidManifest y `GADApplicationIdentifier` en Info.plist; las unidades van por config remota `ads.ids`. RevenueCat: `iap.keys` por config remota.
