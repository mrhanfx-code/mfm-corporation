import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemorySlotsManager } from '../../src/core/memory-slots.js';

describe('MemorySlotsManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new MemorySlotsManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should define a slot', () => {
    const config = {
      name: 'Test Slot',
      description: 'A test memory slot',
      maxSize: 5000,
      maxItems: 50
    };
    
    const slotConfig = manager.defineSlot('test-slot', config);
    
    expect(slotConfig).toBeDefined();
    expect(slotConfig.id).toBe('test-slot');
    expect(slotConfig.name).toBe('Test Slot');
    expect(slotConfig.maxSize).toBe(5000);
    expect(slotConfig.maxItems).toBe(50);
  });

  it('should use default config values', () => {
    const slotConfig = manager.defineSlot('default-slot', {});
    
    expect(slotConfig.maxSize).toBe(10000);
    expect(slotConfig.maxItems).toBe(100);
    expect(slotConfig.retention).toBe('7d');
    expect(slotConfig.priority).toBe('medium');
  });

  it('should add item to slot', async () => {
    manager.defineSlot('test-slot', { maxItems: 10 });
    const item = { data: 'test data' };
    
    const slotItem = await manager.addToSlot('test-slot', item);
    
    expect(slotItem).toBeDefined();
    expect(slotItem.content).toEqual(item);
    expect(slotItem.id).toContain('item:');
  });

  it('should throw error when adding to undefined slot', async () => {
    await expect(manager.addToSlot('non-existent', {})).rejects.toThrow('Slot not defined');
  });

  it('should throw error when item is too large', async () => {
    manager.defineSlot('test-slot', { maxSize: 100 });
    const largeItem = { data: 'x'.repeat(200) };
    
    await expect(manager.addToSlot('test-slot', largeItem)).rejects.toThrow('Item too large');
  });

  it('should remove oldest item when at capacity', async () => {
    manager.defineSlot('test-slot', { maxItems: 2 });
    
    await manager.addToSlot('test-slot', { data: 'item1' });
    await manager.addToSlot('test-slot', { data: 'item2' });
    await manager.addToSlot('test-slot', { data: 'item3' });
    
    const items = await manager.getFromSlot('test-slot');
    expect(items.length).toBe(2);
    expect(items[0].content.data).toBe('item2');
    expect(items[1].content.data).toBe('item3');
  });

  it('should get items from slot', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' });
    await manager.addToSlot('test-slot', { data: 'item2' });
    
    const items = await manager.getFromSlot('test-slot');
    expect(items.length).toBe(2);
  });

  it('should filter items by metadata', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' }, { type: 'important' });
    await manager.addToSlot('test-slot', { data: 'item2' }, { type: 'normal' });
    
    const items = await manager.getFromSlot('test-slot', { metadata: { type: 'important' } });
    expect(items.length).toBe(1);
    expect(items[0].metadata.type).toBe('important');
  });

  it('should limit results', async () => {
    manager.defineSlot('test-slot', {});
    
    for (let i = 0; i < 5; i++) {
      await manager.addToSlot('test-slot', { data: `item${i}` });
    }
    
    const items = await manager.getFromSlot('test-slot', { limit: 3 });
    expect(items.length).toBe(3);
  });

  it('should sort by oldest', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' });
    await manager.addToSlot('test-slot', { data: 'item2' });
    
    const items = await manager.getFromSlot('test-slot', { sort: 'oldest' });
    expect(items[0].content.data).toBe('item2');
  });

  it('should remove item from slot', async () => {
    manager.defineSlot('test-slot', {});
    
    const slotItem = await manager.addToSlot('test-slot', { data: 'test' });
    await manager.removeFromSlot('test-slot', slotItem.id);
    
    const items = await manager.getFromSlot('test-slot');
    expect(items.length).toBe(0);
  });

  it('should throw error when removing from non-existent slot', async () => {
    await expect(manager.removeFromSlot('non-existent', 'item-id')).rejects.toThrow('Slot not found');
  });

  it('should throw error when removing non-existent item', async () => {
    manager.defineSlot('test-slot', {});
    await expect(manager.removeFromSlot('test-slot', 'non-existent')).rejects.toThrow('Item not found');
  });

  it('should clear slot', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' });
    await manager.addToSlot('test-slot', { data: 'item2' });
    await manager.clearSlot('test-slot');
    
    const items = await manager.getFromSlot('test-slot');
    expect(items.length).toBe(0);
  });

  it('should throw error when clearing undefined slot', async () => {
    await expect(manager.clearSlot('non-existent')).rejects.toThrow('Slot not defined');
  });

  it('should consolidate slot', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'This is an important decision' });
    await manager.addToSlot('test-slot', { data: 'This is critical information' });
    
    const consolidated = await manager.consolidateSlot('test-slot');
    
    expect(consolidated).toBeDefined();
    expect(consolidated.type).toBe('consolidated');
    expect(consolidated.insights).toBeDefined();
  });

  it('should extract insights from slot', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'This is an important decision' });
    await manager.addToSlot('test-slot', { data: 'This is critical information' });
    
    const slot = manager.slots.get('test-slot');
    const insights = manager.extractInsights(slot);
    
    expect(insights.length).toBeGreaterThan(0);
  });

  it('should generate summary', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' });
    await manager.addToSlot('test-slot', { data: 'item2' });
    
    const slot = manager.slots.get('test-slot');
    const summary = manager.generateSummary(slot);
    
    expect(summary).toBeDefined();
    expect(summary.totalItems).toBe(2);
  });

  it('should summarize metadata', async () => {
    manager.defineSlot('test-slot', {});
    
    await manager.addToSlot('test-slot', { data: 'item1' }, { type: 'important' });
    await manager.addToSlot('test-slot', { data: 'item2' }, { type: 'normal' });
    
    const slot = manager.slots.get('test-slot');
    const summary = manager.summarizeMetadata(slot);
    
    expect(summary.type).toBeDefined();
    expect(summary.type.length).toBe(2);
  });

  it('should get slot info', async () => {
    manager.defineSlot('test-slot', { name: 'Test Slot' });
    await manager.addToSlot('test-slot', { data: 'test' });
    
    const info = manager.getSlotInfo('test-slot');
    
    expect(info).toBeDefined();
    expect(info.id).toBe('test-slot');
    expect(info.name).toBe('Test Slot');
    expect(info.itemCount).toBe(1);
  });

  it('should return null for non-existent slot info', () => {
    const info = manager.getSlotInfo('non-existent');
    expect(info).toBeNull();
  });

  it('should get all slots', () => {
    manager.defineSlot('slot-1', { name: 'Slot 1' });
    manager.defineSlot('slot-2', { name: 'Slot 2' });
    
    const slots = manager.getAllSlots();
    expect(slots.length).toBe(2);
  });

  it('should get slot statistics', async () => {
    manager.defineSlot('slot-1', { priority: 'high' });
    manager.defineSlot('slot-2', { priority: 'low' });
    
    await manager.addToSlot('slot-1', { data: 'test' });
    
    const stats = manager.getSlotStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalSlots).toBe(2);
    expect(stats.totalItems).toBe(1);
  });

  it('should return zero statistics when no slots', () => {
    const stats = manager.getSlotStatistics();
    expect(stats.totalSlots).toBe(0);
    expect(stats.totalItems).toBe(0);
  });

  it('should parse retention days', () => {
    const ms = manager.parseRetention('7d');
    expect(ms).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should parse retention hours', () => {
    const ms = manager.parseRetention('24h');
    expect(ms).toBe(24 * 60 * 60 * 1000);
  });

  it('should parse retention minutes', () => {
    const ms = manager.parseRetention('60m');
    expect(ms).toBe(60 * 60 * 1000);
  });

  it('should use default retention for invalid format', () => {
    const ms = manager.parseRetention('invalid');
    expect(ms).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should cleanup expired items', async () => {
    manager.defineSlot('test-slot', { retention: '1m' });
    
    await manager.addToSlot('test-slot', { data: 'old item' });
    
    // Manually set old timestamp
    const slot = manager.slots.get('test-slot');
    slot[0].addedAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    await manager.cleanupExpiredSlots();
    
    const items = await manager.getFromSlot('test-slot');
    expect(items.length).toBe(0);
  });

  it('should track item metadata', async () => {
    manager.defineSlot('test-slot', {});
    const metadata = { type: 'important', source: 'user' };
    
    const slotItem = await manager.addToSlot('test-slot', { data: 'test' }, metadata);
    
    expect(slotItem.metadata).toEqual(metadata);
  });

  it('should track item size', async () => {
    manager.defineSlot('test-slot', {});
    const item = { data: 'x'.repeat(100) };
    
    const slotItem = await manager.addToSlot('test-slot', item);
    
    expect(slotItem.size).toBeGreaterThan(0);
  });

  it('should handle auto-consolidate', async () => {
    manager.defineSlot('test-slot', { maxItems: 5, autoConsolidate: true });
    
    for (let i = 0; i < 5; i++) {
      await manager.addToSlot('test-slot', { data: `item${i}` });
    }
    
    const slot = manager.slots.get('test-slot');
    expect(slot[0].type).toBe('consolidated');
  });
});
