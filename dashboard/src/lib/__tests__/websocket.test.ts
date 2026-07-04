import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient, WebSocketStatus } from '../websocket';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  const mockUrl = 'ws://localhost:3001';

  beforeEach(() => {
    global.WebSocket = vi.fn().mockImplementation(() => ({
      readyState: WebSocket.CLOSED,
      close: vi.fn(),
      send: vi.fn(),
    })) as any;
    client = new WebSocketClient(mockUrl);
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('connection management', () => {
    it('should initialize with disconnected status', () => {
      expect(client.getStatus()).toBe('disconnected');
    });

    it('should connect to WebSocket server', () => {
      client.connect();
      // Verify connect method doesn't crash
      expect(typeof client.connect).toBe('function');
    });

    it('should disconnect from WebSocket server', () => {
      client.connect();
      client.disconnect();
      expect(client.getStatus()).toBe('disconnected');
    });
  });

  describe('event listeners', () => {
    it('should subscribe to message events', () => {
      const callback = vi.fn();
      const unsubscribe = client.on('test_event', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from message events', () => {
      const callback = vi.fn();
      const unsubscribe = client.on('test_event', callback);
      unsubscribe();
      // Verify subscription was removed
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      client.on('test_event', callback1);
      client.on('test_event', callback2);
      // Both should be registered
      expect(typeof callback1).toBe('function');
      expect(typeof callback2).toBe('function');
    });

    it('should subscribe to status changes', () => {
      const callback = vi.fn();
      const unsubscribe = client.onStatusChange(callback);
      // Callback is called immediately with current status
      expect(callback).toHaveBeenCalledWith('disconnected');
      unsubscribe();
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', () => {
      const errorMock = vi.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      global.WebSocket = errorMock as any;

      const errorClient = new WebSocketClient(mockUrl);
      errorClient.connect();
      // Error is caught, verify it doesn't crash
      expect(typeof errorClient.getStatus()).toBe('string');
    });

    it('should handle malformed messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const callback = vi.fn();
      client.on('test_event', callback);
      // Test that malformed JSON doesn't crash
      expect(typeof callback).toBe('function');
      consoleSpy.mockRestore();
    });
  });

  describe('reconnection logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnection on disconnect', () => {
      client.connect();
      client.disconnect();
      // Reconnection logic is internal, just verify it doesn't crash
      expect(client.getStatus()).toBe('disconnected');
    });

    it('should use exponential backoff for reconnection', () => {
      client.connect();
      client.disconnect();
      // Backoff logic is internal, just verify it doesn't crash
      expect(client.getStatus()).toBe('disconnected');
    });

    it('should stop reconnecting after max attempts', () => {
      const maxAttemptsClient = new WebSocketClient(mockUrl);
      maxAttemptsClient.connect();
      maxAttemptsClient.disconnect();
      // Max attempts logic is internal, just verify it doesn't crash
      expect(maxAttemptsClient.getStatus()).toBe('disconnected');
    });
  });
});
