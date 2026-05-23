// MFM Corporation Telegram Bot — Agent Edition
// Thin webhook handler: validates → routes to Orchestrator → sends reply

import { routeMessage } from './core/orchestrator.js';
import { sendTelegramMessage, sendTyping } from './tools/telegram-tool.js';
import { MarketAnalyst } from './agents/cmo/market-analyst.js';
import { TrendSpotter } from './agents/cino/trend-spotter.js';
import { OpsCoordinator } from './agents/coo/ops-coordinator.js';
import { FinancePlanner } from './agents/cfo/finance-planner.js';
import { RiskAssessor } from './agents/cfo/risk-assessor.js';

const REQUIRED = ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_SECRET', 'OPENROUTER_API_KEY'];

export default {
  async fetch(request, env) {
    for (const key of REQUIRED) {
      if (!env[key]) return new Response(`Missing secret: ${key}`, { status: 500 });
    }

    const url = new URL(request.url);

    if (request.method === 'GET') {
      if (url.pathname === '/') return new Response('MFM Corporation AI — Online', { status: 200 });
      if (url.pathname === '/health') return new Response('OK', { status: 200 });
      return new Response('Not Found', { status: 404 });
    }

    if (request.method === 'POST' && url.pathname === '/telegram-webhook') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (!secret || secret !== env.WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      let update;
      try {
        update = await request.json();
      } catch {
        return new Response('Bad Request', { status: 400 });
      }

      const message = update.message;
      if (!message?.text) return new Response('OK');

      const chatId = message.chat.id;
      const userId = message.from?.id;
      const authorizedIds = (env.AUTHORIZED_USER_IDS || '').split(',').map(s => s.trim());

      if (!authorizedIds.includes(String(userId))) {
        await sendTelegramMessage(chatId, '⛔ Unauthorized.', env);
        return new Response('OK');
      }

      const lastUpdateKey = `last_update:${userId}`;
      if (env.KV) {
        const lastId = await env.KV.get(lastUpdateKey);
        if (lastId && update.update_id <= parseInt(lastId)) return new Response('OK');
        await env.KV.put(lastUpdateKey, String(update.update_id), { expirationTtl: 86400 });
      }

      await sendTyping(chatId, env);

      try {
        const reply = await routeMessage(message, userId, env);
        if (reply) await sendTelegramMessage(chatId, reply, env);
      } catch (err) {
        console.error('[Bot] unhandled error:', err.message);
        await sendTelegramMessage(chatId, `⚠️ Error: ${err.message}`, env);
      }

      return new Response('OK');
    }

    return new Response('Method Not Allowed', { status: 405 });
  },

  async scheduled(event, env, ctx) {
    const ceoId = (env.AUTHORIZED_USER_IDS || '').split(',')[0].trim();
    if (!ceoId) return;

    const hour = new Date().getUTCHours();

    try {
      if (hour === 0) {
        // 08:00 MYT — Morning briefing
        const analyst = new MarketAnalyst();
        const spotter = new TrendSpotter();
        const [market, trends] = await Promise.all([
          analyst.run('Provide a morning market briefing: top 3 Malaysia/SEA business news today, any market movements relevant to MFM Corporation.', ceoId, env),
          spotter.run('What are the top 3 emerging trends this week relevant to MFM Corporation? Keep it brief.', ceoId, env)
        ]);
        const briefing = `🌅 *Good Morning, CEO Remy — MYT 08:00 Briefing*\n\n*Market Update:*\n${market}\n\n*Trend Watch:*\n${trends}`;
        await sendTelegramMessage(ceoId, briefing, env);

      } else if (hour === 5) {
        // 13:00 MYT — Midday ops check
        const ops = new OpsCoordinator();
        const report = await ops.run('Midday operations check: summarize what tasks are in progress, any blockers to flag, and 3 priority actions for the afternoon.', ceoId, env);
        await sendTelegramMessage(ceoId, `☀️ *Midday Ops Check — MYT 13:00*\n\n${report}`, env);

      } else if (hour === 10) {
        // 18:00 MYT — Evening digest
        const planner = new FinancePlanner();
        const assessor = new RiskAssessor();
        const [finance, risk] = await Promise.all([
          planner.run('Daily financial pulse: any cost overruns, revenue opportunities, or budget items needing CEO attention today?', ceoId, env),
          assessor.run('Daily risk scan: any new risks or compliance issues that emerged today that CEO Remy should know about?', ceoId, env)
        ]);
        const digest = `🌆 *Evening Digest — MYT 18:00*\n\n*Finance Pulse:*\n${finance}\n\n*Risk Scan:*\n${risk}`;
        await sendTelegramMessage(ceoId, digest, env);
      }
    } catch (err) {
      console.error('[Scheduled] error:', err.message);
    }
  }
};
