// Stream Response — Server-Sent Events (SSE) streaming architecture

import { logger } from './logger.js';

class StreamingManager {
  constructor(env) {
    this.env = env;
    this.activeStreams = new Map();
    this.streamBuffer = new Map();
    this.streamHistory = new Map();
  }

  /**
   * Create a new stream
   * @param {string} streamId - Stream identifier
   * @param {object} options - Stream options
   * @returns {object} Stream object
   */
  createStream(streamId, options = {}) {
    const stream = {
      id: streamId,
      status: 'active',
      createdAt: new Date().toISOString(),
      completedAt: null,
      progress: 0,
      chunks: [],
      bufferSize: options.bufferSize || 1024,
      chunkDelay: options.chunkDelay || 50,
      error: null,
      metadata: options.metadata || {}
    };

    this.activeStreams.set(streamId, stream);
    this.streamBuffer.set(streamId, []);

    logger.info(`Streaming: Created stream ${streamId}`, {
      bufferSize: stream.bufferSize,
      chunkDelay: stream.chunkDelay
    });

    return stream;
  }

  /**
   * Send data chunk to stream
   * @param {string} streamId - Stream identifier
   * @param {string} data - Data to send
   * @param {string} type - Event type
   * @returns {boolean} Success
   */
  sendChunk(streamId, data, type = 'data') {
    const stream = this.activeStreams.get(streamId);
    if (!stream || stream.status !== 'active') {
      return false;
    }

    const chunk = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sequence: stream.chunks.length
    };

    stream.chunks.push(chunk);
    this.streamBuffer.get(streamId).push(chunk);

    logger.debug(`Streaming: Sent chunk to ${streamId}`, {
      type,
      sequence: chunk.sequence
    });

    return true;
  }

  /**
   * Update stream progress
   * @param {string} streamId - Stream identifier
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   * @returns {boolean} Success
   */
  updateProgress(streamId, progress, message = '') {
    const stream = this.activeStreams.get(streamId);
    if (!stream || stream.status !== 'active') {
      return false;
    }

    stream.progress = Math.min(100, Math.max(0, progress));

    this.sendChunk(streamId, JSON.stringify({
      progress: stream.progress,
      message
    }), 'progress');

    logger.debug(`Streaming: Updated progress for ${streamId}`, {
      progress: stream.progress,
      message
    });

    return true;
  }

  /**
   * Complete stream
   * @param {string} streamId - Stream identifier
   * @param {string} finalData - Final data to send
   * @returns {boolean} Success
   */
  completeStream(streamId, finalData = '') {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.status = 'completed';
    stream.completedAt = new Date().toISOString();
    stream.progress = 100;

    if (finalData) {
      this.sendChunk(streamId, finalData, 'data');
    }

    this.sendChunk(streamId, '', 'done');

    // Store in history
    this.streamHistory.set(streamId, {
      ...stream,
      duration: new Date(stream.completedAt) - new Date(stream.createdAt)
    });

    // Clean up active streams
    this.activeStreams.delete(streamId);
    this.streamBuffer.delete(streamId);

    logger.info(`Streaming: Completed stream ${streamId}`, {
      duration: stream.duration,
      chunkCount: stream.chunks.length
    });

    return true;
  }

  /**
   * Error stream
   * @param {string} streamId - Stream identifier
   * @param {string} error - Error message
   * @returns {boolean} Success
   */
  errorStream(streamId, error) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.status = 'error';
    stream.error = error;
    stream.completedAt = new Date().toISOString();

    this.sendChunk(streamId, error, 'error');

    // Store in history
    this.streamHistory.set(streamId, {
      ...stream,
      duration: new Date(stream.completedAt) - new Date(stream.createdAt)
    });

    // Clean up active streams
    this.activeStreams.delete(streamId);
    this.streamBuffer.delete(streamId);

    logger.error(`Streaming: Error in stream ${streamId}`, {
      error
    });

    return true;
  }

  /**
   * Get stream status
   * @param {string} streamId - Stream identifier
   * @returns {object|null} Stream status
   */
  getStreamStatus(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      return {
        id: stream.id,
        status: stream.status,
        progress: stream.progress,
        createdAt: stream.createdAt,
        chunkCount: stream.chunks.length,
        error: stream.error
      };
    }

    const history = this.streamHistory.get(streamId);
    if (history) {
      return {
        id: history.id,
        status: history.status,
        progress: history.progress,
        createdAt: history.createdAt,
        completedAt: history.completedAt,
        duration: history.duration,
        chunkCount: history.chunks.length,
        error: history.error
      };
    }

    return null;
  }

  /**
   * Get stream buffer
   * @param {string} streamId - Stream identifier
   * @returns {Array} Stream buffer
   */
  getStreamBuffer(streamId) {
    return this.streamBuffer.get(streamId) || [];
  }

  /**
   * Clear stream buffer
   * @param {string} streamId - Stream identifier
   * @returns {boolean} Success
   */
  clearStreamBuffer(streamId) {
    if (this.streamBuffer.has(streamId)) {
      this.streamBuffer.set(streamId, []);
      logger.debug(`Streaming: Cleared buffer for ${streamId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active streams
   * @returns {Array} Active streams
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values()).map(stream => ({
      id: stream.id,
      status: stream.status,
      progress: stream.progress,
      createdAt: stream.createdAt,
      chunkCount: stream.chunks.length
    }));
  }

  /**
   * Get stream history
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Stream history
   */
  getStreamHistory(limit = 50) {
    const history = Array.from(this.streamHistory.values())
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return history.slice(0, limit);
  }

  /**
   * Get streaming statistics
   * @returns {object} Streaming statistics
   */
  getStatistics() {
    const history = Array.from(this.streamHistory.values());
    const active = Array.from(this.activeStreams.values());

    const totalStreams = history.length + active.length;
    const completedStreams = history.filter(s => s.status === 'completed').length;
    const errorStreams = history.filter(s => s.status === 'error').length;

    const avgDuration = completedStreams > 0
      ? history.reduce((sum, s) => sum + (s.duration || 0), 0) / completedStreams
      : 0;

    const avgChunks = totalStreams > 0
      ? (history.reduce((sum, s) => sum + s.chunks.length, 0) +
         active.reduce((sum, s) => sum + s.chunks.length, 0)) / totalStreams
      : 0;

    return {
      totalStreams,
      activeStreams: active.length,
      completedStreams,
      errorStreams,
      successRate: completedStreams > 0 ? (completedStreams / totalStreams * 100).toFixed(1) + '%' : '0%',
      averageDuration: avgDuration.toFixed(0) + 'ms',
      averageChunks: avgChunks.toFixed(1)
    };
  }

  /**
   * Clear all active streams
   */
  clearActiveStreams() {
    const count = this.activeStreams.size;
    this.activeStreams.clear();
    this.streamBuffer.clear();
    logger.info(`Streaming: Cleared ${count} active streams`);
  }

  /**
   * Clear stream history
   */
  clearHistory() {
    this.streamHistory.clear();
    logger.info(`Streaming: Cleared stream history`);
  }

  /**
   * Reset all streaming data
   */
  reset() {
    this.activeStreams.clear();
    this.streamBuffer.clear();
    this.streamHistory.clear();
    logger.info(`Streaming: Reset all streaming data`);
  }
}

export { StreamingManager };
