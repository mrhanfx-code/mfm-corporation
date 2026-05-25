// Alerting — sends failure/threshold alerts to CEO Remy via Telegram + Slack

import { logger } from '../core/logger.js';
import { slackNotify } from './mcp-client.js';

const ALERT_COOLDOWN_SECONDS = 300; // 5 minutes between repeated alerts for same key

export async function sendAlert(type, message, env) {
  const ceoId = (env.AUTHORIZED_USER_IDS || '').split(',')[0].trim();
  if (!ceoId || !env.TELEGRAM_BOT_TOKEN) return;

  // Dedup: don't spam same alert within cooldown window
  const alertKey = `alert:${type}`;
  if (env.KV) {
    const recent = await env.KV.get(alertKey);
    if (recent) {
      logger.debug('alerting', 'alert_suppressed', { type });
      return;
    }
    await env.KV.put(alertKey, '1', { expirationTtl: ALERT_COOLDOWN_SECONDS });
  }

  const text = `🚨 *MFM Alert — ${type}*\n\n${message}\n\n_${new Date().toISOString()}_`;

  try {
    const slackText = `🚨 *MFM Alert — ${type}*\n${message}\n_${new Date().toISOString()}_`;
    await Promise.allSettled([
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ceoId, text, parse_mode: 'Markdown' })
      }),
      slackNotify(slackText, env)
    ]);
    logger.info('alerting', 'alert_sent', { type, ceoId });
  } catch (err) {
    logger.error('alerting', 'alert_failed', { type, error: err.message });
  }
}

export async function alertLLMAllProvidersFailed(env) {
  await sendAlert('LLM_ALL_PROVIDERS_FAILED',
    'All LLM providers (Cerebras + OpenRouter) are unavailable. Agents are non-functional until at least one provider recovers.',
    env
  );
}

export async function alertLowQualityScore(agentName, score, env) {
  if (score >= 50) return;
  await sendAlert(`LOW_QUALITY:${agentName}`,
    `Agent *${agentName}* returned quality score *${score}/100* (below 50). Response was escalated with a warning.`,
    env
  );
}

export async function alertCircuitOpen(agentOrProvider, env) {
  await sendAlert(`CIRCUIT_OPEN:${agentOrProvider}`,
    `Circuit breaker opened for *${agentOrProvider}*. It will auto-reset in 60 seconds. Requests are being skipped.`,
    env
  );
}
