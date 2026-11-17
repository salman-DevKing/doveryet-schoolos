/**
 * WhatsApp provider abstraction.
 * Default: WATI. Swap by setting WHATSAPP_PROVIDER and implementing a new client.
 */

import { db } from "./db";
import type { Message } from "@prisma/client";

export interface WhatsAppMessage {
  to: string; // E.164, e.g. "+919840012345"
  templateName: string;
  params?: Record<string, string>;
  body: string; // rendered body for logging
}

export interface WhatsAppProvider {
  send(msg: WhatsAppMessage): Promise<{ providerMsgId: string; cost: number }>;
  handleWebhook(payload: unknown): Promise<void>;
}

class WatiProvider implements WhatsAppProvider {
  private url: string;
  private token: string;

  constructor() {
    this.url = process.env.WATI_API_URL!;
    this.token = process.env.WATI_API_TOKEN!;
  }

  async send(msg: WhatsAppMessage) {
    const res = await fetch(
      `${this.url}/sendTemplateMessage?whatsappNumber=${encodeURIComponent(msg.to)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          template_name: msg.templateName,
          broadcast_name: msg.templateName,
          parameters: Object.entries(msg.params ?? {}).map(([name, value]) => ({ name, value })),
        }),
      },
    );
    if (!res.ok) throw new Error(`WATI send failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { messageId?: string };
    return { providerMsgId: data.messageId ?? "", cost: 100 }; // ₹1 per utility message (configurable)
  }

  async handleWebhook(payload: unknown) {
    // Parse WATI webhook: { eventType, messageId, status, timestamp }
    const p = payload as { messageId?: string; eventType?: string; timestamp?: string };
    if (!p.messageId) return;
    const field: "sentAt" | "deliveredAt" | "readAt" | null =
      p.eventType === "message" ? "sentAt" : p.eventType === "delivered" ? "deliveredAt" : p.eventType === "read" ? "readAt" : null;
    if (!field) return;
    await db.message.updateMany({
      where: { providerMsgId: p.messageId },
      data: {
        [field]: p.timestamp ? new Date(p.timestamp) : new Date(),
        status: field === "readAt" ? "READ" : field === "deliveredAt" ? "DELIVERED" : "SENT",
      },
    });
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  const name = process.env.WHATSAPP_PROVIDER ?? "wati";
  switch (name) {
    case "wati":
      return new WatiProvider();
    // Future: interakt, twilio
    default:
      throw new Error(`Unknown WhatsApp provider: ${name}`);
  }
}

/**
 * High-level helper used by server actions. Deducts from allowance,
 * records the message, and sends via the provider.
 */
export async function sendWhatsApp(args: {
  schoolId: string;
  to: string;
  templateName: string;
  params?: Record<string, string>;
  body: string;
}): Promise<Message> {
  const sub = await db.subscription.findUnique({ where: { schoolId: args.schoolId } });
  if (sub && sub.whatsappUsed >= sub.whatsappAllowance) {
    throw new Error("WhatsApp allowance exceeded. Top up to continue.");
  }

  const msg = await db.message.create({
    data: {
      schoolId: args.schoolId,
      channel: "WHATSAPP",
      to: args.to,
      templateName: args.templateName,
      body: args.body,
      status: "QUEUED",
    },
  });

  try {
    const provider = getWhatsAppProvider();
    const { providerMsgId, cost } = await provider.send({
      to: args.to,
      templateName: args.templateName,
      params: args.params,
      body: args.body,
    });

    const updated = await db.message.update({
      where: { id: msg.id },
      data: { providerMsgId, status: "SENT", sentAt: new Date(), cost },
    });

    await db.subscription.update({
      where: { schoolId: args.schoolId },
      data: { whatsappUsed: { increment: 1 } },
    });

    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return db.message.update({
      where: { id: msg.id },
      data: { status: "FAILED", errorMessage: message },
    });
  }
}
