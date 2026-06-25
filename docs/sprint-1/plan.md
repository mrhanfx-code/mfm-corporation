# Sprint 1 Plan

**Sprint**: 1
**Phase**: Phase 1 - Agent Upgrades & Methodology Integration
**Start Date**: 2026-05-30
**End Date**: TBD (6 weeks estimated)
**Status**: In Progress

---

## Sprint Goals

1. Equip all 66 agents with required tools
2. Achieve 80% test coverage using Vitest
3. Integrate Superpowers (TDD, systematic debugging)
4. Integrate Compound Engineering (knowledge compounding, strategy documentation)
5. Integrate Taste Skill (premium UI generation for dashboard)

---

## Prioritized Tasks

### Priority 1: Agent Tool Upgrades (Weeks 1-3)

**Task 1.1**: Add d1-query tool to all agents missing it
- **Description**: Review all 66 agent files, identify agents missing d1-query tool, add tool declaration
- **Files**: src/agents/**/*.md
- **Estimated Time**: 2 days
- **Success Criteria**: All 66 agents have d1-query tool declared
- **Owner**: Sage (Backend Engineer)

**Task 1.2**: Add drive-write tool to content-creation agents
- **Description**: Identify content-creation agents (CMO team, CINO team), add drive-write tool
- **Files**: src/agents/cmo/*.md, src/agents/cino/*.md
- **Estimated Time**: 1 day
- **Success Criteria**: All content-creation agents have drive-write tool
- **Owner**: Sage (Backend Engineer)

**Task 1.3**: Add slack-notify to ops-coordinator and security-auditor
- **Description**: Add slack-notify tool to operations coordinator and security auditor agents
- **Files**: src/agents/coo/ops-coordinator.md, src/agents/cto/security-auditor.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Both agents have slack-notify tool
- **Owner**: Sage (Backend Engineer)

**Task 1.4**: Add sms-alert to critical ops agents
- **Description**: Add sms-alert tool to critical operations agents
- **Files**: src/agents/coo/*.md (critical agents only)
- **Estimated Time**: 0.5 days
- **Success Criteria**: Critical ops agents have sms-alert tool
- **Owner**: Sage (Backend Engineer)

**Task 1.5**: Add video-prompt to innovation-coach and trend-spotter
- **Description**: Add video-prompt tool to innovation coach and trend spotter agents
- **Files**: src/agents/cino/innovation-coach.md, src/agents/cino/trend-spotter.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Both agents have video-prompt tool
- **Owner**: Sage (Backend Engineer)

**Task 1.6**: Add social-post to cmo-team agents
- **Description**: Add social-post tool to all CMO team agents
- **Files**: src/agents/cmo/*.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: All CMO agents have social-post tool
- **Owner**: Sage (Backend Engineer)

### Priority 2: Agent Test Coverage (Weeks 2-4)

**Task 2.1**: Write tests for all 66 agents
- **Description**: Create Vitest tests for all 66 agent files (target: 80% coverage)
- **Files**: tests/unit/agents/*.test.js
- **Estimated Time**: 3 days
- **Success Criteria**: 80%+ test coverage for all agents
- **Owner**: Sage (Backend Engineer)

**Task 2.2**: Test agent initialization
- **Description**: Test agent initialization, tool parsing, input validation
- **Files**: tests/unit/agents/agent-init.test.js
- **Estimated Time**: 1 day
- **Success Criteria**: All agents initialize correctly
- **Owner**: Sage (Backend Engineer)

**Task 2.3**: Test agent-specific workflows
- **Description**: Test specific workflows for each agent type
- **Files**: tests/unit/agents/workflows.test.js
- **Estimated Time**: 2 days
- **Success Criteria**: All agent workflows tested
- **Owner**: Sage (Backend Engineer)

**Task 2.4**: Add integration tests for multi-agent workflows
- **Description**: Test multi-agent coordination and handoffs
- **Files**: tests/integration/multi-agent.test.js
- **Estimated Time**: 2 days
- **Success Criteria**: Multi-agent workflows tested
- **Owner**: Sage (Backend Engineer)

### Priority 3: Superpowers Integration (Weeks 3-4)

**Task 3.1**: Install Superpowers in Cascade for MFM project
- **Description**: Install Superpowers plugin, configure tool mapping for MFM-specific tools
- **Files**: package.json, .windsurf/config.json
- **Estimated Time**: 1 day
- **Success Criteria**: Superpowers installed and configured
- **Owner**: Sage (Backend Engineer)

**Task 3.2**: Configure tool mapping for MFM-specific tools
- **Description**: Map MFM tools to Superpowers methodology
- **Files**: .windsurf/skills/superpowers-config.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Tool mapping configured
- **Owner**: Sage (Backend Engineer)

**Task 3.3**: Implement TDD for agent development
- **Description**: Apply TDD workflow to agent development (RED-GREEN-REFACTOR)
- **Files**: docs/development/tdd-workflow.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: TDD workflow documented
- **Owner**: Sage (Backend Engineer)

**Task 3.4**: Use systematic debugging for agent issues
- **Description**: Apply systematic debugging protocol to agent troubleshooting
- **Files**: docs/development/debugging-protocol.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Debugging protocol documented
- **Owner**: Sage (Backend Engineer)

### Priority 4: Compound Engineering Integration (Weeks 4-5)

**Task 4.1**: Install Compound Engineering in Cascade for MFM project
- **Description**: Install Compound Engineering plugin, configure for MFM
- **Files**: package.json, .windsurf/config.json
- **Estimated Time**: 1 day
- **Success Criteria**: Compound Engineering installed
- **Owner**: Sage (Backend Engineer)

**Task 4.2**: Create STRATEGY.md for MFM product strategy
- **Description**: Document MFM product strategy using Compound Engineering format
- **Files**: STRATEGY.md
- **Estimated Time**: 1 day
- **Success Criteria**: STRATEGY.md created
- **Owner**: Remy (Producer)

**Task 4.3**: Use ce-compound for agent upgrade documentation
- **Description**: Document agent upgrade learnings using ce-compound
- **Files**: docs/learnings/agent-upgrade-compound.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Learnings documented
- **Owner**: Sage (Backend Engineer)

**Task 4.4**: Use ce-code-review for agent code quality gates
- **Description**: Apply ce-code-review to agent file changes
- **Files**: docs/reviews/agent-code-review.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Code review process documented
- **Owner**: Ivy (QA Engineer)

**Task 4.5**: Use ce-product-pulse for agent performance monitoring
- **Description**: Set up ce-product-pulse for agent performance tracking
- **Files**: docs/monitoring/agent-pulse.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Performance monitoring configured
- **Owner**: Sage (Backend Engineer)

### Priority 5: Taste Skill Integration (Weeks 5-6)

**Task 5.1**: Install taste-skill via npx skills for MFM project
- **Description**: Install taste-skill, configure dials for MFM dashboard
- **Files**: package.json, .windsurf/config.json
- **Estimated Time**: 1 day
- **Success Criteria**: taste-skill installed
- **Owner**: Sage (Backend Engineer)

**Task 5.2**: Configure dials: DESIGN_VARIANCE=6, MOTION_INTENSITY=5, VISUAL_DENSITY=7
- **Description**: Configure taste-skill dials for premium dashboard design
- **Files**: .windsurf/skills/taste-config.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Dials configured
- **Owner**: Sage (Backend Engineer)

**Task 5.3**: Use redesign-skill to audit current dashboard (mfm-corp.cc.cd)
- **Description**: Audit current dashboard using taste-skill redesign-skill
- **Files**: docs/design/dashboard-audit.md
- **Estimated Time**: 1 day
- **Success Criteria**: Dashboard audit completed
- **Owner**: Sage (Backend Engineer)

**Task 5.4**: Apply taste-skill directives to dashboard components
- **Description**: Apply anti-slop directives to dashboard components
- **Files**: src/dashboard/**/*.js
- **Estimated Time**: 2 days
- **Success Criteria**: Dashboard components updated
- **Owner**: Sage (Backend Engineer)

