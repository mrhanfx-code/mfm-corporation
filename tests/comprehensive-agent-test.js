// Comprehensive Agent & Tool Validation Test
// Run: node tests/comprehensive-agent-test.js
// Tests: syntax, imports, agent map consistency, tool coverage

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = { passed: 0, failed: 0, warnings: 0, logs: [] };

function log(level, msg) {
  results.logs.push({ level, msg });
  if (level === 'PASS') results.passed++;
  if (level === 'FAIL') results.failed++;
  if (level === 'WARN') results.warnings++;
  const icon = { PASS: '✅', FAIL: '❌', WARN: '⚠️', INFO: 'ℹ️' };
  console.log(`${icon[level] || ''} ${msg}`);
}

// ─── 1. All new agent files exist and are readable ────────────────────────

const NEW_AGENTS = {
  coo: ['meeting-scheduler', 'reporting-analyst', 'project-manager', 'notification-manager', 'google-drive-agent', 'analytics-reporter', 'pdf-generator', 'quality-control-manager'],
  cto: ['frontend-developer', 'backend-developer', 'qa-engineer', 'database-specialist', 'cloud-engineer'],
  cfo: ['grant-tracker', 'revenue-analyst'],
  cino: ['technology-tracker', 'data-analyst'],
  cmo: ['email-marketing-agent'],
};

log('INFO', '=== 1. New Agent File Existence ===');
let allAgentsExist = true;
for (const [dept, agents] of Object.entries(NEW_AGENTS)) {
  for (const agent of agents) {
    const filePath = path.join(ROOT, 'src', 'agents', dept, `${agent}.js`);
    if (fs.existsSync(filePath)) {
      log('PASS', `Agent file exists: ${dept}/${agent}.js`);
    } else {
      log('FAIL', `Agent file MISSING: ${dept}/${agent}.js`);
      allAgentsExist = false;
    }
  }
}

// ─── 2. New tool files exist ──────────────────────────────────────────────

log('INFO', '\n=== 2. New Tool File Existence ===');
const NEW_TOOLS = ['google-drive-tool.js', 'sms-tool.js', 'pdf-tool.js', 'calendar-tool.js'];
for (const tool of NEW_TOOLS) {
  const filePath = path.join(ROOT, 'src', 'tools', tool);
  if (fs.existsSync(filePath)) {
    log('PASS', `Tool file exists: ${tool}`);
  } else {
    log('FAIL', `Tool file MISSING: ${tool}`);
  }
}

// ─── 3. Each agent file has valid export class ──────────────────────────

