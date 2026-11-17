import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health check for uptime monitors (BetterStack, UptimeRobot).
 * Returns 200 only if the database is reachable.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
