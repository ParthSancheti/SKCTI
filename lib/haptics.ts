"use client";

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * SKCTI haptics.
 *
 * WHAT WAS WRONG
 * --------------
 * 1. `vibrate()` in lib/store.tsx uses `navigator.vibrate`. That API does not
 *    exist on iOS Safari or in an iOS WKWebView — so on every iPhone the app
 *    has had ZERO haptics, silently. @capacitor/haptics was installed and only
 *    used in one file (HapticRouter).
 * 2. Durations were wrong. The codebase calls `vibrate(50)` on ordinary taps
 *    (TitleBar, home, settings) and `vibrate(100)` on the settings easter egg.
 *    A native iOS/Android tap is 8–15ms. 50ms reads as a notification buzz;
 *    users describe it as "the app is vibrating at me".
 * 3. No semantic layering — a tab switch, a coin award and an error all felt
 *    identical, so the haptics carried no information.
 *
 * USAGE
 * -----
 *   import { haptic } from "@/lib/haptics";
 *   haptic.tap();       // any button, tab, chip
 *   haptic.select();    // toggles, pickers, filter chips
 *   haptic.impact();    // committing an action — publish, submit
 *   haptic.success();   // coins earned, test marked done, streak extended
 *   haptic.warning();   // validation failed
 *   haptic.error();     // request failed
 */

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Web fallback. Silently no-ops on iOS Safari, which is correct. */
function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* some browsers throw when the page isn't user-activated */
  }
}

/**
 * Haptics must never block the UI and must never throw. Every call is
 * fire-and-forget with a swallowed rejection.
 */
function fire(nativeFn: () => Promise<void>, webPattern: number | number[]) {
  if (isNative()) {
    nativeFn().catch(() => webVibrate(webPattern));
  } else {
    webVibrate(webPattern);
  }
}

export const haptic = {
  /** Lightest possible. Tabs, list rows, chips, back buttons. */
  tap: () => fire(() => Haptics.impact({ style: ImpactStyle.Light }), 8),

  /** Selection changed — toggles, segmented controls, stream picker. */
  select: () => fire(() => Haptics.selectionChanged(), 5),

  /** A real action landed — publish, save, send. */
  impact: () => fire(() => Haptics.impact({ style: ImpactStyle.Medium }), 14),

  /** Heavy — destructive confirm, long-press menu open. */
  heavy: () => fire(() => Haptics.impact({ style: ImpactStyle.Heavy }), 22),

  /** Coins earned, task done, streak extended, test marked complete. */
  success: () =>
    fire(() => Haptics.notification({ type: NotificationType.Success }), [10, 40, 14]),

  /** Form validation failed. */
  warning: () =>
    fire(() => Haptics.notification({ type: NotificationType.Warning }), [14, 60, 14]),

  /** Network/permission failure. */
  error: () =>
    fire(() => Haptics.notification({ type: NotificationType.Error }), [18, 50, 18, 50, 18]),
};

/**
 * Drop-in replacement for the old `vibrate(ms)` so you can migrate gradually
 * without touching all 40+ call sites at once. It maps the old millisecond
 * argument onto the right semantic haptic instead of buzzing for 50ms.
 *
 * In lib/store.tsx, replace the existing `vibrate` and `triggerHaptic`
 * exports with these two lines:
 *
 *   export { vibrate, triggerHaptic } from "./haptics";
 */
export function vibrate(ms: number = 10) {
  if (ms <= 12) return haptic.tap();
  if (ms <= 30) return haptic.impact();
  return haptic.heavy();
}

export function triggerHaptic(pattern: number | number[] = 10) {
  if (Array.isArray(pattern)) return haptic.success();
  return vibrate(pattern);
}
