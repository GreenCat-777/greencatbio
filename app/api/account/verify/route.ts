import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const supabase = createServerSupabase();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, action_type, action_token_expires")
    .eq("action_token", token)
    .single();

  if (error || !profile || profile.action_type !== "verify_email") {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }
  if (!profile.action_token_expires || new Date(profile.action_token_expires) < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 404 });
  }

  await supabase
    .from("profiles")
    .update({ verified: true, action_token: null, action_token_expires: null, action_type: null })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true, username: profile.username });
}
