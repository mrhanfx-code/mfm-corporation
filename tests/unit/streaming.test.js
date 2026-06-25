import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingManager } from '../../src/core/streaming.js';

describe('StreamingManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new StreamingManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should create a new stream', () => {
    const stream = manager.createStream('stream-1', { bufferSize: 512 });

    expect(stream).toBeDefined();
    expect(stream.id).toBe('stream-1');
    expect(stream.status).toBe('active');
    expect(stream.bufferSize).toBe(512);
  });

  it('should send data chunk to stream', () => {
    manager.createStream('stream-1');
    const result = manager.sendChunk('stream-1', 'test data', 'data');

    expect(result).toBe(true);
    const buffer = manager.getStreamBuffer('stream-1');
    expect(buffer.length).toBe(1);
  });

  it('should update stream progress', () => {
    manager.createStream('stream-1');
    const result = manager.updateProgress('stream-1', 50, 'Halfway done');

    expect(result).toBe(true);
    const status = manager.getStreamStatus('stream-1');
    expect(status.progress).toBe(50);
  });

  it('should clamp progress between 0 and 100', () => {
    manager.createStream('stream-1');
    manager.updateProgress('stream-1', 150, 'Too high');
    
    const status = manager.getStreamStatus('stream-1');
    expect(status.progress).toBe(100);
  });

  it('should complete stream', () => {
    manager.createStream('stream-1');
    const result = manager.completeStream('stream-1', 'Final data');

    expect(result).toBe(true);
    const status = manager.getStreamStatus('stream-1');
    expect(status.status).toBe('completed');
    expect(status.progress).toBe(100);
  });

  it('should error stream', () => {
    manager.createStream('stream-1');
    const result = manager.errorStream('stream-1', 'Test error');

    expect(result).toBe(true);
    const status = manager.getStreamStatus('stream-1');
    expect(status.status).toBe('error');
    expect(status.error).toBe('Test error');
  });

  it('should return null for non-existent stream', () => {
    const status = manager.getStreamStatus('non-existent');
    expect(status).toBeNull();
  });

  it('should get stream buffer', () => {
    manager.createStream('stream-1');
    manager.sendChunk('stream-1', 'chunk 1');
    manager.sendChunk('stream-1', 'chunk 2');

    const buffer = manager.getStreamBuffer('stream-1');
    expect(buffer.length).toBe(2);
  });

  it('should clear stream buffer', () => {
    manager.createStream('stream-1');
    manager.sendChunk('stream-1', 'chunk 1');
    const result = manager.clearStreamBuffer('stream-1');

    expect(result).toBe(true);
    const buffer = manager.getStreamBuffer('stream-1');
    expect(buffer.length).toBe(0);
  });

  it('should get all active streams', () => {
    manager.createStream('stream-1');
    manager.createStream('stream-2');

    const active = manager.getActiveStreams();
    expect(active.length).toBe(2);
  });

  it('should get stream history', () => {
    manager.createStream('stream-1');
    manager.completeStream('stream-1');
    manager.createStream('stream-2');
    manager.completeStream('stream-2');

    const history = manager.getStreamHistory();
    expect(history.length).toBe(2);
  });

  it('should limit stream history', () => {
    for (let i = 0; i < 10; i++) {
      manager.createStream(`stream-${i}`);
      manager.completeStream(`stream-${i}`);
    }

    const history = manager.getStreamHistory(5);
    expect(history.length).toBe(5);
  });

  it('should get streaming statistics', () => {
    manager.createStream('stream-1');
    manager.completeStream('stream-1');
    manager.createStream('stream-2');
    manager.errorStream('stream-2', 'Error');

    const stats = manager.getStatistics();
    expect(stats).toBeDefined();
    expect(stats.totalStreams).toBe(2);
    expect(stats.completedStreams).toBe(1);
    expect(stats.errorStreams).toBe(1);
  });

  it('should return zero statistics when no streams', () => {
    const stats = manager.getStatistics();
    expect(stats.totalStreams).toBe(0);
    expect(stats.activeStreams).toBe(0);
  });

  it('should clear active streams', () => {
    manager.createStream('stream-1');
    manager.createStream('stream-2');
    expect(manager.getActiveStreams().length).toBe(2);

    manager.clearActiveStreams();
    expect(manager.getActiveStreams().length).toBe(0);
  });

  it('should clear history', () => {
    manager.createStream('stream-1');
    manager.completeStream('stream-1');
    expect(manager.getStreamHistory().length).toBe(1);

    manager.clearHistory();
    expect(manager.getStreamHistory().length).toBe(0);
  });

  it('should reset all streaming data', () => {
    manager.createStream('stream-1');
    manager.completeStream('stream-1');
    manager.createStream('stream-2');

    manager.reset();
    expect(manager.getActiveStreams().length).toBe(0);
    expect(manager.getStreamHistory().length).toBe(0);
  });

  it('should handle chunk sequence numbering', () => {
    manager.createStream('stream-1');
    manager.sendChunk('stream-1', 'chunk 1');
    manager.sendChunk('stream-1', 'chunk 2');
    manager.sendChunk('stream-1', 'chunk 3');

    const buffer = manager.getStreamBuffer('stream-1');
    expect(buffer[0].sequence).toBe(0);
    expect(buffer[1].sequence).toBe(1);
    expect(buffer[2].sequence).toBe(2);
  });

  it('should not send chunk to completed stream', () => {
    manager.createStream('stream-1');
    manager.completeStream('stream-1');
    const result = manager.sendChunk('stream-1', 'new chunk');

    expect(result).toBe(false);
  });

  it('should not send chunk to errored stream', () => {
    manager.createStream('stream-1');
    manager.errorStream('stream-1', 'Error');
    const result = manager.sendChunk('stream-1', 'new chunk');

    expect(result).toBe(false);
  });

  it('should store stream metadata', () => {
    const metadata = { userId: 'user-123', taskId: 'task-456' };
    const stream = manager.createStream('stream-1', { metadata });

    expect(stream.metadata).toEqual(metadata);
  });

  it('should use default options when not provided', () => {
    const stream = manager.createStream('stream-1');

    expect(stream.bufferSize).toBe(1024);
    expect(stream.chunkDelay).toBe(50);
  });
});
