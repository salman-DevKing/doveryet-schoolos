import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook, capturePayment } from "@/lib/payments";

/**
 * Razorpay webhook — idempotent capture.
 * Configure in Razorpay dashboard with URL: https://your-domain/api/webhooks/razorpay
 * Events: payment.captured, payment.failed, refund.processed
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;

  try {
    if (event === "payment.captured") {
      const p = payload.payload.payment.entity;
      await capturePayment({
        razorpayOrderId: p.order_id,
        razorpayPaymentId: p.id,
        signature, // reuse — already verified
      });
    }
    // TODO: handle payment.failed, refund.processed
  } catch (err) {
    console.error("Webhook processing failed:", err);
    // Return 200 so Razorpay doesn't retry indefinitely for unrelated errors.
  }

  return NextResponse.json({ received: true });
}
