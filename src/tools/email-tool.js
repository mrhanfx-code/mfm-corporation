// Email tool — SendGrid send

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(to, subject, body, env) {
  if (!env.SENDGRID_API_KEY) return { ok: false, error: 'SENDGRID_API_KEY not set' };
  if (!to || !EMAIL_RE.test(to)) return { ok: false, error: 'Invalid recipient email' };
  if (!subject || subject.length > 200) return { ok: false, error: 'Subject missing or too long (max 200 chars)' };
  if (!body || body.length > 50000) return { ok: false, error: 'Body missing or too long (max 50KB)' };

  const payload = {
    personalizations: [{ to: [{ email: to }], subject }],
    from: { email: 'bot@mfm-corporation.com', name: 'MFM Corporation AI' },
    reply_to: { email: env.USER_EMAIL || to },
    content: [{ type: 'text/plain', value: body }]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return { ok: res.ok, status: res.status };
}