**Task 5.5**: Implement anti-slop directives (banned fonts, colors, patterns)
- **Description**: Document and enforce anti-slop directives
- **Files**: docs/design/anti-slop-directives.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: Anti-slop directives documented
- **Owner**: Sage (Backend Engineer)

**Task 5.6**: Add motion physics (spring physics instead of linear easing)
- **Description**: Implement spring physics for dashboard animations
- **Files**: src/dashboard/animations.js
- **Estimated Time**: 1 day
- **Success Criteria**: Motion physics implemented
- **Owner**: Sage (Backend Engineer)

**Task 5.7**: Test with CEO Remy for user experience
- **Description**: User testing with CEO Remy for dashboard UX
- **Files**: docs/testing/ux-test-results.md
- **Estimated Time**: 0.5 days
- **Success Criteria**: UX test completed
- **Owner**: Remy (Producer)

---

## Success Criteria

- All 66 agents equipped with required tools
- 80%+ test coverage for all agents
- Superpowers integrated in Cascade for MFM
- Compound Engineering integrated in Cascade for MFM
- Taste Skill integrated in Cascade for MFM
- Dashboard redesigned with premium standards
- STRATEGY.md created for MFM
- All tests passing (72+ tests)

---

## Dependencies

**External Dependencies**:
- Node.js v24.14.0
- npm
- Vitest v2.1.9
- Cloudflare Workers CLI (wrangler)
- Superpowers plugin
- Compound Engineering plugin
- Taste Skill plugin

**Internal Dependencies**:
- Phase 0 must be completed ✅
- PROJECT-CORE-UPGRADE-MASTER.md must be updated
- PROJECT_BRIEF.md must be current

---

## Risks

**Risk 1**: Agent tool upgrades may break existing functionality
- **Mitigation**: Test each agent after tool addition
- **Owner**: Ivy (QA Engineer)

**Risk 2**: Test coverage may not reach 80%
- **Mitigation**: Prioritize critical agent tests first
- **Owner**: Sage (Backend Engineer)

**Risk 3**: Plugin integration may conflict with existing workflows
- **Mitigation**: Test plugins in isolated environment first
- **Owner**: Sage (Backend Engineer)

**Risk 4**: Dashboard redesign may introduce bugs
- **Mitigation**: User testing before deployment
- **Owner**: Ivy (QA Engineer)

---

## Definition of Done

- [ ] All 66 agents have required tools
- [ ] 80%+ test coverage achieved
- [ ] All tests passing (72+ tests)
- [ ] Superpowers integrated and functional
- [ ] Compound Engineering integrated and functional
- [ ] Taste Skill integrated and functional
- [ ] Dashboard redesigned with premium standards
- [ ] STRATEGY.md created
- [ ] Documentation updated
- [ ] QA sign-off received
- [ ] PR created and merged to main
