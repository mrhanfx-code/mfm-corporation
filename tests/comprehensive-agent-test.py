#!/usr/bin/env python3
"""Comprehensive Agent & Tool Validation Test for MFM Corporation
Run: python tests/comprehensive-agent-test.py
Tests: syntax, imports, agent map consistency, tool coverage
"""

import os, re, json, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

results = {"passed": 0, "failed": 0, "warnings": 0, "logs": []}

def log(level, msg):
    results["logs"].append({"level": level, "msg": msg})
    icon = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️", "INFO": "ℹ️"}
    print(f"{icon.get(level, '')} {msg}")
    results[level.lower()] += 1

# ─── 1. New agent files exist ────────────────────────────────────────────

log("INFO", "=== 1. New Agent File Existence ===")
NEW_AGENTS = {
    "coo": ["meeting-scheduler", "reporting-analyst", "project-manager", "notification-manager",
            "google-drive-agent", "analytics-reporter", "pdf-generator", "quality-control-manager"],
    "cto": ["frontend-developer", "backend-developer", "qa-engineer", "database-specialist", "cloud-engineer"],
    "cfo": ["grant-tracker", "revenue-analyst"],
    "cino": ["technology-tracker", "data-analyst"],
    "cmo": ["email-marketing-agent"],
}

for dept, agents in NEW_AGENTS.items():
    for agent in agents:
        fpath = ROOT / "src" / "agents" / dept / f"{agent}.js"
        if fpath.exists():
            log("PASS", f"Agent file exists: {dept}/{agent}.js")
        else:
            log("FAIL", f"Agent file MISSING: {dept}/{agent}.js")

# ─── 2. New tool files exist ──────────────────────────────────────────────

log("INFO", "\n=== 2. New Tool File Existence ===")
NEW_TOOLS = ["google-drive-tool.js", "sms-tool.js", "pdf-tool.js", "calendar-tool.js"]
for tool in NEW_TOOLS:
    fpath = ROOT / "src" / "tools" / tool
    if fpath.exists():
        log("PASS", f"Tool file exists: {tool}")
    else:
        log("FAIL", f"Tool file MISSING: {tool}")

# ─── 3. Agent class export validation ───────────────────────────────────

log("INFO", "\n=== 3. Agent Class Export Validation ===")
for dept, agents in NEW_AGENTS.items():
    for agent in agents:
        fpath = ROOT / "src" / "agents" / dept / f"{agent}.js"
        if not fpath.exists():
            continue
        content = fpath.read_text("utf-8")
        # Class name from kebab-case: meeting-scheduler -> MeetingScheduler
        parts = agent.split("-")
        class_name = "".join(p.capitalize() for p in parts)

        if f"export class {class_name}" in content:
            log("PASS", f"Export class found: {class_name} in {dept}/{agent}.js")
        else:
            log("FAIL", f"Missing export class {class_name} in {dept}/{agent}.js")

        if "extends AgentBase" in content:
            log("PASS", f"Extends AgentBase: {dept}/{agent}.js")
        else:
            log("FAIL", f"Does not extend AgentBase: {dept}/{agent}.js")

        if "systemPrompt:" in content:
            log("PASS", f"Has systemPrompt: {dept}/{agent}.js")
        else:
            log("WARN", f"Missing systemPrompt: {dept}/{agent}.js")

        if "tools:" in content:
            log("PASS", f"Has tools array: {dept}/{agent}.js")
        else:
            log("WARN", f"Missing tools array: {dept}/{agent}.js")

# ─── 4. Orchestrator AGENT_MAP completeness ────────────────────────────

log("INFO", "\n=== 4. Orchestrator Agent Map Completeness ===")
orchestrator = (ROOT / "src" / "core" / "orchestrator.js").read_text("utf-8")

