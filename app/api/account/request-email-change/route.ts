import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendEmail, buildAuthEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newEmail } = await req.json();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail || "")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    const target = newEmail.trim().toLowerCase();
    if (target === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "That's already your email." }, { status: 400 });
    }

    const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (usersPage?.users.some((u) => u.email?.toLowerCase() === target)) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 400 });
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    const { error } = await supabase
      .from("profiles")
      .update({ action_token: token, action_token_expires: expires, action_type: "change_email", pending_email: target })
      .eq("id", user.id);

    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

    try {
      await sendEmail({
        to: target,
        subject: "Confirm your new email — GreenCat777",
        html: buildAuthEmail({
          kind: "email_change",
          confirmationUrl: `https://www.greencat777.xyz/account/confirm-email?token=${token}`,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send email-change confirmation:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Request-email-change error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
