import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  sendEmail,
  buildConfirmationEmail,
  buildAdminNotificationEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, body, email } = await req.json();

    // Validate
    if (!name?.trim() || !body?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (name.length > 64) return NextResponse.json({ error: "Name too long." }, { status: 400 });
    if (body.length > 1000) return NextResponse.json({ error: "Vouch too long (max 1000 chars)." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Insert vouch
    const { data, error } = await supabase
      .from("vouches")
      .insert([{ name: name.trim(), body: body.trim(), email: email.trim().toLowerCase() }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save vouch." }, { status: 500 });
    }

    const siteUrl = "https://www.greencat777.xyz";

    // Send confirmation email to submitter
    await sendEmail({
      to: email.trim().toLowerCase(),
      subject: "Confirm your vouch on greencat777.xyz",
      html: buildConfirmationEmail({
        name: name.trim(),
        body: body.trim(),
        token: data.confirm_token,
        siteUrl,
      }),
    });

    // Send admin notification
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `New vouch from ${name.trim()}`,
      html: buildAdminNotificationEmail({
        name: name.trim(),
        body: body.trim(),
        vouchId: data.id,
        siteUrl,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Vouch submission error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
