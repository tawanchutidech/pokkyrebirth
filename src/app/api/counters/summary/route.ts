import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { CounterEntry } from "@/data/counters";

const STORE_PATH = path.join(process.cwd(), ".data", "mock-kv.json");

export async function GET(request: NextRequest) {
  const guild = request.nextUrl.searchParams.get("guild");
  if (!guild) return NextResponse.json({ error: "missing guild" }, { status: 400 });

  let store: Record<string, unknown> = {};
  try {
    store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    /* no store yet */
  }

  const prefix = `counters:${guild}:`;
  const summary: Record<string, { published: number; pending: number }> = {};
  for (const [k, v] of Object.entries(store)) {
    if (!k.startsWith(prefix)) continue;
    const comp = k.slice(prefix.length);
    const entries = v as CounterEntry[];
    summary[comp] = {
      published: entries.filter((e) => e.status === "published").length,
      pending: entries.filter((e) => e.status === "pending").length,
    };
  }
  return NextResponse.json(summary);
}
