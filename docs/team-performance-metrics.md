# Team Performance Metrics

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

Team performance metrics provide quantitative and qualitative measurements of team effectiveness, productivity, and quality. This system enables data-driven decision-making, performance optimization, and continuous improvement across the MFM Corporation agent framework.

## Metric Categories

### 1. Productivity Metrics

**Definition**: Measures of output volume and efficiency

**Metrics**:
- **Tasks Completed**: Number of tasks completed per day/week/month
- **Task Completion Rate**: Percentage of tasks completed vs. assigned
- **Average Task Duration**: Mean time to complete tasks
- **Task Throughput**: Tasks completed per unit time
- **Queue Size**: Number of pending tasks in queue

**Target Values**:
- Task Completion Rate: 90%+
- Average Task Duration: < 30 minutes (varies by task complexity)
- Task Throughput: 10+ tasks/day per team

**Data Source**: `tasks` table in D1 database

**Implementation**:
```sql
SELECT 
  agent,
  COUNT(*) as tasks_completed,
  AVG(julianday(completed_at) - julianday(created_at)) * 24 * 60 as avg_duration_minutes
FROM tasks
WHERE status = 'completed'
  AND completed_at >= date('now', '-7 days')
GROUP BY agent
```

---

### 2. Quality Metrics

**Definition**: Measures of output quality and accuracy

**Metrics**:
- **Quality Score**: Average quality score (0-100)
- **Quality Gate Pass Rate**: Percentage of gates passed
- **Redo Rate**: Percentage of tasks requiring redo
- **Error Rate**: Percentage of tasks with errors
- **Defect Density**: Defects per 1000 lines of code

**Target Values**:
- Quality Score: 85%+
- Quality Gate Pass Rate: 95%+
- Redo Rate: < 5%
- Error Rate: < 10%

**Data Source**: `tasks` table, `quality_gates` table, `error_logs` table

**Implementation**:
```sql
SELECT 
  agent,
  AVG(quality_score) as avg_quality_score,
  COUNT(CASE WHEN quality_score >= 85 THEN 1 END) * 100.0 / COUNT(*) as pass_rate
FROM tasks
WHERE status = 'completed'
  AND completed_at >= date('now', '-7 days')
GROUP BY agent
```

---

### 3. Efficiency Metrics

**Definition**: Measures of resource utilization and efficiency

**Metrics**:
- **Resource Utilization**: Percentage of time agents are active
- **Idle Time**: Time agents spend waiting for tasks
- **Blocking Time**: Time agents spend blocked
- **Efficiency Score**: Output per unit of resource

**Target Values**:
- Resource Utilization: 70-85% (avoid over-utilization)
- Idle Time: < 15%
- Blocking Time: < 10%
- Efficiency Score: 80%+

**Data Source**: `agents` table, `tasks` table, `executives` table

**Implementation**:
```sql
SELECT 
  agent,
  SUM(CASE WHEN status = 'working' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as utilization_rate
FROM agents
WHERE last_updated >= date('now', '-7 days')
GROUP BY agent
```

---

### 4. Collaboration Metrics

**Definition**: Measures of team coordination and handoff effectiveness

**Metrics**:
- **Handoff Success Rate**: Percentage of successful handoffs
- **Handoff Time**: Average time to complete handoffs
- **Cross-Team Tasks**: Number of tasks involving multiple teams
- **Escalation Rate**: Percentage of tasks escalated
- **Team Coordination Score**: Overall coordination effectiveness

**Target Values**:
- Handoff Success Rate: 95%+
- Handoff Time: < 5 minutes
- Escalation Rate: < 5%
- Team Coordination Score: 85%+

**Data Source**: `team_handoffs` table, `escalations` table

**Implementation**:
```sql
SELECT 
  from_team,
  COUNT(*) as total_handoffs,
  COUNT(CASE WHEN handoff_status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  AVG(julianday(completion_timestamp) - julianday(created_at)) * 24 * 60 as avg_handoff_minutes
FROM team_handoffs
WHERE created_at >= date('now', '-7 days')
GROUP BY from_team
```

---

### 5. Responsiveness Metrics

**Definition**: Measures of response time and availability