log('INFO', '\n=== 3. Agent Class Export Validation ===');
for (const [dept, agents] of Object.entries(NEW_AGENTS)) {
  for (const agent of agents) {
    const filePath = path.join(ROOT, 'src', 'agents', dept, `${agent}.js`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const className = agent.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
    if (content.includes(`export class ${className}`)) {
      log('PASS', `Export class found: ${className} in ${dept}/${agent}.js`);
    } else {
      log('FAIL', `Missing export class ${className} in ${dept}/${agent}.js`);
    }
    if (content.includes('extends AgentBase')) {
      log('PASS', `Extends AgentBase: ${dept}/${agent}.js`);
    } else {
      log('FAIL', `Does not extend AgentBase: ${dept}/${agent}.js`);
    }
    if (content.includes('systemPrompt:')) {
      log('PASS', `Has systemPrompt: ${dept}/${agent}.js`);
    } else {
      log('WARN', `Missing systemPrompt: ${dept}/${agent}.js`);
    }
    if (content.includes('tools:')) {
      log('PASS', `Has tools array: ${dept}/${agent}.js`);
    } else {
      log('WARN', `Missing tools array: ${dept}/${agent}.js`);
    }
  }
}

// ─── 4. Orchestrator AGENT_MAP has all 42 agents ────────────────────────

log('INFO', '\n=== 4. Orchestrator Agent Map Completeness ===');
const orchestratorPath = path.join(ROOT, 'src', 'core', 'orchestrator.js');
const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8');

// Extract AGENT_MAP keys
const agentMapMatch = orchestratorContent.match(/const AGENT_MAP = \{([^}]+)\}/s);
if (agentMapMatch) {
  const agentMapKeys = [...agentMapMatch[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1]);
  log('INFO', `AGENT_MAP contains ${agentMapKeys.length} agents`);

  const expectedAllAgents = [
    // Original 24
    'ops-coordinator', 'quality-ops-reviewer', 'process-optimizer', 'data-governance-agent', 'strategic-planner',
    'tech-advisor', 'devops-monitor', 'security-auditor', 'integration-agent', 'development-advisor',
    'content-writer', 'market-analyst', 'customer-success-agent', 'social-media-agent', 'media-producer',
    'finance-planner', 'risk-assessor',
    'research-agent', 'idea-generator', 'trend-spotter', 'innovation-coach', 'innovation-analyst', 'mcp-llm-agent',
    'legal-advisor',
    // New 19
    'meeting-scheduler', 'reporting-analyst', 'project-manager', 'notification-manager', 'google-drive-agent',
    'analytics-reporter', 'pdf-generator', 'quality-control-manager',
    'frontend-developer', 'backend-developer', 'qa-engineer', 'database-specialist', 'cloud-engineer',
    'email-marketing-agent', 'grant-tracker', 'revenue-analyst',
    'technology-tracker', 'data-analyst',
  ];

  const uniqueKeys = [...new Set(agentMapKeys)];
  if (uniqueKeys.length !== agentMapKeys.length) {
    log('FAIL', `Duplicate keys found in AGENT_MAP! Total: ${agentMapKeys.length}, Unique: ${uniqueKeys.length}`);
  } else {
    log('PASS', `No duplicate keys in AGENT_MAP (${uniqueKeys.length} unique)`);
  }

  for (const agent of expectedAllAgents) {
    if (agentMapKeys.includes(agent)) {
      log('PASS', `AGENT_MAP has: ${agent}`);
    } else {
      log('FAIL', `AGENT_MAP MISSING: ${agent}`);
    }
  }

  for (const key of agentMapKeys) {
    if (!expectedAllAgents.includes(key)) {
      log('WARN', `AGENT_MAP has unexpected agent: ${key}`);
    }
  }
} else {
  log('FAIL', 'Could not parse AGENT_MAP from orchestrator.js');
}

// ─── 5. Orchestrator imports match AGENT_MAP ────────────────────────────

log('INFO', '\n=== 5. Import / AGENT_MAP Consistency ===');
const importMatches = [...orchestratorContent.matchAll(/import \{ ([^}]+) \} from ['"]([^'"]+)['"];/g)];
const importedClasses = [];
for (const [, classes] of importMatches) {
  importedClasses.push(...classes.split(',').map(c => c.trim()));
}

const agentMapClasses = [...orchestratorContent.matchAll(/'([^']+)'\s*:\s*(\w+)/g)].map(m => ({ key: m[1], className: m[2] }));
for (const { key, className } of agentMapClasses) {
  if (importedClasses.includes(className)) {
    log('PASS', `AGENT_MAP class imported: ${key} → ${className}`);
  } else {
    log('FAIL', `AGENT_MAP class NOT imported: ${key} → ${className}`);
  }
}

// ─── 6. Panel registry consistency ────────────────────────────────────────

log('INFO', '\n=== 6. Panel Agent Registry Consistency ===');
const panelMatch = orchestratorContent.match(/const PANEL_AGENT_REGISTRY = \{([^}]+)\}/s);
if (panelMatch) {
  const panelKeys = [...panelMatch[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1]);
  log('INFO', `PANEL_AGENT_REGISTRY has ${panelKeys.length} agents`);
  const panelInMap = panelKeys.filter(k => agentMapKeys?.includes(k));
  log('INFO', `${panelInMap.length}/${panelKeys.length} panel agents exist in AGENT_MAP`);
  const panelNotInMap = panelKeys.filter(k => !agentMapKeys?.includes(k));
  for (const agent of panelNotInMap) {
    log('WARN', `Panel agent not in AGENT_MAP: ${agent}`);
  }
} else {
  log('FAIL', 'Could not parse PANEL_AGENT_REGISTRY');
}

// ─── 7. agent-base.js tool coverage ─────────────────────────────────────

