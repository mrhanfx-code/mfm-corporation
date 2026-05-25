// MCP Client — unified abstraction layer for all MCP server integrations
// All agents call this instead of individual MCP APIs directly

import { logger } from '../core/logger.js';

const MCP_TIMEOUT_MS = 10000;

async function mcpFetch(url, options = {}, timeoutMs = MCP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Perplexity MCP ──────────────────────────────────────────────────────────
// Fact-check / research via Perplexity Sonar
export async function perplexitySearch(query, env) {
  if (!env.PERPLEXITY_API_KEY) {
    logger.warn('mcp-client', 'perplexity_no_key', {});
    return null;
  }
  try {
    const res = await mcpFetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        max_tokens: 500
      })
    });
    if (!res.ok) throw new Error(`Perplexity ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    logger.info('mcp-client', 'perplexity_ok', { queryLen: query.length });
    return content || null;
  } catch (err) {
    logger.error('mcp-client', 'perplexity_failed', { error: err.message });
    return null;
  }
}

// ─── Brave Search MCP ────────────────────────────────────────────────────────
// Free web search (2000 queries/month on free tier)
export async function braveSearch(query, env, count = 5) {
  if (!env.BRAVE_API_KEY) {
    logger.warn('mcp-client', 'brave_no_key', {});
    return null;
  }
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await mcpFetch(url, {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': env.BRAVE_API_KEY }
    });
    if (!res.ok) throw new Error(`Brave ${res.status}`);
    const data = await res.json();
    const results = (data.web?.results || []).map(r => `${r.title}\n${r.url}\n${r.description || ''}`);
    logger.info('mcp-client', 'brave_ok', { query, resultCount: results.length });
    return results.join('\n\n') || null;
  } catch (err) {
    logger.error('mcp-client', 'brave_failed', { error: err.message });
    return null;
  }
}

// ─── GitHub MCP ──────────────────────────────────────────────────────────────
// Read repo info, issues, PRs for CTO/DevOps context
export async function githubGetRepo(owner, repo, env) {
  if (!env.GITHUB_TOKEN) return null;
  try {
    const res = await mcpFetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    logger.info('mcp-client', 'github_repo_ok', { owner, repo });
    return {
      name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      updatedAt: data.updated_at
    };
  } catch (err) {
    logger.error('mcp-client', 'github_failed', { error: err.message });
    return null;
  }
}

export async function githubListIssues(owner, repo, env, state = 'open', limit = 10) {
  if (!env.GITHUB_TOKEN) return null;
  try {
    const res = await mcpFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${limit}`,
      { headers: { 'Authorization': `Bearer ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' } }
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const issues = await res.json();
    return issues.map(i => `#${i.number}: ${i.title} (${i.state})`).join('\n');
  } catch (err) {
    logger.error('mcp-client', 'github_issues_failed', { error: err.message });
    return null;
  }
}

// ─── Notion MCP ──────────────────────────────────────────────────────────────
// Search knowledge base pages
export async function notionSearch(query, env) {
  if (!env.NOTION_API_KEY) return null;
  try {
    const res = await mcpFetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, page_size: 5 })
    });
    if (!res.ok) throw new Error(`Notion ${res.status}`);
    const data = await res.json();
    const pages = (data.results || []).map(p => {
      const title = p.properties?.title?.title?.[0]?.plain_text || p.object;
      return `• ${title} (${p.url})`;
    });
    logger.info('mcp-client', 'notion_ok', { query, count: pages.length });
    return pages.join('\n') || null;
  } catch (err) {
    logger.error('mcp-client', 'notion_failed', { error: err.message });
    return null;
  }
}

// ─── Slack MCP ───────────────────────────────────────────────────────────────
// Send alert or message to Slack channel via incoming webhook
export async function slackNotify(text, env, channel = '') {
  if (!env.SLACK_WEBHOOK_URL) {
    logger.warn('mcp-client', 'slack_no_webhook', {});
    return null;
  }
  try {
    const payload = { text, ...(channel ? { channel } : {}) };
    const res = await mcpFetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Slack ${res.status}`);
    logger.info('mcp-client', 'slack_ok', { channel });
    return 'Message sent to Slack';
  } catch (err) {
    logger.error('mcp-client', 'slack_failed', { error: err.message });
    return null;
  }
}

// ─── Stripe MCP ──────────────────────────────────────────────────────────────
// Read-only billing: list recent charges and subscription status
export async function stripeGetBalance(env) {
  if (!env.STRIPE_SECRET_KEY) return null;
  try {
    const res = await mcpFetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
    if (!res.ok) throw new Error(`Stripe ${res.status}`);
    const data = await res.json();
    const available = (data.available || []).map(b => `${b.currency.toUpperCase()} ${(b.amount / 100).toFixed(2)}`).join(', ');
    logger.info('mcp-client', 'stripe_balance_ok', {});
    return `Available: ${available || '0'}`;
  } catch (err) {
    logger.error('mcp-client', 'stripe_failed', { error: err.message });
    return null;
  }
}

export async function stripeListCharges(env, limit = 5) {
  if (!env.STRIPE_SECRET_KEY) return null;
  try {
    const res = await mcpFetch(`https://api.stripe.com/v1/charges?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
    if (!res.ok) throw new Error(`Stripe ${res.status}`);
    const data = await res.json();
    const charges = (data.data || []).map(c =>
      `${c.currency.toUpperCase()} ${(c.amount / 100).toFixed(2)} — ${c.description || c.id} (${c.status})`
    );
    logger.info('mcp-client', 'stripe_charges_ok', { count: charges.length });
    return charges.join('\n') || 'No charges found';
  } catch (err) {
    logger.error('mcp-client', 'stripe_charges_failed', { error: err.message });
    return null;
  }
}

// ─── Unified search (tries Perplexity → Brave → null) ───────────────────────
export async function webSearch(query, env) {
  const perp = await perplexitySearch(query, env);
  if (perp) return perp;
  const brave = await braveSearch(query, env);
  return brave;
}
