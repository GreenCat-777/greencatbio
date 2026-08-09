import { NextResponse } from "next/server";

// In-memory attempt tracker — resets on server restart
// For production persistence, use Redis or Supabase
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 4;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();

  const record = attempts.get(ip) || { count: 0, lockedUntil: 0 };

  // Check if locked out
  if (record.lockedUntil > now) {
    const remainingMins = Math.ceil((record.lockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${remainingMins} minute(s).`, locked: true },
      { status: 429 }
    );
  }

  // Reset count if lock expired
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }

  const { password, puzzle, puzzleAnswer } = await req.json();

  // Validate puzzle answer first (simple math puzzle)
  if (String(puzzleAnswer).trim() !== String(puzzle.answer).trim()) {
    record.count += 1;
    const remaining = MAX_ATTEMPTS - record.count;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCK_DURATION_MS;
      attempts.set(ip, record);
      return NextResponse.json(
        { error: "Too many failed attempts. Locked for 15 minutes.", locked: true },
        { status: 429 }
      );
    }

    attempts.set(ip, record);
    return NextResponse.json(
      { error: `Wrong answer to puzzle. ${remaining} attempt(s) remaining.`, remaining },
      { status: 401 }
    );
  }

  // Check password
  if (password !== process.env.ADMIN_SECRET) {
    record.count += 1;
    const remaining = MAX_ATTEMPTS - record.count;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCK_DURATION_MS;
      attempts.set(ip, record);
      return NextResponse.json(
        { error: "Too many failed attempts. Locked for 15 minutes.", locked: true },
        { status: 429 }
      );
    }

    attempts.set(ip, record);
    return NextResponse.json(
      { error: `Wrong password. ${remaining} attempt(s) remaining.`, remaining },
      { status: 401 }
    );
  }

  // Success — reset attempts
  attempts.delete(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", process.env.ADMIN_SECRET!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
