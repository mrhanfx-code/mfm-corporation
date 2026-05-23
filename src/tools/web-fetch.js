// Web fetch tool — fetches URL and returns cleaned plain text

export async function fetchWebContent(url, maxChars = 3000) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MFM-Corporation-Bot/1.0' },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();

    let text;
    if (contentType.includes('application/json')) {
      text = JSON.stringify(JSON.parse(raw), null, 2);
    } else {
      text = stripHtml(raw);
    }

    return text.slice(0, maxChars);
  } catch (err) {
    return `[web-fetch error: ${err.message}]`;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
