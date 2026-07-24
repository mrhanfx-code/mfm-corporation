// Planning Mode - Core module for complex multi-file changes with user sign-off

import { detectPlanningTrigger } from './trigger-detector.js';
import { generatePlanningTemplate } from './planning-template.js';

// Re-export for use in agent-base.js
export { detectPlanningTrigger, generatePlanningTemplate };

/**
 * Planning Mode States
 */
export const PLANNING_STATES = {
  IDLE: 'idle',
  PLANNING: 'planning',
  AWAITING_APPROVAL: 'awaiting_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Planning Mode Configuration
 */
export const PLANNING_CONFIG = {
  // Maximum number of files in a plan before requiring planning mode
  MAX_FILES_THRESHOLD: 3,
  
  // Maximum estimated scope before requiring planning mode
  MAX_SCOPE_THRESHOLD: 'medium',
  
  // Keywords that trigger planning mode
  TRIGGER_KEYWORDS: [
    'refactor',
    'rewrite',
    'restructure',
    'migration',
    'multi-file',
    'multiple files',
    'bulk change',
    'mass update'
  ],
  
  // Plan template
  PLAN_TEMPLATE: `
# Implementation Plan

## Overview
[Brief description of what we're building]

## Files to Modify
- List each file with change description

## Implementation Order
1. [First change]
2. [Second change]
3. [Third change]

## Risks
- [Risk 1]
- [Risk 2]

## Verification
- [How to verify the changes]
`
};

/**
 * Planning Mode Class
 */
export class PlanningMode {
  constructor() {
    this.state = PLANNING_STATES.IDLE;
    this.currentPlan = null;
    this.approvalCallback = null;
  }

  /**
   * Check if planning mode should be triggered
   * @param {Object} context - Context for the request
   * @param {string} context.userRequest - User's request text
   * @param {Array} context.filesToModify - List of files to modify
   * @param {string} context.estimatedScope - Estimated scope (small/medium/large)
   * @returns {boolean} True if planning mode should be triggered
   */
  shouldTriggerPlanningMode(context) {
    const { userRequest, filesToModify, estimatedScope } = context;
    
    // Check file count threshold
    if (filesToModify && filesToModify.length >= PLANNING_CONFIG.MAX_FILES_THRESHOLD) {
      return true;
    }
    
    // Check scope threshold
    if (estimatedScope === 'large' || estimatedScope === 'xl') {
      return true;
    }
    
    // Check trigger keywords
    const lowerRequest = userRequest.toLowerCase();
    const hasTriggerKeyword = PLANNING_CONFIG.TRIGGER_KEYWORDS.some(
      keyword => lowerRequest.includes(keyword)
    );
    
    return hasTriggerKeyword;
  }

  /**
   * Enter planning mode
   * @param {Object} context - Context for planning
   * @returns {Object} Planning mode entry response
   */
  enterPlanningMode(context) {
    this.state = PLANNING_STATES.PLANNING;
    
    return {
      state: this.state,
      message: 'Planning mode activated. Analyzing request...',
      template: PLANNING_CONFIG.PLAN_TEMPLATE,
      context: {
        userRequest: context.userRequest,
        filesToModify: context.filesToModify || [],
        estimatedScope: context.estimatedScope || 'unknown'
      }
    };
  }

  /**
   * Submit a plan for approval
   * @param {Object} plan - The implementation plan
   * @param {Function} approvalCallback - Callback for approval/denial
   * @returns {Object} Plan submission response
   */
  submitPlan(plan, approvalCallback) {
    this.currentPlan = plan;
    this.approvalCallback = approvalCallback;
    this.state = PLANNING_STATES.AWAITING_APPROVAL;
    
    return {
      state: this.state,
      message: 'Plan submitted for approval',
      plan: this.currentPlan
    };
  }

  /**
   * Handle user approval
   * @returns {Object} Approval response
   */
  approvePlan() {
    if (this.state !== PLANNING_STATES.AWAITING_APPROVAL) {
      return {
        state: this.state,
        message: 'Cannot approve plan - not in awaiting approval state',
        success: false
      };
    }
    
    this.state = PLANNING_STATES.APPROVED;
    
    if (this.approvalCallback) {
      this.approvalCallback(true, this.currentPlan);
    }
    
    return {
      state: this.state,
      message: 'Plan approved - proceeding with execution',
      success: true,
      plan: this.currentPlan
    };
  }

  /**
   * Handle user denial
   * @param {string} reason - Reason for denial
   * @returns {Object} Denial response
   */
  denyPlan(reason = 'No reason provided') {
    if (this.state !== PLANNING_STATES.AWAITING_APPROVAL) {
      return {
        state: this.state,
        message: 'Cannot deny plan - not in awaiting approval state',
        success: false
      };
    }
    
    this.state = PLANNING_STATES.REJECTED;
    
    if (this.approvalCallback) {
      this.approvalCallback(false, this.currentPlan, reason);
    }
    
    return {
      state: this.state,
      message: 'Plan denied',
      reason,
      success: true
    };
  }

  /**
   * Start execution of approved plan
   * @returns {Object} Execution start response
   */
  startExecution() {
    if (this.state !== PLANNING_STATES.APPROVED) {
      return {
        state: this.state,
        message: 'Cannot start execution - plan not approved',
        success: false
      };
    }
    
    this.state = PLANNING_STATES.EXECUTING;
    
    return {
      state: this.state,
      message: 'Starting plan execution',
      plan: this.currentPlan,
      success: true
    };
  }

  /**
   * Mark execution as completed
   * @returns {Object} Completion response
   */
  completeExecution() {
    if (this.state !== PLANNING_STATES.EXECUTING) {
      return {
        state: this.state,
        message: 'Cannot mark as completed - not in executing state',
        success: false
      };
    }
    
    this.state = PLANNING_STATES.COMPLETED;
    
    return {
      state: this.state,
      message: 'Plan execution completed',
      success: true
    };
  }

  /**
   * Mark execution as failed
   * @param {string} error - Error message
   * @returns {Object} Failure response
   */
  failExecution(error) {
    if (this.state !== PLANNING_STATES.EXECUTING) {
      return {
        state: this.state,
        message: 'Cannot mark as failed - not in executing state',
        success: false
      };
    }
    
    this.state = PLANNING_STATES.FAILED;
    
    return {
      state: this.state,
      message: 'Plan execution failed',
      error,
      success: true
    };
  }

  /**
   * Reset planning mode
   * @returns {Object} Reset response
   */
  reset() {
    this.state = PLANNING_STATES.IDLE;
    this.currentPlan = null;
    this.approvalCallback = null;
    
    return {
      state: this.state,
      message: 'Planning mode reset',
      success: true
    };
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get current plan
   * @returns {Object|null} Current plan
   */
  getCurrentPlan() {
    return this.currentPlan;
  }
}

/**
 * Global planning mode instance
 */
export const planningMode = new PlanningMode();

/**
 * Convenience function to enter planning mode
 * @param {Object} context - Context for planning
 * @returns {Object} Planning mode entry response
 */
export function EnterPlanMode(context) {
  return planningMode.enterPlanningMode(context);
}
