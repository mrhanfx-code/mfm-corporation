// LIVE Agent Test — Run AFTER wrangler deploy
// Tests all 42 agents against the deployed Cloudflare Worker
// Usage: node tests/live-agent-test.js

const BASE_URL = process.env.WORKER_URL || 'https://mfm-corporation-api.mrhan-fx.workers.dev';
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || 'test-secret';

const RESULTS = { passed: 0, failed: 0, scores: [] };

async function askAgent(text) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHBOARD_SECRET}`
    },
    body: JSON.stringify({ text })
  });
  if (!res.ok) return { error: `HTTP ${res.status}`, score: 0 };
  const data = await res.json();
  return { response: data.response, score: data.score || 0 };
}

async function testAgent(name, prompt) {
  console.log(`\n--- Testing: ${name} ---`);
  try {
    const start = Date.now();
    const result = await askAgent(`/to ${name} ${prompt}`);
    const elapsed = Date.now() - start;
    
    if (result.error) {
      console.log(`❌ ${name}: ${result.error}`);
      RESULTS.failed++;
      RESULTS.scores.push({ name, score: 0, error: result.error });
      return;
    }
    
    const hasContent = result.response && result.response.length > 20;
    const noErrorMsg = !result.response.includes('ERROR') && !result.response.includes('not available');
    
    if (hasContent && noErrorMsg) {
      console.log(`✅ ${name}: ${result.response.slice(0, 100)}... (${elapsed}ms)`);
      RESULTS.passed++;
      RESULTS.scores.push({ name, score: 100, response: result.response.slice(0, 200), ms: elapsed });
    } else {
      console.log(`⚠️ ${name}: Response too short or contained error`);
      RESULTS.failed++;
      RESULTS.scores.push({ name, score: 50, response: result.response, ms: elapsed });
    }
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    RESULTS.failed++;
    RESULTS.scores.push({ name, score: 0, error: err.message });
  }
}

async function main() {
  console.log('🔥 LIVE AGENT TEST — MFM Corporation');
  console.log(`Target: ${BASE_URL}`);
  console.log('This will send real requests to your deployed Worker.\n');
  
  // Test all 42 agents with one task each
  const tests = [
    // COO (13)
    ['ops-coordinator', 'What are my top 3 priorities today?'],
    ['quality-ops-reviewer', 'Review this output: "We should hire more people" — score it 0-100'],
    ['process-optimizer', 'How can I improve my daily workflow?'],
    ['data-governance-agent', 'What is PDPA Malaysia compliance for AI companies?'],
    ['strategic-planner', 'Create a 30-day plan to reach MYR 100K revenue'],
    ['meeting-scheduler', 'Find a free slot for a 1-hour meeting next week'],
    ['reporting-analyst', 'Write a one-paragraph weekly status report'],
    ['project-manager', 'Break down building a client website into tasks'],
    ['notification-manager', 'Draft a critical alert about system downtime'],
    ['google-drive-agent', 'List files in the MFM Drive folder'],
    ['analytics-reporter', 'What metrics should MFM track for agent performance?'],
    ['pdf-generator', 'How would you structure a monthly report as PDF?'],
    ['quality-control-manager', 'Audit this process: "We send emails manually" — score it'],
    
    // CTO (10)
    ['tech-advisor', 'What tech stack should I use for a real-time dashboard?'],
    ['devops-monitor', 'How do I monitor a Cloudflare Worker health?'],
    ['security-auditor', 'Audit the security of storing API keys in KV'],
    ['integration-agent', 'How do I connect my API to a Telegram bot?'],
    ['development-advisor', 'Should I use React or Vue for my dashboard?'],
    ['frontend-developer', 'Write a React component for a task list'],
    ['backend-developer', 'Design a REST API endpoint for creating tasks'],
    ['qa-engineer', 'Write test cases for a web-fetch tool'],
    ['database-specialist', 'Design a D1 schema for storing agent conversations'],
    ['cloud-engineer', 'How do I stay within Cloudflare Workers free tier?'],
    
    // CMO (6)
    ['content-writer', 'Write a Facebook post about AI automation for Malaysian SMEs'],
    ['market-analyst', 'What is the Malaysia AI market size in 2026?'],
    ['customer-success-agent', 'How do I onboard a new client to MFM services?'],
    ['social-media-agent', 'Create an Instagram caption for our AI launch'],
    ['media-producer', 'Write a script for a 60-second TikTok about MFM'],
    ['email-marketing-agent', 'Write a cold outreach email to a Malaysian SME'],
    
    // CFO (4)
    ['finance-planner', 'Create a budget for MFM Q3 with MYR 80K target'],
    ['risk-assessor', 'What are the top 3 risks for MFM Corporation?'],
    ['grant-tracker', 'What Malaysian grants can AI startups apply for?'],
    ['revenue-analyst', 'How do I project MRR for a SaaS with 10 customers?'],
    
    // CINO (8)
    ['research-agent', 'Research the top 3 AI automation tools for SMEs in 2026'],
    ['idea-generator', 'Give me 5 business ideas for AI automation in Malaysia'],
    ['trend-spotter', 'What are the top 3 emerging tech trends this week?'],
    ['innovation-coach', 'Help me refine this idea: AI-powered meeting notes'],
    ['innovation-analyst', 'Analyze the competitive landscape for AI agents in SEA'],
    ['mcp-llm-agent', 'What is the best LLM for coding tasks in 2026?'],
    ['technology-tracker', 'What new AI tools launched this month?'],
    ['data-analyst', 'How do I analyze agent performance data from D1?'],
    
    // CLO (1)
    ['legal-advisor', 'What legal structure should MFM use: Sdn Bhd or Enterprise?']
  ];
  
  for (const [agent, prompt] of tests) {
    await testAgent(agent, prompt);
    // Rate limit: max 1 req/sec to be polite
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Summary
  const total = RESULTS.passed + RESULTS.failed;
  const pct = Math.round((RESULTS.passed / total) * 100);
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${RESULTS.passed}/${total} passed (${pct}%)`);
  console.log(`Failed: ${RESULTS.failed}`);
  console.log('='.repeat(50));
  
  if (pct >= 95) {
    console.log('🎉 95% TARGET ACHIEVED!');
  } else if (pct >= 80) {
    console.log('⚠️ Good but below 95%. Review failed agents.');
  } else {
    console.log('❌ Below threshold. Major fixes needed.');
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    summary: { total, passed: RESULTS.passed, failed: RESULTS.failed, pct },
    scores: RESULTS.scores
  };
  const fs = await import('fs');
  fs.writeFileSync('tests/live-test-results.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to: tests/live-test-results.json');
}

main().catch(console.error);
