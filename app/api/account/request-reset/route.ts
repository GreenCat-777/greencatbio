import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendEmail, buildAuthEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const target = email.trim().toLowerCase();

    // Always the same response, whether or not the email matched, so we
    // don't leak which addresses have accounts.
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If that email has an account, a reset link is on its way.",
    });

    const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 200 });
    const user = usersPage?.users.find((u) => u.email?.toLowerCase() === target);
    if (!user) return genericResponse;

    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    await supabase
      .from("profiles")
      .update({ action_token: token, action_token_expires: expires, action_type: "reset_password" })
      .eq("id", user.id);

    try {
      await sendEmail({
        to: target,
        subject: "Reset your GreenCat777 password",
        html: buildAuthEmail({
          kind: "recovery",
          confirmationUrl: `https://www.greencat777.xyz/pm/reset?token=${token}`,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
    }

    return genericResponse;
  } catch (err) {
    console.error("Request-reset error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
