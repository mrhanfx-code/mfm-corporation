// Circuit Breaker — KV-backed, opens after 5 failures, 60s cooldown

import { logger } from './logger.js';

const FAILURE_THRESHOLD = 5;
const COOLDOWN_SECONDS  = 60;

export class CircuitBreaker {
  constructor(name, kv) {
    this.name = name;
    this.kv   = kv;
    this.key  = `cb:${name}`;
  }

  async _getState() {
    if (!this.kv) return { open: false, failures: 0, openedAt: null };
    const raw = await this.kv.get(this.key);
    return raw ? JSON.parse(raw) : { open: false, failures: 0, openedAt: null };
  }

  async _setState(state) {
    if (!this.kv) return;
    await this.kv.put(this.key, JSON.stringify(state), {
      expirationTtl: COOLDOWN_SECONDS * 10,
    });
  }

  async isOpen() {
    const state = await this._getState();
    if (!state.open) return false;

    const elapsed = (Date.now() - state.openedAt) / 1000;
    if (elapsed >= COOLDOWN_SECONDS) {
      await this._setState({ open: false, failures: 0, openedAt: null });
      logger.info(this.name, 'circuit_breaker_reset', { elapsedSec: Math.round(elapsed) });
      return false;
    }
    return true;
  }

  async recordSuccess() {
    await this._setState({ open: false, failures: 0, openedAt: null });
  }

  async recordFailure() {
    const state    = await this._getState();
    const failures = (state.failures || 0) + 1;

    if (failures >= FAILURE_THRESHOLD) {
      await this._setState({ open: true, failures, openedAt: Date.now() });
      logger.error(this.name, 'circuit_breaker_opened', { failures });
    } else {
      await this._setState({ open: false, failures, openedAt: null });
      logger.warn(this.name, 'circuit_breaker_failure_recorded', { failures });
    }
  }

  async getStatus() {
    const state = await this._getState();
    return {
      name:     this.name,
      open:     state.open,
      failures: state.failures,
      cooldownRemaining: state.open
        ? Math.max(0, COOLDOWN_SECONDS - (Date.now() - state.openedAt) / 1000)
        : 0,
    };
  }
}