**Metrics**:
- **Response Time**: Average time to respond to tasks
- **First Response Time**: Time to first response on new tasks
- **Resolution Time**: Time to fully resolve tasks
- **Availability**: Percentage of time agent is available
- **SLA Compliance**: Percentage of tasks meeting SLA

**Target Values**:
- Response Time: < 5 minutes
- First Response Time: < 2 minutes
- Resolution Time: < 30 minutes
- Availability: 95%+
- SLA Compliance: 90%+

**Data Source**: `tasks` table, `agents` table

**Implementation**:
```sql
SELECT 
  agent,
  AVG(julianday(completed_at) - julianday(created_at)) * 24 * 60 as avg_resolution_minutes,
  COUNT(CASE WHEN julianday(completed_at) - julianday(created_at) * 24 * 60 <= 30 THEN 1 END) * 100.0 / COUNT(*) as sla_compliance
FROM tasks
WHERE status = 'completed'
  AND completed_at >= date('now', '-7 days')
GROUP BY agent
```

---

### 6. Learning Metrics

**Definition**: Measures of improvement and knowledge accumulation

**Metrics**:
- **Learning Rate**: Rate of improvement over time
- **Knowledge Base Growth**: Growth in decision documentation
- **Error Reduction**: Reduction in error rate over time
- **Best Practice Adoption**: Adoption of best practices
- **Innovation Rate**: New solutions and improvements

**Target Values**:
- Learning Rate: 5%+ improvement per month
- Knowledge Base Growth: 10+ decisions per week
- Error Reduction: 10%+ reduction per month
- Best Practice Adoption: 80%+
- Innovation Rate: 2+ improvements per week

**Data Source**: `decisions` table, `error_logs` table, `metrics` table

**Implementation**:
```sql
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as decisions_logged,
  AVG(confidence) as avg_confidence
FROM decisions
WHERE created_at >= date('now', '-30 days')
GROUP BY week
ORDER BY week
```

---

## Metric Dashboard

**Dashboard Components**:
1. **Overview Panel**: Key metrics at a glance
2. **Team Performance Panel**: Per-team metrics comparison
3. **Trend Analysis Panel**: Historical trends over time
4. **Alert Panel**: Metrics requiring attention
5. **Detail Panel**: Drill-down into specific metrics

**Real-Time Updates**:
- WebSocket connection for live updates
- Refresh every 30 seconds for non-critical metrics
- Alert on threshold breaches

**Alert Thresholds**:
- Quality Score < 80%: Alert
- Task Completion Rate < 85%: Warning
- Error Rate > 15%: Alert
- Handoff Success Rate < 90%: Warning
- SLA Compliance < 85%: Alert

## Metric Calculation Engine

**Implementation**: `src/core/metrics-engine.js`

**Features**:
- Automatic metric calculation on schedule
- Configurable calculation intervals (hourly, daily, weekly)
- Metric aggregation and rollup
- Trend analysis and forecasting
- Anomaly detection

**Schedule**:
- Real-time metrics: Every 5 minutes
- Hourly metrics: Every hour
- Daily metrics: Every day at midnight
- Weekly metrics: Every Sunday at midnight

## Integration Points

**Database**:
- D1 database (metrics table)
- database/schema.sql (metrics tracking schema)

**Error Recovery System**:
- Error rate tracking
- Recovery success rate tracking
- Escalation rate tracking

**Quality Gate System**:
- Gate pass/fail rate tracking
- Quality score aggregation
- Gate failure analysis

**Escalation System**:
- Escalation rate by level
- Escalation resolution time
- Escalation success rate

## Performance Targets

**Overall Targets**:
- Overall Quality Score: 85%+
- Overall Task Completion Rate: 90%+
- Overall Error Rate: < 10%
- Overall SLA Compliance: 90%+

**Team-Specific Targets**:
- Development Teams: Quality Score 90%+, Task Completion Rate 95%+
- QA Teams: Error Detection Rate 95%+, Test Coverage 80%+
- Operations Teams: Availability 99%+, Response Time < 5 minutes

## References

- Phase 2 Plan: plan/PROJECT-CORE-UPGRADE-PHASE-2.md
- Sprint 2 Plan: docs/sprint-2/plan.md
- Database Schema: database/schema.sql
- Quality Gate System: docs/quality-gate-system.md
- Error Categories: docs/error-categories.md
