// Verification Before Completion — Fix verification, regression detection, rollback mechanism

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const VERIFICATION_CHECKLIST = {
  code_review: {
    description: 'Code review completed',
    required: true
  },
  tests_pass: {
    description: 'All tests pass',
    required: true
  },
  no_regressions: {
    description: 'No regressions detected',
    required: true
  },
  documentation_updated: {
    description: 'Documentation updated',
    required: false
  },
  security_review: {
    description: 'Security review completed',
    required: true
  },
  performance_check: {
    description: 'Performance impact assessed',
    required: false
  }
};

class VerificationSystem {
  constructor(env) {
    this.env = env;
    this.activeVerifications = new Map();
    this.rollbackSnapshots = new Map();
  }

  async startVerification(taskId, fixDetails = {}) {
    const verificationId = `verify:${taskId}`;
    
    logger.info(`Verification System: Starting verification for ${taskId}`, {
      verificationId,
      fixDetails
    });
    
    const verification = {
      id: verificationId,
      taskId,
      fixDetails,
      status: 'in_progress',
      checklist: {},
      regressionTests: [],
      timestamp: new Date().toISOString(),
      history: []
    };
    
    // Initialize checklist
    for (const [key, item] of Object.entries(VERIFICATION_CHECKLIST)) {
      verification.checklist[key] = {
        ...item,
        completed: false,
        result: null
      };
    }
    
    this.activeVerifications.set(verificationId, verification);
    await this.saveVerification(verification);
    
    return verification;
  }

  async completeChecklistItem(verificationId, itemKey, result, notes = '') {
    const verification = this.activeVerifications.get(verificationId);
    if (!verification) {
      logger.warn(`Verification System: Verification not found ${verificationId}`);
      return null;
    }

    if (!verification.checklist[itemKey]) {
      logger.warn(`Verification System: Unknown checklist item ${itemKey}`);
      return null;
    }

    verification.checklist[itemKey].completed = true;
    verification.checklist[itemKey].result = result;
    verification.checklist[itemKey].notes = notes;
    verification.checklist[itemKey].timestamp = new Date().toISOString();

    verification.history.push({
      type: 'checklist_item_completed',
      item: itemKey,
      result,
      notes,
      timestamp: new Date().toISOString()
    });

    logger.info(`Verification System: Checklist item completed ${itemKey} for ${verificationId}`, {
      result
    });

    await this.saveVerification(verification);
    return verification.checklist[itemKey];
  }

  async detectRegressions(verificationId, baselineTests, currentTests) {
    const verification = this.activeVerifications.get(verificationId);
    if (!verification) {
      logger.warn(`Verification System: Verification not found ${verificationId}`);
      return null;
    }

    const regressions = [];
    
    // Compare test results
    for (const [testName, baselineResult] of Object.entries(baselineTests)) {
      const currentResult = currentTests[testName];
      
      if (!currentResult) {
        regressions.push({
          type: 'missing_test',
          test: testName,
          message: 'Test removed or not executed'
        });
        continue;
      }
      
      if (baselineResult.passed && !currentResult.passed) {
        regressions.push({
          type: 'test_failure',
          test: testName,
          message: 'Previously passing test now fails',
          baseline: baselineResult,
          current: currentResult
        });
      }
      
      if (baselineResult.duration && currentResult.duration) {
        const slowdown = (currentResult.duration - baselineResult.duration) / baselineResult.duration;
        if (slowdown > 0.5) {
          regressions.push({
            type: 'performance_regression',
            test: testName,
            message: `Test slowed down by ${(slowdown * 100).toFixed(1)}%`,
            slowdown: slowdown
          });
        }
      }
    }

    verification.regressionTests = regressions;
    verification.history.push({
      type: 'regression_detection',
      regressionsFound: regressions.length,
      timestamp: new Date().toISOString()
    });

    logger.info(`Verification System: Regression detection for ${verificationId}`, {
      regressionsFound: regressions.length
    });

    await this.saveVerification(verification);
    return regressions;
  }

  async createSnapshot(taskId, files) {
    const snapshotId = `snapshot:${taskId}:${Date.now()}`;
    
    logger.info(`Verification System: Creating snapshot for ${taskId}`, {
      snapshotId,
      fileCount: Object.keys(files).length
    });
    
    const snapshot = {
      id: snapshotId,
      taskId,
      files,
      timestamp: new Date().toISOString()
    };
    
    this.rollbackSnapshots.set(snapshotId, snapshot);
    await this.saveSnapshot(snapshot);
    
    return snapshotId;
  }

  async rollbackToSnapshot(snapshotId) {
    const snapshot = this.rollbackSnapshots.get(snapshotId);
    if (!snapshot) {
      logger.warn(`Verification System: Snapshot not found ${snapshotId}`);
      return null;
    }

    logger.info(`Verification System: Rolling back to snapshot ${snapshotId}`, {
      taskId: snapshot.taskId,
      fileCount: Object.keys(snapshot.files).length
    });

    return {
      success: true,
      snapshot,
      files: snapshot.files
    };
  }

  async completeVerification(verificationId, overallResult = {}) {
    const verification = this.activeVerifications.get(verificationId);
    if (!verification) {
      logger.warn(`Verification System: Verification not found ${verificationId}`);
      return null;
    }

    // Check if all required items are completed
    const requiredItems = Object.entries(verification.checklist)
      .filter(([_, item]) => item.required)
      .filter(([_, item]) => !item.completed);
    
    const hasUnfinishedRequired = requiredItems.length > 0;
    
    if (hasUnfinishedRequired) {
      verification.status = 'failed';
      verification.failureReason = 'Required checklist items not completed';
      verification.unfinishedItems = requiredItems.map(([key, _]) => key);
    } else if (verification.regressionTests.length > 0) {
      verification.status = 'failed';
      verification.failureReason = 'Regressions detected';
    } else {
      verification.status = 'passed';
    }

    verification.endTime = new Date().toISOString();
    verification.overallResult = overallResult;

    const duration = new Date(verification.endTime) - new Date(verification.timestamp);

    verification.history.push({
      type: 'verification_completed',
      status: verification.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    logger.info(`Verification System: Verification completed ${verificationId}`, {
      status: verification.status,
      duration: `${duration}ms`
    });

    await this.saveVerification(verification);
    this.activeVerifications.delete(verificationId);

    return { success: true, verification, duration };
  }

  getVerificationStatus(verificationId) {
    const verification = this.activeVerifications.get(verificationId);
    if (!verification) return null;

    return {
      id: verification.id,
      taskId: verification.taskId,
      status: verification.status,
      checklist: verification.checklist,
      regressionTests: verification.regressionTests,
      history: verification.history
    };
  }

  async saveVerification(verification) {
    try {
      const memoryKey = `verification:${verification.id}`;
      await saveMemory(this.env, memoryKey, verification);
    } catch (error) {
      logger.error(`Verification System: Failed to save verification`, {
        error: error.message
      });
    }
  }

  async saveSnapshot(snapshot) {
    try {
      const memoryKey = `snapshot:${snapshot.id}`;
      await saveMemory(this.env, memoryKey, snapshot);
    } catch (error) {
      logger.error(`Verification System: Failed to save snapshot`, {
        error: error.message
      });
    }
  }

  getChecklist() {
    return VERIFICATION_CHECKLIST;
  }

  getRequiredChecklistItems() {
    return Object.entries(VERIFICATION_CHECKLIST)
      .filter(([_, item]) => item.required)
      .map(([key, item]) => ({ key, ...item }));
  }
}

export { VerificationSystem, VERIFICATION_CHECKLIST };