agent_map_match = re.search(r"const AGENT_MAP = \{([^}]+)\}", orchestrator, re.DOTALL)
if agent_map_match:
    agent_map_keys = re.findall(r"'([^']+)'\s*:", agent_map_match.group(1))
    log("INFO", f"AGENT_MAP contains {len(agent_map_keys)} agents")

    unique_keys = list(dict.fromkeys(agent_map_keys))
    if len(unique_keys) != len(agent_map_keys):
        log("FAIL", f"Duplicate keys in AGENT_MAP! Total: {len(agent_map_keys)}, Unique: {len(unique_keys)}")
    else:
        log("PASS", f"No duplicate keys in AGENT_MAP ({len(unique_keys)} unique)")

    EXPECTED_ALL = [
        "ops-coordinator", "quality-ops-reviewer", "process-optimizer", "data-governance-agent", "strategic-planner",
        "tech-advisor", "devops-monitor", "security-auditor", "integration-agent", "development-advisor",
        "content-writer", "market-analyst", "customer-success-agent", "social-media-agent", "media-producer",
        "finance-planner", "risk-assessor",
        "research-agent", "idea-generator", "trend-spotter", "innovation-coach", "innovation-analyst", "mcp-llm-agent",
        "legal-advisor",
        "meeting-scheduler", "reporting-analyst", "project-manager", "notification-manager", "google-drive-agent",
        "analytics-reporter", "pdf-generator", "quality-control-manager",
        "frontend-developer", "backend-developer", "qa-engineer", "database-specialist", "cloud-engineer",
        "email-marketing-agent", "grant-tracker", "revenue-analyst",
        "technology-tracker", "data-analyst",
    ]

    for agent in EXPECTED_ALL:
        if agent in agent_map_keys:
            log("PASS", f"AGENT_MAP has: {agent}")
        else:
            log("FAIL", f"AGENT_MAP MISSING: {agent}")

    for key in agent_map_keys:
        if key not in EXPECTED_ALL:
            log("WARN", f"AGENT_MAP has unexpected agent: {key}")
else:
    log("FAIL", "Could not parse AGENT_MAP from orchestrator.js")

# ─── 5. Import / AGENT_MAP consistency ─────────────────────────────────

log("INFO", "\n=== 5. Import / AGENT_MAP Consistency ===")
import_classes = re.findall(r"import \{ ([^}]+) \} from", orchestrator)
imported = []
for block in import_classes:
    imported.extend([c.strip() for c in block.split(",")])

agent_map_classes = re.findall(r"'([^']+)'\s*:\s*(\w+)", orchestrator)
for key, class_name in agent_map_classes:
    if class_name in imported:
        log("PASS", f"AGENT_MAP class imported: {key} → {class_name}")
    else:
        log("FAIL", f"AGENT_MAP class NOT imported: {key} → {class_name}")

# ─── 6. Panel registry consistency ───────────────────────────────────────

log("INFO", "\n=== 6. Panel Agent Registry Consistency ===")
panel_match = re.search(r"const PANEL_AGENT_REGISTRY = \{([^}]+)\}", orchestrator, re.DOTALL)
if panel_match:
    panel_keys = re.findall(r"'([^']+)'\s*:", panel_match.group(1))
    log("INFO", f"PANEL_AGENT_REGISTRY has {len(panel_keys)} agents")
    if agent_map_keys:
        in_map = [k for k in panel_keys if k in agent_map_keys]
        not_in_map = [k for k in panel_keys if k not in agent_map_keys]
        log("INFO", f"{len(in_map)}/{len(panel_keys)} panel agents exist in AGENT_MAP")
        for agent in not_in_map:
            log("WARN", f"Panel agent not in AGENT_MAP: {agent}")
else:
    log("FAIL", "Could not parse PANEL_AGENT_REGISTRY")

# ─── 7. Agent-base.js tool coverage ─────────────────────────────────────

log("INFO", "\n=== 7. Agent-Base Tool Coverage ===")
agent_base = (ROOT / "src" / "core" / "agent-base.js").read_text("utf-8")

