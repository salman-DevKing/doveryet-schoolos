/**
 * UPI intent URL generator.
 * Generates deep-link URLs that open GPay, PhonePe, Paytm, or any UPI app
 * with payee, amount, and note pre-filled.
 */

export interface UpiIntentArgs {
  /** School's UPI VPA, e.g. "principal@okaxis" */
  vpa: string;
  /** Payee name (school name) */
  payeeName: string;
  /** Amount in rupees (not paise) */
  amountInr: number;
  /** Transaction note (invoice number) */
  note: string;
  /** Optional currency; defaults to INR */
  currency?: string;
}

/**
 * Generic UPI URI — all UPI apps handle `upi://pay?...`.
 */
export function upiIntentUrl(args: UpiIntentArgs): string {
  const params = new URLSearchParams({
    pa: args.vpa,
    pn: args.payeeName,
    am: args.amountInr.toFixed(2),
    cu: args.currency ?? "INR",
    tn: args.note,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Google Pay — accepts the generic UPI URL on Android,
 * and tez://upi/pay on iOS.
 */
export function gpayUrl(args: UpiIntentArgs): string {
  return upiIntentUrl(args);
}

/**
 * PhonePe
 */
export function phonepeUrl(args: UpiIntentArgs): string {
  const params = new URLSearchParams({
    pa: args.vpa,
    pn: args.payeeName,
    am: args.amountInr.toFixed(2),
    cu: args.currency ?? "INR",
    tn: args.note,
  });
  return `phonepe://pay?${params.toString()}`;
}

/**
 * Paytm
 */
export function paytmUrl(args: UpiIntentArgs): string {
  const params = new URLSearchParams({
    pa: args.vpa,
    pn: args.payeeName,
    am: args.amountInr.toFixed(2),
    cu: args.currency ?? "INR",
    tn: args.note,
  });
  return `paytmmp://pay?${params.toString()}`;
}

/**
 * Generate a QR code payload (same format as the intent URL).
 * Pass this to a QR library like `qrcode` to render an SVG/PNG.
 */
export function qrPayload(args: UpiIntentArgs): string {
  return upiIntentUrl(args);
}
