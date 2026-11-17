/**
 * Razorpay integration for parent → school fee payments
 * and school → Doveryet subscription payments.
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "./db";

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create a Razorpay order for an invoice payment.
 */
export async function createOrderForInvoice(invoiceId: string, schoolId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: { student: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const amountDue = invoice.total - invoice.amountPaid;
  if (amountDue <= 0) throw new Error("Nothing to pay");

  const order = await rzp.orders.create({
    amount: amountDue,
    currency: "INR",
    receipt: invoice.invoiceNumber,
    notes: {
      invoiceId: invoice.id,
      schoolId,
      studentId: invoice.studentId,
    },
  });

  const payment = await db.payment.create({
    data: {
      schoolId,
      invoiceId,
      amount: amountDue,
      method: "UPI",
      status: "PENDING",
      razorpayOrderId: order.id,
    },
  });

  return { order, payment };
}

/**
 * Verify a Razorpay signature from the client checkout callback.
 */
export function verifyPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  return expected === args.signature;
}

/**
 * Confirm a payment after successful checkout. Updates invoice amountPaid
 * and status atomically.
 */
export async function capturePayment(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const ok = verifyPaymentSignature({
    orderId: args.razorpayOrderId,
    paymentId: args.razorpayPaymentId,
    signature: args.signature,
  });
  if (!ok) throw new Error("Invalid signature");

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { razorpayOrderId: args.razorpayOrderId },
    });
    if (!payment) throw new Error("Payment not found");

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        razorpayId: args.razorpayPaymentId,
        status: "CAPTURED",
        paidAt: new Date(),
      },
    });

    if (payment.invoiceId) {
      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice) {
        const newPaid = invoice.amountPaid + payment.amount;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaid,
            status: newPaid >= invoice.total ? "PAID" : "PARTIAL",
          },
        });
      }
    }

    return updated;
  });
}

/**
 * Webhook signature verification.
 */
export function verifyWebhook(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
