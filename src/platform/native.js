// Puente a plugins nativos (solo en builds Capacitor via esbuild). En web se sustituye por native.web.js.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { AdMob } from "@capacitor-community/admob";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { InAppReview } from "@capacitor-community/in-app-review";
export const native = { isNative: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform(), Preferences, Haptics, ImpactStyle, NotificationType, LocalNotifications, App, AdMob, Purchases, FirebaseAnalytics: null /* se activa al crear el proyecto Firebase */, InAppReview };
