## Code Context

**Query:** telegram bot

### Entry Points

- **REQUIRED** (constant) - src/telegram-bot-agent.js:8
  `= ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_SECRET', 'OPENROUTER_API_KEY']`
- **sleep** (function) - src/tools/telegram-tool.js:3
  `(ms)`
- **REFERER** (constant) - src/core/llm-client.js:10
  `= 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev'`

### Related Symbols

- src/tools/telegram-tool.js: sendTelegramMessage:5

### Code

#### REQUIRED (src/telegram-bot-agent.js:8)

```javascript
const REQUIRED = ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_SECRET', 'OPENROUTER_API_KEY'];
```

#### sleep (src/tools/telegram-tool.js:3)

```javascript
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

#### REFERER (src/core/llm-client.js:10)

```javascript
const REFERER         = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
```

#### sendTelegramMessage (src/tools/telegram-tool.js:5)

```javascript
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

      // Markdown parse error ΓÇö retry without parse_mode
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

      // Server errors ΓÇö retry
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
```

