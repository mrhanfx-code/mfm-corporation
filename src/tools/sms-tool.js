// SMS Tool — send SMS via Twilio REST API
// Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, CEO_PHONE_NUMBER

import { logger } from '../core/logger.js';

const TWILIO_BASE = 'https://api.twilio.com/2010-04-01';

export async function sendSMS(to, message, env) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    logger.warn('sms-tool', 'twilio_not_configured', {});
    return null;
  }
  const recipient = to || env.CEO_PHONE_NUMBER;
  if (!recipient) {
    logger.warn('sms-tool', 'no_recipient', {});
    return null;
  }
  try {
    const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const body = new URLSearchParams({
      To:   recipient,
      From: env.TWILIO_FROM_NUMBER,
      Body: message.slice(0, 1600)
    });
    const res = await fetch(
      `${TWILIO_BASE}/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twilio ${res.status}: ${err}`);
    }
    const data = await res.json();
    logger.info('sms-tool', 'sms_sent', { sid: data.sid, to: recipient });
    return `SMS sent (SID: ${data.sid})`;
  } catch (err) {
    logger.error('sms-tool', 'sms_failed', { error: err.message });
    return null;
  }
}

// ─── CEO Critical Alert ────────────────────────────────────────────────────
// Use for circuit breaker open, system down, score <30 emergencies

export async function sendCriticalAlert(subject, detail, env) {
  const msg = `🚨 MFM ALERT: ${subject}\n${detail.slice(0, 200)}`;
  return await sendSMS(env.CEO_PHONE_NUMBER, msg, env);
}
