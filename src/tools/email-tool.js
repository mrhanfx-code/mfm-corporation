// Email tool — Resend send

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(to, subject, body, env) {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  if (!to || !EMAIL_RE.test(to)) return { ok: false, error: 'Invalid recipient email' };
  if (!subject || subject.length > 200) return { ok: false, error: 'Subject missing or too long (max 200 chars)' };
  if (!body || body.length > 50000) return { ok: false, error: 'Body missing or too long (max 50KB)' };

  const payload = {
    from: 'support@mfm-corp.cc.cd',
    to: to,
    subject: subject,
    text: body,
    reply_to: env.USER_EMAIL || to
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return { ok: res.ok, status: res.status };
}
