import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, action_type, action_token_expires")
      .eq("action_token", token)
      .single();

    if (error || !profile || profile.action_type !== "reset_password") {
      return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    }
    if (!profile.action_token_expires || new Date(profile.action_token_expires) < new Date()) {
      return NextResponse.json({ error: "This link has expired." }, { status: 404 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, { password });
    if (updateError) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    await supabase
      .from("profiles")
      .update({ action_token: null, action_token_expires: null, action_type: null })
      .eq("id", profile.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset-password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
