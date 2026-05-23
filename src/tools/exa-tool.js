// Exa AI Search Tool — neural web search for agents

const EXA_BASE = 'https://api.exa.ai';

export async function searchExa(query, env, options = {}) {
  if (!env.EXA_API_KEY) return '[Exa] No EXA_API_KEY configured';

  const { numResults = 5, type = 'neural', includeText = true } = options;

  try {
    const searchRes = await fetch(`${EXA_BASE}/search`, {
      method: 'POST',
      headers: {
        'x-api-key': env.EXA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        numResults,
        type,
        useAutoprompt: true,
        contents: includeText ? { text: { maxCharacters: 800 } } : undefined
      })
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return `[Exa error ${searchRes.status}] ${err.slice(0, 200)}`;
    }

    const data = await searchRes.json();
    const results = data.results || [];

    if (!results.length) return '[Exa] No results found.';

    return results.map((r, i) => {
      const snippet = (r.text || r.highlights?.[0] || '').slice(0, 500);
      return `${i + 1}. **${r.title || 'No title'}**\n   URL: ${r.url}\n   ${snippet}`;
    }).join('\n\n');

  } catch (err) {
    return `[Exa] fetch failed: ${err.message}`;
  }
}
