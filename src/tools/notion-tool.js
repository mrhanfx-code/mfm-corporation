// Notion Tool — read/write pages and databases via Notion REST API
// Requires NOTION_API_KEY (Integration Token), NOTION_DATABASE_ID (optional)

import { logger } from '../core/logger.js';

const NOTION_API = 'https://api.notion.com/v1';

async function notionFetch(path, method = 'GET', body = null, token) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${NOTION_API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Get page content by ID.
 */
export async function getPage(pageId, env) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const { ok, data } = await notionFetch(`/pages/${pageId}`, 'GET', null, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Failed to get page.' };
  return { pageId: data.id, title: data.properties?.title?.title?.[0]?.plain_text || 'Untitled', url: data.url };
}

/**
 * Create a new page in a database or parent page.
 */
export async function createPage(parentId, title, content, env) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const body = {
    parent: parentId.startsWith('page-') ? { page_id: parentId } : { database_id: parentId },
    properties: {
      title: {
        title: [{ text: { content: title || 'Untitled' } }],
      },
    },
    children: content ? [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      },
    ] : [],
  };
  const { ok, data } = await notionFetch('/pages', 'POST', body, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Failed to create page.' };
  return { pageId: data.id, url: data.url, title };
}

/**
 * Append content to a page.
 */
export async function appendToPage(pageId, content, env) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const body = {
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      },
    ],
  };
  const { ok, data } = await notionFetch(`/blocks/${pageId}/children`, 'PATCH', body, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Failed to append to page.' };
  return { ok: true, message: 'Content appended successfully' };
}

/**
 * Query a database.
 */
export async function queryDatabase(databaseId, env, filter = null) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const body = filter ? { filter } : {};
  const { ok, data } = await notionFetch(`/databases/${databaseId}/query`, 'POST', body, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Failed to query database.' };
  const results = (data.results || []).map(r => ({
    id: r.id,
    title: r.properties?.title?.title?.[0]?.plain_text || 'Untitled',
    url: r.url,
  }));
  return { results, count: results.length };
}

/**
 * Search Notion workspace.
 */
export async function searchNotion(query, env) {
  if (!env.NOTION_API_KEY) return { error: 'NOTION_API_KEY not configured.' };
  const body = { query };
  const { ok, data } = await notionFetch('/search', 'POST', body, env.NOTION_API_KEY);
  if (!ok) return { error: data.message || 'Search failed.' };
  const results = (data.results || []).map(r => ({
    id: r.id,
    type: r.object,
    title: r.properties?.title?.title?.[0]?.plain_text || r.properties?.Name?.title?.[0]?.plain_text || 'Untitled',
    url: r.url,
  }));
  return { results, count: results.length };
}
