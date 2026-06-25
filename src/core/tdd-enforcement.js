// TDD Enforcement — RED-GREEN-REFACTOR workflow enforcement

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const TDD_PHASES = {
  RED: 'red',
  GREEN: 'green',
  REFACTOR: 'refactor'
};

const TDD_REQUIREMENTS = {
  RED: {
    description: 'Write failing test before implementation',
    mustFail: true,
    mustExist: true
  },
  GREEN: {
    description: 'Implement minimal code to pass test',
    mustPass: true,
    minimalImplementation: true
  },
  REFACTOR: {
    description: 'Optimize code while tests pass',
    mustPass: true,
    testsMustExist: true
  }
};

class TDDEnforcementManager {
  constructor(env) {
    this.env = env;
    this.activeSessions = new Map();
  }

  async startSession(taskId, context = {}) {
    const sessionId = `tdd:${taskId}`;
    
    logger.info(`TDD Enforcement: Starting session for ${taskId}`, {
      sessionId,
      context
    });
    
    const session = {
      id: sessionId,
      taskId,
      currentPhase: TDD_PHASES.RED,
      phases: {
        [TDD_PHASES.RED]: { status: 'pending', tests: [], timestamp: null },
        [TDD_PHASES.GREEN]: { status: 'pending', implementation: null, timestamp: null },
        [TDD_PHASES.REFACTOR]: { status: 'pending', refactors: [], timestamp: null }
      },
      context,
      startTime: new Date().toISOString(),
      history: []
    };
    
    this.activeSessions.set(sessionId, session);
    await this.saveSession(session);
    
    return session;
  }

  async recordTest(sessionId, testPath, testCode, phase = TDD_PHASES.RED) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    const testRecord = {
      path: testPath,
      code: testCode,
      phase,
      timestamp: new Date().toISOString()
    };

    session.phases[phase].tests.push(testRecord);
    session.history.push({
      type: 'test_recorded',
      phase,
      testPath,
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Test recorded for ${sessionId}`, {
      phase,
      testPath
    });

    await this.saveSession(session);
    return testRecord;
  }

  async recordImplementation(sessionId, implementationPath, implementationCode, phase = TDD_PHASES.GREEN) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    const implementationRecord = {
      path: implementationPath,
      code: implementationCode,
      phase,
      timestamp: new Date().toISOString()
    };

    session.phases[phase].implementation = implementationRecord;
    session.history.push({
      type: 'implementation_recorded',
      phase,
      implementationPath,
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Implementation recorded for ${sessionId}`, {
      phase,
      implementationPath
    });

    await this.saveSession(session);
    return implementationRecord;
  }

  async recordRefactor(sessionId, refactorPath, refactorCode, description) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    const refactorRecord = {
      path: refactorPath,
      code: refactorCode,
      description,
      timestamp: new Date().toISOString()
    };

    session.phases[TDD_PHASES.REFACTOR].refactors.push(refactorRecord);
    session.history.push({
      type: 'refactor_recorded',
      refactorPath,
      description,
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Refactor recorded for ${sessionId}`, {
      refactorPath,
      description
    });

    await this.saveSession(session);
    return refactorRecord;
  }

  async validatePhase(sessionId, phase, testResults = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    const phaseKey = Object.keys(TDD_PHASES).find(key => TDD_PHASES[key] === phase) || phase;
    const requirements = TDD_REQUIREMENTS[phaseKey] || {};
    const validation = {
      phase,
      passed: true,
      errors: [],
      warnings: []
    };

    // RED phase validation
    if (phase === TDD_PHASES.RED) {
      if (session.phases[phase].tests.length === 0) {
        validation.passed = false;
        validation.errors.push('No tests written in RED phase');
      }

      if (requirements.mustFail && testResults.passed === true) {
        validation.passed = false;
        validation.errors.push('Test must fail in RED phase');
      }
    }

    // GREEN phase validation
    if (phase === TDD_PHASES.GREEN) {
      if (!session.phases[phase].implementation) {
        validation.passed = false;
        validation.errors.push('No implementation in GREEN phase');
      }

      if (requirements.mustPass && testResults.passed === false) {
        validation.passed = false;
        validation.errors.push('Tests must pass in GREEN phase');
      }

      if (session.phases[TDD_PHASES.RED].tests.length === 0) {
        validation.passed = false;
        validation.errors.push('RED phase must be completed before GREEN');
      }
    }

    // REFACTOR phase validation
    if (phase === TDD_PHASES.REFACTOR) {
      const redTests = session.phases[TDD_PHASES.RED]?.tests || [];
      const greenTests = session.phases[TDD_PHASES.GREEN]?.tests || [];
      
      if (redTests.length === 0 && greenTests.length === 0) {
        validation.passed = false;
        validation.errors.push('Tests must exist before REFACTOR');
      }

      if (requirements.mustPass && testResults.passed === false) {
        validation.passed = false;
        validation.errors.push('Tests must pass during REFACTOR');
      }
    }

    session.phases[phase].status = validation.passed ? 'completed' : 'failed';
    session.phases[phase].validation = validation;
    session.phases[phase].timestamp = new Date().toISOString();

    session.history.push({
      type: 'phase_validation',
      phase,
      passed: validation.passed,
      errors: validation.errors,
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Phase validation for ${sessionId}`, {
      phase,
      passed: validation.passed,
      errors: validation.errors
    });

    await this.saveSession(session);
    return validation;
  }

