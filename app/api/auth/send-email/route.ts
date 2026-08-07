import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendEmail, buildAuthEmail } from "@/lib/email";

const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET!;

type HookPayload = {
  user: { email: string };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: "signup" | "recovery" | "email_change" | "magiclink" | "invite";
  };
};

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your GreenCat777 account",
  recovery: "Reset your GreenCat777 password",
  email_change: "Confirm your new email — GreenCat777",
};

export async function POST(req: Request) {
  const rawBody = await req.text();

  const wh = new Webhook(hookSecret);
  let payload: HookPayload;
  try {
    payload = wh.verify(rawBody, {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
    }) as HookPayload;
  } catch {
    return NextResponse.json(
      { error: { http_code: 401, message: "Invalid webhook signature." } },
      { status: 401 }
    );
  }

  const { user, email_data } = payload;
  const { token_hash, redirect_to, email_action_type } = email_data;

  // Only signup / recovery / email_change are used by this app.
  if (!SUBJECTS[email_action_type]) {
    return NextResponse.json({ ok: true }); // nothing to send, don't error out
  }

  const confirmationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

  try {
    await sendEmail({
      to: user.email,
      subject: SUBJECTS[email_action_type],
      html: buildAuthEmail({
        kind: email_action_type as "signup" | "recovery" | "email_change",
        confirmationUrl,
      }),
    });
  } catch (err) {
    console.error("Failed to send auth email:", err);
    return NextResponse.json(
      { error: { http_code: 500, message: "Failed to send email." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
