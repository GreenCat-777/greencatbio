import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendEmail, buildAuthEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const uname = (username || "").trim();
    if (uname.length < 3 || uname.length > 24) {
      return NextResponse.json({ error: "Username must be 3–24 characters." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) {
      return NextResponse.json({ error: "Username: letters, numbers, underscores only." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", uname)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: "That username is taken." }, { status: 400 });
    }

    // Create the user pre-confirmed on Supabase's side — this never
    // triggers any Supabase auth email, so their rate limit is never hit.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      const msg = createError?.message || "Failed to create account.";
      return NextResponse.json({ error: msg.includes("already") ? "An account with that email already exists." : msg }, { status: 400 });
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: created.user.id,
        username: uname,
        verified: false,
        action_token: token,
        action_token_expires: expires,
        action_type: "verify_email",
      },
    ]);

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned account.
      await supabase.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: "Failed to create profile." }, { status: 500 });
    }

    try {
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: "Confirm your GreenCat777 account",
        html: buildAuthEmail({
          kind: "signup",
          confirmationUrl: `https://www.greencat777.xyz/pm/verify?token=${token}`,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
