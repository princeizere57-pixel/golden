// Pricing and entity routing. Figures are planning estimates, not quotes: check each
// processor's current pricing before relying on them.

import type { BillingEntity } from "@/lib/types";

export type Currency = "usd" | "gbp";
export type Interval = "year" | "month";
export type Channel = "web" | "app_store" | "google_play";

export interface Price {
  interval: Interval;
  currency: Currency;
  /** Minor units (cents / pence). */
  amount: number;
}

/** GBP prices are set on their own, never converted on the fly. */
export const PRICES: Record<Currency, Record<Interval, Price>> = {
  usd: {
    year: { interval: "year", currency: "usd", amount: 4500 },
    month: { interval: "month", currency: "usd", amount: 799 },
  },
  gbp: {
    year: { interval: "year", currency: "gbp", amount: 3999 },
    month: { interval: "month", currency: "gbp", amount: 699 },
  },
};

export const TRIAL_DAYS = 7;

export interface EntityConfig {
  entity: BillingEntity;
  currency: Currency;
  /** Card processing estimate: percentage + fixed fee in minor units. */
  cardFee: { percent: number; fixed: number };
  paymentMethods: string[];
}

export const ENTITIES: Record<BillingEntity, EntityConfig> = {
  us: {
    entity: "us",
    currency: "usd",
    cardFee: { percent: 2.9, fixed: 30 },
    paymentMethods: ["card", "apple_pay", "google_pay"],
  },
  uk: {
    entity: "uk",
    currency: "gbp",
    cardFee: { percent: 1.5, fixed: 20 },
    paymentMethods: ["card", "pay_by_bank"],
  },
};

/** Small-business programme commission on in-app purchases. */
export const STORE_COMMISSION_PERCENT = 15;

/** GB billing addresses go to the UK entity; everyone else goes to the US entity. */
export function routeEntity(country: string | null | undefined): EntityConfig {
  const code = (country ?? "").trim().toUpperCase();
  return code === "GB" || code === "UK" ? ENTITIES.uk : ENTITIES.us;
}

export function priceFor(country: string | null | undefined, interval: Interval): { entity: EntityConfig; price: Price } {
  const entity = routeEntity(country);
  return { entity, price: PRICES[entity.currency][interval] };
}

/** Estimated fee and net, in minor units, for one charge through a channel. */
export function estimateNet(price: Price, channel: Channel, entity: EntityConfig = price.currency === "gbp" ? ENTITIES.uk : ENTITIES.us) {
  const fee =
    channel === "web"
      ? Math.round((price.amount * entity.cardFee.percent) / 100) + entity.cardFee.fixed
      : Math.round((price.amount * STORE_COMMISSION_PERCENT) / 100);
  return { gross: price.amount, fee, net: price.amount - fee };
}

/** Annual price as a saving against twelve monthly payments, in whole percent. */
export function annualSavingPercent(currency: Currency): number {
  const { year, month } = PRICES[currency];
  return Math.round((1 - year.amount / (month.amount * 12)) * 100);
}

export function formatMoney(price: Pick<Price, "amount" | "currency">): string {
  return new Intl.NumberFormat(price.currency === "gbp" ? "en-GB" : "en-US", {
    style: "currency",
    currency: price.currency.toUpperCase(),
  }).format(price.amount / 100);
}
