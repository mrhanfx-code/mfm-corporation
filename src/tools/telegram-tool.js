// Telegram tool — sendMessage with Markdown fallback, typing indicator

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function sendTelegramMessage(chatId, text, env, options = {}) {
  const base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

  const payload = {
    chat_id: chatId,
    text: (text || '').slice(0, 4096),
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...options
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * attempt);
    try {
      let res = await fetch(`${base}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) return res;

      // Markdown parse error — retry without parse_mode
      if (res.status === 400) {
        const fallback = { chat_id: chatId, text: payload.text, disable_web_page_preview: true, ...options };
        delete fallback.parse_mode;
        res = await fetch(`${base}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallback)
        });
        return res;
      }

      // Server errors — retry
      if (res.status >= 500) {
        lastErr = new Error(`Telegram API ${res.status}`);
        continue;
      }

      return res;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error('[Telegram] send failed after 3 attempts:', lastErr?.message);
  return { ok: false, status: 0 };
}

export async function sendTyping(chatId, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    });
  } catch (err) {
    console.warn('[Telegram] sendTyping failed:', err.message);
  }
}
