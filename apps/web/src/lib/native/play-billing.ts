"use client";

// Bridge to the native PlayBilling plugin in the Android app
// (android/app/src/main/java/com/golden/cooking/PlayBillingPlugin.java). The Android app loads the
// live site in a Capacitor WebView, so this code runs there with the native bridge available.
// In a normal browser the plugin doesn't exist and Golden uses Whop instead.

import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PlayProductDetails } from "@/lib/billing/play-products";

export interface PlayPurchase {
  purchaseToken: string;
  products: string[];
  orderId?: string;
  /** 1 = purchased, 2 = pending. */
  purchaseState: number;
  acknowledged: boolean;
}

interface PlayBillingPlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: PlayProductDetails[] }>;
  purchase(options: { productId: string; offerToken: string; accountId: string }): Promise<PlayPurchase>;
  getPurchases(): Promise<{ purchases: PlayPurchase[] }>;
}

export const PlayBilling = registerPlugin<PlayBillingPlugin>("PlayBilling");

/** True inside Golden's Android app, where subscriptions must go through Google Play. */
export const playBillingAvailable = () => Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("PlayBilling");

/** Error codes the native plugin rejects with. */
export const PLAY_CANCELLED = "USER_CANCELED";
