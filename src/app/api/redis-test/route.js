import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Temporary route to check the Redis connection.
// Open /api/redis-test in your browser, then DELETE this file.

export const dynamic = "force-dynamic";

const redis = Redis.fromEnv();

export async function GET() {
  try {
    await redis.set("item", "hello from redis");
    const result = await redis.get("item");
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}