log('INFO', '\n=== 7. Agent-Base Tool Coverage ===');
const agentBasePath = path.join(ROOT, 'src', 'core', 'agent-base.js');
const agentBaseContent = fs.readFileSync(agentBasePath, 'utf8');

const toolDescriptions = [...agentBaseContent.matchAll(/'([a-z-]+)'\s*:/g)].map(m => m[1]);
const useToolCases = [...agentBaseContent.matchAll(/case '([a-z-]+)':/g)].map(m => m[1]);

const expectedTools = [
  'web-fetch', 'send-email', 'exa-search', 'social-post',
  'perplexity-search', 'brave-search', 'github-issues', 'notion-search',
  'drive-list', 'drive-read', 'drive-write', 'drive-search',
  'calendar-list', 'calendar-create', 'calendar-free-slot',
  'pdf-generate', 'slack-notify', 'sms-alert',
  'stripe-balance', 'stripe-charges'
];

for (const tool of expectedTools) {
  const inDesc = toolDescriptions.includes(tool);
  const inCase = useToolCases.includes(tool);
  if (inDesc && inCase) {
    log('PASS', `Tool fully wired: ${tool} (description + useTool case)`);
  } else if (inDesc && !inCase) {
    log('FAIL', `Tool has description but NO useTool case: ${tool}`);
  } else if (!inDesc && inCase) {
    log('FAIL', `Tool has useTool case but NO description: ${tool}`);
  } else {
    log('FAIL', `Tool completely missing: ${tool}`);
  }
}

// ─── 8. Tool file function exports ──────────────────────────────────────

log('INFO', '\n=== 8. Tool File Export Validation ===');
const toolFiles = [
  { name: 'google-drive-tool.js', exports: ['listDriveFolder', 'readDriveFile', 'writeDriveFile', 'searchDriveFiles'] },
  { name: 'sms-tool.js', exports: ['sendSMS', 'sendCriticalAlert'] },
  { name: 'pdf-tool.js', exports: ['generatePDF', 'generateReportPDF'] },
  { name: 'calendar-tool.js', exports: ['listCalendarEvents', 'createCalendarEvent', 'findFreeSlot'] },
];

for (const { name, exports } of toolFiles) {
  const filePath = path.join(ROOT, 'src', 'tools', name);
  if (!fs.existsSync(filePath)) {
    log('FAIL', `Tool file missing: ${name}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  for (const exp of exports) {
    if (content.includes(`export async function ${exp}`) || content.includes(`export function ${exp}`)) {
      log('PASS', `${name} exports: ${exp}`);
    } else {
      log('FAIL', `${name} MISSING export: ${exp}`);
    }
  }
}

// ─── 9. No syntax issues in orchestrator.js imports ─────────────────────

log('INFO', '\n=== 9. Import Path Resolution ===');
const importPaths = [...orchestratorContent.matchAll(/from ['"]([^'"]+)['"];/g)].map(m => m[1]);
for (const imp of importPaths) {
  if (imp.startsWith('../')) {
    const resolved = path.resolve(path.dirname(orchestratorPath), imp);
    if (fs.existsSync(resolved) || fs.existsSync(resolved + '.js')) {
      log('PASS', `Import resolves: ${imp}`);
    } else {
      log('FAIL', `Import NOT FOUND: ${imp} → expected at ${resolved}`);
    }
  }
}

// ─── 10. Summary ────────────────────────────────────────────────────────

log('INFO', '\n==============================================');
log('INFO', `TOTAL: ${results.passed + results.failed + results.warnings} checks`);
log('PASS', `Passed: ${results.passed}`);
log('FAIL', `Failed: ${results.failed}`);
log('WARN', `Warnings: ${results.warnings}`);

if (results.failed === 0) {
  log('PASS', '\nAll critical checks passed. Ready for API key configuration and deployment.');
} else {
  log('FAIL', `\n${results.failed} critical issue(s) found. Fix before deployment.`);
}

// Save report
const reportPath = path.join(ROOT, 'tests', 'test-results.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: { passed: results.passed, failed: results.failed, warnings: results.warnings },
  logs: results.logs
}, null, 2));
console.log(`\nReport saved to: ${reportPath}`);
