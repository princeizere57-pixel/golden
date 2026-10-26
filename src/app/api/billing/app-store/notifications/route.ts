import { NextResponse, type NextRequest } from "next/server";
import { JwsError, appStoreStatus, verifyAppleJws } from "@/lib/billing/app-store";
import { saveSubscription } from "@/lib/billing/subscriptions";

interface NotificationPayload {
  notificationType: string;
  subtype?: string;
  data?: { bundleId?: string; signedTransactionInfo?: string };
}

interface TransactionInfo {
  originalTransactionId: string;
  appAccountToken?: string;
  expiresDate?: number;
}

/** App Store Server Notifications V2: POST { signedPayload }. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { signedPayload?: string } | null;
  if (!body?.signedPayload) return NextResponse.json({ error: "signedPayload is required" }, { status: 400 });
  try {
    const note = verifyAppleJws<NotificationPayload>(body.signedPayload);
    const bundleId = process.env.APPLE_BUNDLE_ID;
    if (bundleId && note.data?.bundleId !== bundleId) return NextResponse.json({ error: "Wrong bundle" }, { status: 400 });
    const status = appStoreStatus(note.notificationType, note.subtype);
    if (status && note.data?.signedTransactionInfo) {
      const tx = verifyAppleJws<TransactionInfo>(note.data.signedTransactionInfo);
      await saveSubscription({
        provider: "app_store",
        externalId: tx.originalTransactionId,
        status,
        // The app sets appAccountToken to the Supabase user ID at purchase time.
        userId: tx.appAccountToken,
        currentPeriodEnd: tx.expiresDate ? new Date(tx.expiresDate).toISOString() : undefined,
      });
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof JwsError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
