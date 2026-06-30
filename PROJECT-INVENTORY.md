# Project Inventory

**Last Updated**: 2026-05-30
**Purpose**: Track all projects, their status, and location to avoid confusion

---

## Active Projects

### PROJECT-CORE-UPGRADE (Main)
- **Location**: D:\documents\MFM-Corporation\
- **Master Plan**: PROJECT-CORE-UPGRADE-MASTER.md
- **Phase Plans**: plan/PROJECT-CORE-UPGRADE-PHASE-*.md
- **Status**: In Progress
- **Current Phase**: Phase 1 (Agent Upgrades)
- **Phases Completed**: Phase 0, Phase 5
- **Phases Pending**: Phase 1, 2, 3, 4, 6
- **Total Pending Tasks**: 207
- **Production System**: Local (D:\documents\MFM-Corporation)
- **GitHub Repo**: mrhanfx-code/mfm-corporation (placeholder only)

---

## Completed Projects

### PROJECT-ADVANCE-UPGRADE
- **Location**: plan/PROJECT-ADVANCE-UPGRADE.md
- **Status**: ✅ COMPLETED
- **Completion Date**: 2026-05-30
- **Description**: Phase 5 Advanced Features (181 tests passed)
- **Notes**: Integrated into PROJECT-CORE-UPGRADE as Phase 5

---

## Archived Projects

### PROJECT-BLUEPRINT
- **Location**: D:\documents\MFM-Corporation\PROJECT-BLUEPRINT-IMPLEMENTATION-REPORT.md
- **Status**: 📋 ARCHIVED
- **Archive Date**: 2026-05-30
- **Reason**: Report only, no implementation plan
- **Notes**: Keep for reference - contains dashboard recommendations

---

## Deleted Projects

### PROJECT-CODEGRAPH
- **Status**: ❌ DELETED
- **Deletion Date**: 2026-05-30
- **Reason**: Technical blocker - cannot run in Cloudflare Workers
- **Files Deleted**:
  - PROJECT-CODEGRAPH-IMPLEMENTATION-PLAN.md
  - PROJECT-CODEGRAPH-IMPLEMENTATION-SUMMARY.md
  - PROJECT-CODEGRAPH-MFM-IMPLEMENTATION-SUMMARY.md
  - PROJECT-CODEGRAPH-CASCADE-IMPLEMENTATION-SUMMARY.md
- **Notes**: Local development only, production deployment blocked

---

## Naming Convention

- **PROJECT-**: Main project files
- **PHASE-**: Phase-specific plans
- **REPORT-**: Status and completion reports
- **ARCHIVE-**: Archived reference materials

---

## Weekly Review Checklist

- [ ] Update PROJECT-CORE-UPGRADE-MASTER.md with latest phase status
- [ ] Review PROJECT-INVENTORY.md for accuracy
- [ ] Move completed projects to "Completed Projects" section
- [ ] Archive non-viable projects to "Archived Projects" section
- [ ] Delete obsolete projects (document reason)
- [ ] Update DAILY-STATUS.md with weekly summary

---

## System Notes

**Production vs Development**:
- Production system runs locally at D:\documents\MFM-Corporation
- GitHub repository (mrhanfx-code/mfm-corporation) is placeholder only
- Do not assume GitHub repo reflects actual system state

**Live URLs**:
- Dashboard: https://mfm-corp.cc.cd
- GitHub Pages: https://mrhanfx-code.github.io/mfm-corporation
- Bot Worker: https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev

**Infrastructure**:
- Cloudflare Workers (deployed)
- D1 Database (ID: 91e8699c-2731-4f0d-8a09-9f9765e7e4cc)
- KV Namespace (bound)
- R2 Bucket (mfm-corporation-uploads)
- SendGrid API (configured)
