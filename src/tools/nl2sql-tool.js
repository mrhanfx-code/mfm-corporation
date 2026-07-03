// NL2SQL Tool — translates natural language questions to D1 SQL and executes them

import { callLLM, MODELS } from '../core/llm-client.js';

const D1_SCHEMA = `D1 SQLite database schema:

tasks(id TEXT, agent TEXT, input TEXT, output TEXT, status TEXT, quality_score INTEGER, created_at DATETIME, completed_at DATETIME)
agent_memory(id INTEGER, agent TEXT, user_id TEXT, role TEXT, content TEXT, created_at DATETIME)
decisions(id TEXT, agent TEXT, input TEXT, reasoning TEXT, decision TEXT, confidence REAL, created_at DATETIME)
metrics(agent TEXT, date TEXT, tasks_completed INTEGER, avg_quality_score REAL, avg_response_ms REAL)

Notes:
- All timestamps are ISO strings
- agent values: ops-coordinator, quality-ops-reviewer, process-optimizer, data-governance-agent, tech-advisor, devops-monitor, security-auditor, integration-agent, content-writer, market-analyst, customer-success-agent, finance-planner, risk-assessor, research-agent, idea-generator, trend-spotter, innovation-coach, mcp-llm-agent
- status values: pending, completed
- quality_score is 0-100
- metrics.date format: YYYY-MM-DD`;

export async function nl2sqlQuery(question, env) {
  if (!env.db) return '⚠️ Database not available.';

  const genResult = await callLLM(MODELS.CEREBRAS_FAST, [
    {
      role: 'system',
      content: `You are a SQLite expert. Given this schema:\n\n${D1_SCHEMA}\n\nGenerate a single safe SELECT query for the user's question. Rules:\n- SELECT only, no INSERT/UPDATE/DELETE/DROP\n- Use LIMIT 20 max\n- Use date('now') for current date\n- Respond with ONLY the SQL query, no explanation, no markdown fences`
    },
    { role: 'user', content: question }
  ], env, { maxTokens: 200, temperature: 0 });

  const sql = genResult.content
    .replace(/```sql?/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!sql.toUpperCase().startsWith('SELECT')) {
    return `⚠️ Only SELECT queries are allowed.\n_Generated: ${sql}_`;
  }

  try {
    const result = await env.db.prepare(sql).all();
    const rows = result.results || [];

    if (!rows.length) return `📭 No results found.\n_SQL: \`${sql}\`_`;

    const headers = Object.keys(rows[0]);
    const divider = headers.map(() => '---').join(' | ');
    const headerRow = headers.join(' | ');
    const dataRows = rows.map(row =>
      headers.map(h => String(row[h] ?? '').slice(0, 25)).join(' | ')
    );

    const table = [headerRow, divider, ...dataRows].join('\n');
    return `📊 *Query Results* (${rows.length} row${rows.length !== 1 ? 's' : ''})\n\n\`\`\`\n${table}\n\`\`\`\n\n_SQL: \`${sql}\`_`;

  } catch (err) {
    return `⚠️ Query error: ${err.message}\n_SQL: \`${sql}\`_`;
  }
}
