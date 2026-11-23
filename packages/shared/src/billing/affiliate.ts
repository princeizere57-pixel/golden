// Whop affiliates: an affiliate's link to Golden carries `?a=<their Whop username>`. The web keeps it
// in a cookie for 30 days (newest link wins) and checkout hands it to Whop, which credits the sale.
export const AFFILIATE_COOKIE = "bac-aff";
export const AFFILIATE_DAYS = 30;
const AFFILIATE_CODE = /^[A-Za-z0-9_.-]{1,40}$/;

export const isAffiliateCode = (value: unknown): value is string => typeof value === "string" && AFFILIATE_CODE.test(value);
