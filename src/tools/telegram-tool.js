// Telegram tool — sendMessage with Markdown fallback, typing indicator

export async function sendTelegramMessage(chatId, text, env, options = {}) {
  const base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...options
  };

  let res = await fetch(`${base}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok && res.status === 400) {
    const fallback = { chat_id: chatId, text, disable_web_page_preview: true, ...options };
    delete fallback.parse_mode;
    res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallback)
    });
  }

  return res;
}

export async function sendTyping(chatId, env) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' })
  });
}
