// send-docs-to-remy.js
// Sends all 8 MFM Corporation source documents to Remy's Telegram via /relay endpoint
// Usage: set DASHBOARD_SECRET=<secret> && node scripts/send-docs-to-remy.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;
const WORKER_URL       = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
const MAX_CHARS        = 3900;

if (!DASHBOARD_SECRET) {
  console.error('ERROR: Set DASHBOARD_SECRET env var first.\nRun: set DASHBOARD_SECRET=<your-secret> && node scripts/send-docs-to-remy.js');
  process.exit(1);
}

const DOCS = [
  { label: '📊 Doc 1/8 — Market Research 2026',       path: 'docs/mfm-market-research-2026.md' },
  { label: '💼 Doc 2/8 — Business Plan 2026',          path: 'docs/mfm-business-plan-2026.md' },
  { label: '📱 Doc 3/8 — Social Media Strategy',       path: 'docs/mfm-social-media-strategy.md' },
  { label: '🤖 Doc 4/8 — Autonomous Workflows',        path: 'docs/mfm-autonomous-workflows.md' },
  { label: '🎬 Doc 5/8 — Content Creation Engine',     path: 'docs/mfm-content-creation-engine.md' },
  { label: '💰 Doc 6/8 — API Cost Optimization',       path: 'docs/mfm-api-cost-optimization.md' },
  { label: '📋 Doc 7/8 — Comprehensive Eval Report',   path: 'docs/mfm-comprehensive-evaluation-report.md' },
  { label: '🏗️ Doc 8/8 — 95% Solid Corporation Plan', path: '.windsurf/plans/mfm-solid-corporation-95pct-2afa01.md' },
];

async function send(text) {
  const res = await fetch(`${WORKER_URL}/relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHBOARD_SECRET}`
    },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Relay error: ${JSON.stringify(data)}`);
  await new Promise(r => setTimeout(r, 400)); // rate limit buffer
}

function chunk(text, size) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = i + size;
    if (end < text.length) {
      const newline = text.lastIndexOf('\n', end);
      if (newline > i) end = newline;
    }
    chunks.push(text.slice(i, end).trim());
    i = end;
  }
  return chunks.filter(Boolean);
}

async function main() {
  console.log('📨 Sending 8 MFM Corporation documents to Remy...\n');

  await send('📂 *MFM Corporation — Document Delivery*\n\nRemy, all 8 source documents are being delivered now. Each document follows in sequence.\n\n_Documents: Market Research · Business Plan · Social Media Strategy · Autonomous Workflows · Content Creation Engine · API Cost Optimization · Eval Report · 95% Solid Plan_');

  for (const doc of DOCS) {
    let content;
    try {
      content = readFileSync(join(ROOT, doc.path), 'utf8');
    } catch {
      await send(`⚠️ *${doc.label}*\n\nFile not found: \`${doc.path}\``);
      continue;
    }

    const parts = chunk(content, MAX_CHARS);
    console.log(`  ${doc.label} — ${parts.length} message(s)`);

    await send(`*${doc.label}*\n_${parts.length} part(s) — ${content.length.toLocaleString()} characters_`);
    for (let i = 0; i < parts.length; i++) {
      await send(parts[i]);
    }
  }

  await send('✅ *All 8 documents delivered.*\n\nYou can now ask any agent questions about them. Example:\n`What are the top risks in our business plan?`\n`Summarise our social media strategy KPIs`');
  console.log('\n✅ Done. All documents sent to Remy.');
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