tool_descriptions = re.findall(r"'([a-z-]+)'\s*:", agent_base.split("const TOOL_DESCRIPTIONS = {")[1].split("};")[0] if "const TOOL_DESCRIPTIONS = {" in agent_base else "")
use_tool_cases = re.findall(r"case '([a-z-]+)':", agent_base)

EXPECTED_TOOLS = [
    "web-fetch", "send-email", "exa-search", "social-post",
    "perplexity-search", "brave-search", "github-issues", "notion-search",
    "drive-list", "drive-read", "drive-write", "drive-search",
    "calendar-list", "calendar-create", "calendar-free-slot",
    "pdf-generate", "slack-notify", "sms-alert",
    "stripe-balance", "stripe-charges"
]

for tool in EXPECTED_TOOLS:
    in_desc = tool in tool_descriptions
    in_case = tool in use_tool_cases
    if in_desc and in_case:
        log("PASS", f"Tool fully wired: {tool}")
    elif in_desc and not in_case:
        log("FAIL", f"Tool has description but NO useTool case: {tool}")
    elif not in_desc and in_case:
        log("FAIL", f"Tool has useTool case but NO description: {tool}")
    else:
        log("FAIL", f"Tool completely missing: {tool}")

# ─── 8. Tool file function exports ─────────────────────────────────────

log("INFO", "\n=== 8. Tool File Export Validation ===")
TOOL_CHECKS = [
    ("google-drive-tool.js", ["listDriveFolder", "readDriveFile", "writeDriveFile", "searchDriveFiles"]),
    ("sms-tool.js", ["sendSMS", "sendCriticalAlert"]),
    ("pdf-tool.js", ["generatePDF", "generateReportPDF"]),
    ("calendar-tool.js", ["listCalendarEvents", "createCalendarEvent", "findFreeSlot"]),
]

for name, exports in TOOL_CHECKS:
    fpath = ROOT / "src" / "tools" / name
    if not fpath.exists():
        log("FAIL", f"Tool file missing: {name}")
        continue
    content = fpath.read_text("utf-8")
    for exp in exports:
        if f"export async function {exp}" in content or f"export function {exp}" in content:
            log("PASS", f"{name} exports: {exp}")
        else:
            log("FAIL", f"{name} MISSING export: {exp}")

# ─── 9. Import path resolution ──────────────────────────────────────────

log("INFO", "\n=== 9. Import Path Resolution ===")
imports = re.findall(r"from ['\"]([^'\"]+)['\"];", orchestrator)
for imp in imports:
    if imp.startswith("../"):
        resolved = (ROOT / "src" / "core" / imp).resolve()
        js_file = Path(str(resolved) + ".js")
        if resolved.exists() or js_file.exists():
            log("PASS", f"Import resolves: {imp}")
        else:
            log("FAIL", f"Import NOT FOUND: {imp}")

# ─── 10. Summary ─────────────────────────────────────────────────────────

log("INFO", "\n" + "=" * 50)
log("INFO", f"TOTAL CHECKS: {results['passed'] + results['failed'] + results['warnings']}")
log("PASS", f"Passed: {results['passed']}")
log("FAIL", f"Failed: {results['failed']}")
log("WARN", f"Warnings: {results['warnings']}")

if results["failed"] == 0:
    log("PASS", "\nAll critical checks passed. Ready for API keys + deployment.")
else:
    log("FAIL", f"\n{results['failed']} critical issue(s) found. Fix before deployment.")

report_path = ROOT / "tests" / "test-results.json"
report_path.write_text(json.dumps({
    "timestamp": str(__import__("datetime").datetime.utcnow().isoformat() + "Z"),
    "summary": {k: results[k] for k in ["passed", "failed", "warnings"]},
    "logs": results["logs"]
}, indent=2))
print(f"\nReport saved to: {report_path}")

sys.exit(1 if results["failed"] > 0 else 0)
