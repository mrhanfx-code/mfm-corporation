// MFM Corporation Telegram Bot — Agent Edition
// Thin webhook handler: validates → routes to Orchestrator → sends reply

import { routeMessage } from './core/orchestrator.js';
import { sendTelegramMessage, sendTyping } from './tools/telegram-tool.js';
import { handleDashboardAPI } from './dashboard/dashboard-worker.js';
import { processQueuedJob } from './tools/fal-ai-wrapper.js';

const REQUIRED = ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_SECRET', 'OPENROUTER_API_KEY'];

export default {
  async fetch(request, env) {
    for (const key of REQUIRED) {
      if (!env[key]) return new Response(`Missing secret: ${key}`, { status: 500 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Dashboard API routes
    if (path.startsWith('/api/v1/dashboard/')) {
      return await handleDashboardAPI(request, env, path);
    }

    const cors = {
      'Access-Control-Allow-Origin': env.DASHBOARD_ORIGIN || 'https://mfm-corp.cc.cd',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET') {
      if (url.pathname === '/') return new Response('MFM Corporation AI — Online', { status: 200, headers: cors });
      if (url.pathname === '/health') {
        const checks = {
          kv:       !!env.KV,
          d1:       !!env.db,
          r2:       !!env['mfm-corporation-uploads'],
          queue:    !!env.TASK_QUEUE,
          telegram: !!env.TELEGRAM_BOT_TOKEN,
          llm:      !!env.OPENROUTER_API_KEY,
          cerebras: !!env.CEREBRAS_API_KEY,
        };
        const healthy = Object.values(checks).filter(Boolean).length;
        const total   = Object.keys(checks).length;
        const status  = healthy === total ? 'healthy' : healthy >= 5 ? 'degraded' : 'unhealthy';
        return new Response(
          JSON.stringify({ status, checks, score: `${healthy}/${total}`, ts: new Date().toISOString() }, null, 2),
          { status: status === 'unhealthy' ? 503 : 200, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      if (url.pathname === '/register-webhook') {
        if (url.searchParams.get('secret') !== env.DASHBOARD_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        const workerUrl = `${url.protocol}//${url.host}`;
        const webhookUrl = `${workerUrl}/telegram-webhook`;
        const res = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: webhookUrl,
              secret_token: env.WEBHOOK_SECRET,
              allowed_updates: ['message', 'callback_query'],
              drop_pending_updates: true
            })
          }
        );
        const data = await res.json();
        return new Response(JSON.stringify({ webhookUrl, telegram: data }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/webhook-info') {
        if (url.searchParams.get('secret') !== env.DASHBOARD_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        const data = await res.json();
        return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname === '/dlq') {
        if (url.searchParams.get('secret') !== env.DASHBOARD_SECRET) return new Response('Unauthorized', { status: 401 });
        if (!env.db) return new Response(JSON.stringify({ error: 'D1 not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        try {
          const rows = await env.db.prepare(
            `SELECT * FROM dead_letter_queue ORDER BY failed_at DESC LIMIT 20`
          ).all();
          return new Response(JSON.stringify(rows.results || [], null, 2), { headers: { 'Content-Type': 'application/json' } });
        } catch {
          return new Response(JSON.stringify({ error: 'dead_letter_queue table not yet created' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      if (url.pathname === '/supabase-check') {
        const checks = {
          SUPABASE_URL:         !!env.SUPABASE_URL,
          SUPABASE_ANON_KEY:    !!env.SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_KEY: !!env.SUPABASE_SERVICE_KEY
        };
        const configured = Object.values(checks).every(Boolean);
        let reachable = false;
        let tablesOk = { agent_events: false, agent_metrics: false, ceo_commands: false, routing_decisions: false };
        if (configured) {
          try {
            const results = await Promise.all(
              Object.keys(tablesOk).map(table =>
                fetch(`${env.SUPABASE_URL}/rest/v1/${table}?limit=1`, {
                  headers: { 'apikey': env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}` }
                }).then(r => ({ table, ok: r.ok, status: r.status }))
              )
            );
            reachable = true;
            for (const r of results) tablesOk[r.table] = r.ok;
          } catch (e) {
            reachable = false;
          }
        }
        const status = configured && reachable && Object.values(tablesOk).every(Boolean);
        return new Response(JSON.stringify({
          ok: status,
          secrets: checks,
          reachable,
          tables: tablesOk
        }, null, 2), {
          status: status ? 200 : 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
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
      if (!message) return new Response('OK');

      // Handle non-text messages — extract file info and caption
      if (!message.text) {
        const chatId   = message.chat.id;
        const userId   = message.from?.id;
        const authorizedIds = (env.AUTHORIZED_USER_IDS || '').split(',').map(s => s.trim());
        if (!authorizedIds.includes(String(userId))) return new Response('OK');

        let fileInfo = '';
        if (message.document) {
          fileInfo = `📎 File received: *${message.document.file_name || 'unknown'}* (${((message.document.file_size || 0) / 1024).toFixed(1)} KB, type: ${message.document.mime_type || 'unknown'})\n\n`;
        } else if (message.photo) {
          fileInfo = '🖼️ Photo received.\n\n';
        } else if (message.voice) {
          fileInfo = '🎙️ Voice message received.\n\n';
        } else if (message.video) {
          fileInfo = '🎬 Video received.\n\n';
        } else if (message.audio) {
          fileInfo = '🎵 Audio received.\n\n';
        } else if (message.sticker) {
          return new Response('OK');
        }

        const note = message.caption ? `Caption: "${message.caption}"` : 'No caption provided.';
        await sendTelegramMessage(chatId, `${fileInfo}⚠️ *File received but not yet processable via bot.* The system currently only handles text commands.\n\n${note}\n\nTo share this document with your agents, paste the text content directly.`, env);
        return new Response('OK');
      }

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

      // Deduplicate identical messages within 5s
      const msgHash = `dup:${userId}:${message.text.slice(0, 200)}`;
      if (env.KV) {
        const dup = await env.KV.get(msgHash);
        if (dup) return new Response('OK');
        await env.KV.put(msgHash, '1', { expirationTtl: 60 });
      }

      // Per-user rate limit: max 30 messages/minute
      if (env.KV) {
        const now = Math.floor(Date.now() / 60000);
        const userRateKey = `msg_rate:${userId}:${now}`;
        const userHits = parseInt(await env.KV.get(userRateKey) || '0');
        if (userHits >= 30) {
          await sendTelegramMessage(chatId, '⏳ Rate limit: max 30 messages/minute. Please slow down.', env);
          return new Response('OK');
        }
        await env.KV.put(userRateKey, String(userHits + 1), { expirationTtl: 120 });
      }

      await sendTyping(chatId, env);

      try {
        const reply = await routeMessage(message, userId, env);
        if (reply) await sendTelegramMessage(chatId, reply, env);
      } catch (err) {
        console.error('[Bot] unhandled error:', err.message);
        await sendTelegramMessage(chatId, '⚠️ Error: ' + err.message, env);
      }

      return new Response('OK');
    }

    // Serve files from R2
    if (url.pathname.startsWith('/file/')) {
      const key = url.pathname.slice(6); // remove '/file/'
      const bucket = env['mfm-corporation-uploads'];
      if (!bucket) return new Response('Not found', { status: 404 });
      const object = await bucket.get(key);
      if (!object) return new Response('Not found', { status: 404 });
      const filename = key.split('/').pop();
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': env.DASHBOARD_ORIGIN || 'https://mfm-corp.cc.cd',
        }
      });
    }

    if (url.pathname === '/relay') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
      if (token !== env.DASHBOARD_SECRET) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
      let body;
      try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors }); }
      if (!body?.text) return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: cors });
      const ceoId = (env.AUTHORIZED_USER_IDS || '').split(',')[0].trim();
      await sendTelegramMessage(ceoId, body.text, env);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // File upload endpoint — stores in R2, returns URL
    if (url.pathname === '/upload') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
      if (token !== env.DASHBOARD_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const bucket = env['mfm-corporation-uploads'];
      if (!bucket) {
        return new Response(JSON.stringify({ error: 'R2 not configured' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      let formData;
      try { formData = await request.formData(); } catch {
        return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'File too large. Max 10MB.' }), { status: 413, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const fileId = crypto.randomUUID();
      const key = `uploads/${fileId}.${ext}`;
      await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
      const file_url = `${url.protocol}//${url.host}/file/${key}`;
      return new Response(JSON.stringify({ file_url, file_name: file.name, file_type: file.type, size: file.size }),
        { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/ask') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
      if (!env.DASHBOARD_SECRET) {
        return new Response(JSON.stringify({ error: 'DASHBOARD_SECRET not configured. Run: wrangler secret put DASHBOARD_SECRET' }),
          { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
      if (token !== env.DASHBOARD_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      if (env.KV) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const now = Math.floor(Date.now() / 60000);
        const rateKey = `ask_rate:${ip}:${now}`;
        const hits = parseInt(await env.KV.get(rateKey) || '0');
        if (hits >= 20) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 20 requests/minute.' }),
            { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
        await env.KV.put(rateKey, String(hits + 1), { expirationTtl: 120 });
      }
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      if (!body?.text?.trim() && !body?.file_url) {
        return new Response(JSON.stringify({ error: 'Missing text or file' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const inputText = (body.text || '').trim();
      if (inputText.length > 4000) {
        return new Response(JSON.stringify({ error: 'Input too long. Max 4000 characters.' }),
          { status: 413, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      // Build message context — include file info if present
      let messageText = inputText;
      if (body.file_url) {
        messageText += `\n\n[User shared a file: ${body.file_name || 'file'} — ${body.file_url}]`;
      }
      const ceoId = (env.AUTHORIZED_USER_IDS || '').split(',')[0].trim();
      const reply = await routeMessage({ text: messageText || `[File shared: ${body.file_name}]` }, ceoId, env);

      // If reply is long (report), save to R2 and return attachment
      let attachment = null;
      const bucket = env['mfm-corporation-uploads'];
      if (reply && reply.length > 1500 && bucket) {
        try {
          const reportId = crypto.randomUUID();
          const key = `reports/${reportId}.md`;
          await bucket.put(key, reply, { httpMetadata: { contentType: 'text/markdown' } });
          const reportUrl = `${url.protocol}//${url.host}/file/${key}`;
          attachment = { url: reportUrl, name: 'report.md', type: 'text/markdown' };
        } catch { /* non-fatal */ }
      }

      return new Response(JSON.stringify({ response: reply || 'No response.', attachment }),
        { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    return new Response('Method Not Allowed', { status: 405 });
  },

  async queue(batch, env) {
    for (const msg of batch.messages) {
      try {
        // Check if this is a video rendering job
        if (msg.body && msg.body.jobId && msg.body.params) {
          console.log('[Queue Consumer] Processing video rendering job:', msg.id);
          const result = await processQueuedJob(msg, env);
          console.log('[Queue Consumer] Video job processed successfully:', result.jobId);
          msg.ack();
          continue;
        }

        // Handle regular async tasks
        const { chatId, userId, text, taskType } = msg.body;
        if (!chatId || !userId || !text) { msg.ack(); continue; }

        const reply = await routeMessage({ text }, userId, env);
        if (reply) await sendTelegramMessage(chatId, `✅ *Async task complete* _(${taskType || 'task'})_\n\n${reply}`, env);
        msg.ack();
      } catch (err) {
        console.error('[Queue] task failed:', err.message);
        if (msg.attempts >= 3) {
          // Dead letter — store in D1 for manual review
          try {
            const { chatId, userId, text, taskType } = msg.body;
            await env.db?.prepare(
              `INSERT OR IGNORE INTO dead_letter_queue (id, chat_id, user_id, text, task_type, error, attempts, failed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            ).bind(msg.id, chatId, userId, text, taskType || 'unknown', err.message, msg.attempts).run();
            if (chatId) await sendTelegramMessage(chatId, `⚠️ Task could not be completed after ${msg.attempts} attempts and has been queued for manual review.\n\n_Error: ${err.message}_`, env);
          } catch (dlqErr) {
            console.error('[DLQ] store failed:', dlqErr.message);
          }
          msg.ack(); // stop retrying
        } else {
          msg.retry();
        }
      }
    }
  },

  async scheduled(event, env, ctx) {
    const ceoId = (env.AUTHORIZED_USER_IDS || '').split(',')[0].trim();
    if (!ceoId) return;

    const hour = new Date().getUTCHours();
    const dow  = new Date().getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dom  = new Date().getUTCDate(); // day of month

    try {
      if (hour === 0) {
        // 08:00 MYT — Morning briefing (Mon–Fri only)
        if (dow >= 1 && dow <= 5) {
          const market    = await routeMessage({ text: '/to market-analyst Morning Malaysia/SEA market briefing: top 3 business news, competitor moves, opportunities for MFM.' }, ceoId, env);
          const trends    = await routeMessage({ text: '/to trend-spotter Top 3 AI/tech trends this week relevant to MFM Corporation. Keep brief and actionable.' }, ceoId, env);
          const techWatch = await routeMessage({ text: '/to technology-tracker Any new tools, LLMs, or platforms MFM should evaluate this week?' }, ceoId, env);
          const briefing  = '🌅 *Good Morning, CEO Remy — MYT 08:00 Briefing*\n\n' + market + '\n\n' + trends + '\n\n' + techWatch;
          await sendTelegramMessage(ceoId, briefing, env);
        }

      } else if (hour === 5) {
        // 13:00 MYT — Midday ops check
        const ops    = await routeMessage({ text: '/to ops-coordinator Midday ops check: tasks in progress, blockers, 3 priority actions for the afternoon.' }, ceoId, env);
        const finance = await routeMessage({ text: '/to finance-planner Quick financial pulse: revenue progress vs MYR target, any urgent budget items.' }, ceoId, env);
        const report = ops + '\n\n' + finance;
        await sendTelegramMessage(ceoId, '☀️ *Midday Ops Check — MYT 13:00*\n\n' + report, env);

      } else if (hour === 10) {
        // 18:00 MYT — Evening digest
        const risk      = await routeMessage({ text: '/to risk-assessor Daily risk scan: any new operational, market, or compliance risks today?' }, ceoId, env);
        const analytics = await routeMessage({ text: '/to analytics-reporter Today\'s agent performance snapshot: any agents below 75 average score?' }, ceoId, env);
        const digest    = '🌆 *Evening Digest — MYT 18:00*\n\n' + risk + '\n\n' + analytics;
        await sendTelegramMessage(ceoId, digest, env);

        // Friday 18:00 MYT — Weekly report
        if (dow === 5) {
          const weekly = await routeMessage({ text: '/to reporting-analyst Compile the weekly MFM operations report: tasks completed, agent performance, revenue progress, blockers, next week priorities.' }, ceoId, env);
          await sendTelegramMessage(ceoId, '📊 *Weekly Report — MYT Friday 18:00*\n\n' + weekly, env);
        }

        // 1st of month 18:00 MYT — Monthly financial summary
        if (dom === 1) {
          const monthly = await routeMessage({ text: '/to revenue-analyst Monthly financial summary: MRR, ARR, pipeline value, progress vs MYR 60K-120K Year 1 target, top risks to hitting target.' }, ceoId, env);
          await sendTelegramMessage(ceoId, '📈 *Monthly Financial Summary — MYT 1st*\n\n' + monthly, env);
        }
      }
    } catch (err) {
      console.error('[Scheduled] error:', err.message);
      await sendTelegramMessage(ceoId, '⚠️ Scheduled briefing failed: ' + err.message, env);
    }
  }
};