  async advancePhase(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    const currentPhase = session.currentPhase;
    const phaseOrder = [TDD_PHASES.RED, TDD_PHASES.GREEN, TDD_PHASES.REFACTOR];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      logger.warn(`TDD Enforcement: Cannot advance from ${currentPhase}`);
      return null;
    }

    const nextPhase = phaseOrder[currentIndex + 1];
    session.currentPhase = nextPhase;

    session.history.push({
      type: 'phase_advanced',
      from: currentPhase,
      to: nextPhase,
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Advanced to ${nextPhase} for ${sessionId}`);

    await this.saveSession(session);
    return session;
  }

  async completeSession(sessionId, finalResults = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`TDD Enforcement: Session not found ${sessionId}`);
      return null;
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.finalResults = finalResults;

    const duration = new Date(session.endTime) - new Date(session.startTime);

    session.history.push({
      type: 'session_completed',
      timestamp: new Date().toISOString()
    });

    logger.info(`TDD Enforcement: Session completed ${sessionId}`, {
      duration: `${duration}ms`,
      finalResults
    });

    await this.saveSession(session);
    this.activeSessions.delete(sessionId);

    return { success: true, session, duration };
  }

  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      taskId: session.taskId,
      currentPhase: session.currentPhase,
      phases: session.phases,
      status: session.status,
      history: session.history
    };
  }

  async enforceTestBeforeCode(taskId, codePath) {
    const sessionId = `tdd:${taskId}`;
    let session = this.activeSessions.get(sessionId);

    if (!session) {
      session = await this.startSession(taskId, { codePath });
    }

    if (session.currentPhase === TDD_PHASES.RED && session.phases[TDD_PHASES.RED].tests.length === 0) {
      logger.warn(`TDD Enforcement: Code written before test for ${taskId}`, {
        codePath
      });
      
      return {
        enforced: false,
        error: 'Test must be written before code (RED phase)',
        phase: session.currentPhase,
        requirement: 'Write failing test first'
      };
    }

    return {
      enforced: true,
      phase: session.currentPhase,
      message: 'TDD phase satisfied'
    };
  }

  async saveSession(session) {
    try {
      const memoryKey = `tdd_session:${session.id}`;
      await saveMemory(this.env, memoryKey, session);
    } catch (error) {
      logger.error(`TDD Enforcement: Failed to save session`, {
        error: error.message
      });
    }
  }

  getPhaseDescription(phase) {
    const phaseKey = Object.keys(TDD_PHASES).find(key => TDD_PHASES[key] === phase) || phase;
    return TDD_REQUIREMENTS[phaseKey]?.description || 'Unknown phase';
  }

  getPhaseRequirements(phase) {
    const phaseKey = Object.keys(TDD_PHASES).find(key => TDD_PHASES[key] === phase) || phase;
    return TDD_REQUIREMENTS[phaseKey] || {};
  }
}

export { TDDEnforcementManager, TDD_PHASES, TDD_REQUIREMENTS };
