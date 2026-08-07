import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendEmail, buildAccessEmail } from "@/lib/email";

const VALID_ACTIONS = ["delete", "export", "edit"] as const;
type Action = (typeof VALID_ACTIONS)[number];

export async function POST(req: Request) {
  try {
    const { vouchId, email, action } = await req.json();

    if (!vouchId || !email?.trim() || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: vouch } = await supabase
      .from("vouches")
      .select("id, name, email")
      .eq("id", vouchId)
      .single();

    // Always respond the same way whether or not this matched, so we don't
    // leak which emails are tied to which vouches.
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If that email matches this vouch, a verification link is on its way.",
    });

    if (!vouch || vouch.email.toLowerCase() !== email.trim().toLowerCase()) {
      return genericResponse;
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: updateError } = await supabase
      .from("vouches")
      .update({
        access_token: token,
        access_token_expires: expires,
        access_action: action as Action,
      })
      .eq("id", vouch.id);

    if (updateError) {
      console.error("Failed to set access token:", updateError);
      return genericResponse;
    }

    try {
      await sendEmail({
        to: vouch.email,
        subject:
          action === "delete"
            ? "Confirm vouch deletion — greencat777.xyz"
            : action === "export"
            ? "Your vouch data — greencat777.xyz"
            : "Edit your vouch — greencat777.xyz",
        html: buildAccessEmail({
          name: vouch.name,
          action: action as Action,
          token,
          siteUrl: "https://www.greencat777.xyz",
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send access email:", emailErr);
    }

    return genericResponse;
  } catch (err) {
    console.error("Request-access error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
