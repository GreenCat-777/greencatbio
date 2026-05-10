const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "vouches@greencat777.xyz";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  return res.json();
}

export function buildConfirmationEmail({
  name,
  body,
  token,
  siteUrl,
}: {
  name: string;
  body: string;
  token: string;
  siteUrl: string;
}) {
  const confirmUrl = `${siteUrl}/vouches/confirm?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:2px solid #0ed145;border-radius:12px;background:#0a0a0a;box-shadow:0 0 30px rgba(14,209,69,0.3);">
        <tr>
          <td style="padding:32px 36px;border-bottom:1px solid rgba(14,209,69,0.2);">
            <p style="margin:0 0 4px;font-size:11px;color:rgba(14,209,69,0.5);letter-spacing:0.1em;">greencat777@bio:~$</p>
            <h1 style="margin:0;font-size:22px;color:#0ed145;letter-spacing:0.05em;text-shadow:0 0 12px rgba(14,209,69,0.5);">Confirm Your Vouch</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px;">
            <p style="color:rgba(14,209,69,0.85);font-size:14px;line-height:1.7;margin:0 0 20px;">Hey <strong style="color:#0ed145;">${name}</strong>,</p>
            <p style="color:rgba(14,209,69,0.7);font-size:14px;line-height:1.7;margin:0 0 24px;">You submitted a vouch on <strong style="color:#0ed145;">greencat777.xyz</strong>. Click the button below to confirm it's really you.</p>

            <div style="background:rgba(14,209,69,0.05);border:1px solid rgba(14,209,69,0.2);border-radius:8px;padding:16px 20px;margin:0 0 28px;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(14,209,69,0.4);letter-spacing:0.08em;">// YOUR VOUCH</p>
              <p style="margin:0;color:rgba(14,209,69,0.8);font-size:13px;line-height:1.6;white-space:pre-wrap;">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>

            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${confirmUrl}" style="display:inline-block;padding:12px 32px;border:2px solid #0ed145;border-radius:8px;color:#000;background:#0ed145;font-family:monospace;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.08em;box-shadow:0 0 20px rgba(14,209,69,0.4);">
                ✓ Confirm Vouch
              </a>
            </td></tr></table>

            <p style="color:rgba(14,209,69,0.35);font-size:12px;margin:24px 0 0;line-height:1.6;">
              If you didn't submit a vouch, ignore this email — nothing will happen.<br/>
              This link is valid for 7 days.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid rgba(14,209,69,0.15);">
            <p style="margin:0;font-size:11px;color:rgba(14,209,69,0.25);letter-spacing:0.05em;">greencat777.xyz // vouches system</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildAdminNotificationEmail({
  name,
  body,
  vouchId,
  siteUrl,
}: {
  name: string;
  body: string;
  vouchId: string;
  siteUrl: string;
}) {
  const adminUrl = `${siteUrl}/admin`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:2px solid #0ed145;border-radius:12px;background:#0a0a0a;box-shadow:0 0 30px rgba(14,209,69,0.3);">
        <tr>
          <td style="padding:32px 36px;border-bottom:1px solid rgba(14,209,69,0.2);">
            <p style="margin:0 0 4px;font-size:11px;color:rgba(14,209,69,0.5);letter-spacing:0.1em;">greencat777@bio:~$</p>
            <h1 style="margin:0;font-size:22px;color:#0ed145;letter-spacing:0.05em;text-shadow:0 0 12px rgba(14,209,69,0.5);">New Vouch Submitted</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px;">
            <p style="color:rgba(14,209,69,0.85);font-size:14px;line-height:1.7;margin:0 0 8px;"><span style="color:rgba(14,209,69,0.5);">from:</span> <strong style="color:#0ed145;">${name}</strong></p>
            <p style="color:rgba(14,209,69,0.5);font-size:12px;margin:0 0 20px;">vouch id: ${vouchId}</p>

            <div style="background:rgba(14,209,69,0.05);border:1px solid rgba(14,209,69,0.2);border-radius:8px;padding:16px 20px;margin:0 0 28px;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(14,209,69,0.4);letter-spacing:0.08em;">// VOUCH BODY</p>
              <p style="margin:0;color:rgba(14,209,69,0.8);font-size:13px;line-height:1.6;white-space:pre-wrap;">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>

            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${adminUrl}" style="display:inline-block;padding:12px 32px;border:2px solid #0ed145;border-radius:8px;color:#000;background:#0ed145;font-family:monospace;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.08em;box-shadow:0 0 20px rgba(14,209,69,0.4);">
                → Review in Dashboard
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid rgba(14,209,69,0.15);">
            <p style="margin:0;font-size:11px;color:rgba(14,209,69,0.25);letter-spacing:0.05em;">greencat777.xyz // admin notifications</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
