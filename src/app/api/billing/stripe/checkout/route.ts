import { NextResponse, type NextRequest } from "next/server";
import { routeEntity, type Interval } from "@/lib/billing/routing";
import { createCheckoutSession, stripePriceId } from "@/lib/billing/stripe";

/**
 * POST { country, interval, userId, email? } → { url } of a Stripe Checkout Session on the
 * entity that serves that billing country. Stripe collects and confirms the address itself.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { country?: string; interval?: Interval; userId?: string; email?: string } | null;
  if (!body?.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const interval: Interval = body.interval === "month" ? "month" : "year";
  const { entity } = routeEntity(body.country ?? req.headers.get("x-vercel-ip-country"));
  const priceId = stripePriceId(entity, interval);
  if (!priceId) return NextResponse.json({ error: `No ${interval} price configured for the ${entity.toUpperCase()} entity` }, { status: 503 });
  const origin = req.nextUrl.origin;
  try {
    const url = await createCheckoutSession({
      entity,
      priceId,
      userId: body.userId,
      email: body.email,
      successUrl: `${origin}/account?trial=started`,
      cancelUrl: `${origin}/premium`,
    });
    return NextResponse.json({ url, entity });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
