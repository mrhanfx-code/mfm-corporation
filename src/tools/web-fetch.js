// Web fetch tool — structured content extraction for agents

export async function fetchWebContent(url, maxChars = 3000) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MFM-Corporation-Bot/2.0)',
        'Accept': 'text/html,application/json,*/*'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();

    let text;
    if (contentType.includes('application/json')) {
      try { text = JSON.stringify(JSON.parse(raw), null, 2); }
      catch { text = raw; }
    } else {
      text = extractContent(raw, url);
    }

    return text.slice(0, maxChars);
  } catch (err) {
    return `[web-fetch error: ${err.message}]`;
  }
}

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s{2,}/g, ' ').trim();
}

function extractContent(html, url) {
  // Remove noise blocks first
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const parts = [];

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) parts.push(`# ${decodeEntities(titleMatch[1].replace(/<[^>]+>/g, ''))}`);

  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (metaMatch) parts.push(`_${decodeEntities(metaMatch[1])}_`);

  // Headings h1-h3
  const headings = [...cleaned.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi)];
  const seenH = new Set();
  for (const [, level, content] of headings) {
    const text = decodeEntities(content.replace(/<[^>]+>/g, ''));
    if (text.length > 2 && !seenH.has(text)) {
      seenH.add(text);
      parts.push(`${'#'.repeat(Number(level))} ${text}`);
    }
  }

  // Paragraphs (min 40 chars to skip labels/buttons)
  const paras = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const [, content] of paras) {
    const text = decodeEntities(content.replace(/<[^>]+>/g, ''));
    if (text.length >= 40) parts.push(text);
  }

  // List items
  const items = [...cleaned.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  for (const [, content] of items.slice(0, 20)) {
    const text = decodeEntities(content.replace(/<[^>]+>/g, ''));
    if (text.length >= 10 && text.length < 300) parts.push(`• ${text}`);
  }

  if (parts.length < 3) {
    return decodeEntities(cleaned.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ')).slice(0, 3000);
  }

  return `[Source: ${url}]\n\n` + parts.join('\n\n');
}
