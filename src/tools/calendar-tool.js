// Google Calendar Tool — create/read events via Google Calendar REST API
// Uses same service account as google-drive-tool.js
// Requires: GOOGLE_SERVICE_ACCOUNT_KEY (base64 JSON), GOOGLE_CALENDAR_ID

import { logger } from '../core/logger.js';

const CAL_API   = 'https://www.googleapis.com/calendar/v3';
const OAUTH_URL = 'https://oauth2.googleapis.com/token';
const SCOPES    = 'https://www.googleapis.com/auth/calendar';

// ─── Auth (same as Drive) ──────────────────────────────────────────────────

function base64url(data) {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getCalendarToken(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) return null;
  try {
    const sa  = JSON.parse(atob(env.GOOGLE_SERVICE_ACCOUNT_KEY));
    const now = Math.floor(Date.now() / 1000);
    const header  = { alg: 'RS256', typ: 'JWT' };
    const payload = { iss: sa.client_email, scope: SCOPES, aud: OAUTH_URL, iat: now, exp: now + 3600 };
    const h64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
    const p64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
    const sigInput = `${h64}.${p64}`;

    const pemKey = sa.private_key;
    const b64 = pemKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const bin = atob(b64);
    const der = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);

    const key = await crypto.subtle.importKey(
      'pkcs8', der.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput));
    const jwt = `${sigInput}.${base64url(sig)}`;

    const res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    logger.error('calendar-tool', 'auth_failed', { error: err.message });
    return null;
  }
}

function getCalId(env) {
  return env.GOOGLE_CALENDAR_ID || 'primary';
}

// ─── List upcoming events ─────────────────────────────────────────────────

export async function listCalendarEvents(env, maxResults = 10) {
  const token = await getCalendarToken(env);
  if (!token) return null;
  try {
    const now = new Date().toISOString();
    const res = await fetch(
      `${CAL_API}/calendars/${encodeURIComponent(getCalId(env))}/events?timeMin=${now}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Calendar list ${res.status}`);
    const data = await res.json();
    const events = (data.items || []).map(e => {
      const start = e.start?.dateTime || e.start?.date || 'Unknown';
      return `${start.slice(0, 16)}: ${e.summary || 'No title'}${e.location ? ` @ ${e.location}` : ''}`;
    });
    logger.info('calendar-tool', 'list_ok', { count: events.length });
    return events.join('\n') || 'No upcoming events';
  } catch (err) {
    logger.error('calendar-tool', 'list_failed', { error: err.message });
    return null;
  }
}

// ─── Create an event ──────────────────────────────────────────────────────

export async function createCalendarEvent(summary, startDatetime, endDatetime, description, attendees, env) {
  const token = await getCalendarToken(env);
  if (!token) return null;
  try {
    const event = {
      summary,
      description: description || '',
      start: { dateTime: startDatetime, timeZone: 'Asia/Kuala_Lumpur' },
      end:   { dateTime: endDatetime,   timeZone: 'Asia/Kuala_Lumpur' },
      ...(attendees?.length ? { attendees: attendees.map(e => ({ email: e })) } : {})
    };
    const res = await fetch(
      `${CAL_API}/calendars/${encodeURIComponent(getCalId(env))}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }
    );
    if (!res.ok) throw new Error(`Calendar create ${res.status}: ${await res.text()}`);
    const data = await res.json();
    logger.info('calendar-tool', 'create_ok', { eventId: data.id, summary });
    return `Event created: "${summary}" on ${startDatetime.slice(0, 16)} MYT (ID: ${data.id})`;
  } catch (err) {
    logger.error('calendar-tool', 'create_failed', { error: err.message });
    return null;
  }
}

// ─── Find a free slot ─────────────────────────────────────────────────────

export async function findFreeSlot(durationMinutes, withinDays, env) {
  const token = await getCalendarToken(env);
  if (!token) return 'Calendar not configured';
  try {
    const now  = new Date();
    const end  = new Date(now.getTime() + withinDays * 86400000);
    const res  = await fetch(`${CAL_API}/freeBusy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin: now.toISOString(),
        timeMax: end.toISOString(),
        timeZone: 'Asia/Kuala_Lumpur',
        items: [{ id: getCalId(env) }]
      })
    });
    if (!res.ok) throw new Error(`FreeBusy ${res.status}`);
    const data  = await res.json();
    const busy  = (data.calendars?.[getCalId(env)]?.busy || []).map(b => ({
      start: new Date(b.start).getTime(),
      end:   new Date(b.end).getTime()
    }));

    // Find first gap of durationMinutes in 9am–6pm MYT window
    let cursor = Math.max(now.getTime(), _nextWorkday9am(now));
    const needed = durationMinutes * 60000;
    for (let d = 0; d < withinDays * 24; d++) {
      const slotEnd = cursor + needed;
      const conflict = busy.some(b => cursor < b.end && slotEnd > b.start);
      if (!conflict && _isWorkHours(cursor)) {
        const dt = new Date(cursor);
        return `Available slot: ${dt.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' })} MYT (${durationMinutes} min)`;
      }
      cursor += 30 * 60000; // advance 30 minutes
      if (cursor > end.getTime()) break;
    }
    return `No free ${durationMinutes}-minute slot found in the next ${withinDays} days`;
  } catch (err) {
    logger.error('calendar-tool', 'freeBusy_failed', { error: err.message });
    return null;
  }
}

function _nextWorkday9am(date) {
  const d = new Date(date);
  d.setUTCHours(1, 0, 0, 0); // 9am MYT = 01:00 UTC
  if (d < date) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

function _isWorkHours(ms) {
  const d = new Date(ms);
  const myt = d.getUTCHours() + 8; // MYT = UTC+8
  const h = myt % 24;
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5 && h >= 9 && h < 18;
}
