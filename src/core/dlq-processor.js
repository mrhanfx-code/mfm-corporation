// Dead Letter Queue (DLQ) processor with retry logic
// Handles failed tasks with exponential backoff and max retry limits

const DLQ_CONFIG = {
  maxRetries: 3,
  retryDelays: [60000, 300000, 900000], // 1min, 5min, 15min
  retryableErrors: [
    'timeout',
    'network',
    'connection',
    'temporarily unavailable',
    'rate limit',
    'service unavailable'
  ]
};

class DLQProcessor {
  constructor(env) {
    this.env = env;
  }

  async processDLQ() {
    console.log('[DLQProcessor] Processing dead letter queue...');
    
    try {
      // Get failed tasks from DLQ
      const failedTasks = await this.env.db.prepare(`
        SELECT * FROM dead_letter_queue
        WHERE retry_count < ?
        ORDER BY failed_at ASC
        LIMIT 10
      `).bind(DLQ_CONFIG.maxRetries).all();
      
      const tasks = failedTasks.results || [];
      console.log(`[DLQProcessor] Found ${tasks.length} tasks to retry`);
      
      const results = [];
      
      for (const task of tasks) {
        const result = await this.retryTask(task);
        results.push(result);
      }
      
      return {
        processed: tasks.length,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DLQProcessor] Failed to process DLQ:', error);
      return { error: error.message, processed: 0 };
    }
  }

  async retryTask(task) {
    const now = Date.now();
    const failedAt = new Date(task.failed_at).getTime();
    const retryDelay = DLQ_CONFIG.retryDelays[task.retry_count] || DLQ_CONFIG.retryDelays[DLQ_CONFIG.retryDelays.length - 1];
    
    // Check if enough time has passed for retry
    if (now - failedAt < retryDelay) {
      console.log(`[DLQProcessor] Task ${task.id} not ready for retry yet`);
      return { id: task.id, status: 'pending', reason: 'not_ready' };
    }
    
    // Check if error is retryable
    const isRetryable = this.isRetryableError(task.error_message);
    if (!isRetryable) {
      console.log(`[DLQProcessor] Task ${task.id} error not retryable: ${task.error_message}`);
      await this.markAsPermanentFailure(task.id);
      return { id: task.id, status: 'failed_permanent', reason: 'non_retryable' };
    }
    
    console.log(`[DLQProcessor] Retrying task ${task.id} (attempt ${task.retry_count + 1})`);
    
    try {
      // Re-execute the task via orchestrator
      const { routeMessage } = await import('./orchestrator.js');
      const result = await routeMessage(
        { text: task.input },
        task.user_id,
        this.env
      );
      
      // Task succeeded - remove from DLQ
      await this.removeFromDLQ(task.id);
      
      console.log(`[DLQProcessor] Task ${task.id} retry succeeded`);
      
      return {
        id: task.id,
        status: 'succeeded',
        retryCount: task.retry_count + 1,
        result
      };
    } catch (error) {
      const newRetryCount = task.retry_count + 1;
      
      if (newRetryCount >= DLQ_CONFIG.maxRetries) {
        // Max retries reached - mark as permanent failure
        await this.markAsPermanentFailure(task.id);
        console.error(`[DLQProcessor] Task ${task.id} max retries reached`);
        
        return {
          id: task.id,
          status: 'failed_permanent',
          retryCount: newRetryCount,
          error: error.message
        };
      } else {
        // Update retry count and failed_at
        await this.updateRetryCount(task.id, newRetryCount);
        console.error(`[DLQProcessor] Task ${task.id} retry failed: ${error.message}`);
        
        return {
          id: task.id,
          status: 'failed',
          retryCount: newRetryCount,
          error: error.message
        };
      }
    }
  }

  isRetryableError(errorMessage) {
    const lowerMessage = errorMessage.toLowerCase();
    return DLQ_CONFIG.retryableErrors.some(pattern => lowerMessage.includes(pattern));
  }

  async updateRetryCount(taskId, retryCount) {
    await this.env.db.prepare(`
      UPDATE dead_letter_queue
      SET retry_count = ?, failed_at = datetime("now")
      WHERE id = ?
    `).bind(retryCount, taskId).run();
  }

  async markAsPermanentFailure(taskId) {
    await this.env.db.prepare(`
      UPDATE dead_letter_queue
      SET status = 'permanent_failure', failed_at = datetime("now")
      WHERE id = ?
    `).bind(taskId).run();
  }

  async removeFromDLQ(taskId) {
    await this.env.db.prepare(`
      DELETE FROM dead_letter_queue WHERE id = ?
    `).bind(taskId).run();
  }

  async addToDLQ(taskId, input, userId, errorMessage) {
    const dlqId = crypto.randomUUID();
    
    await this.env.db.prepare(`
      INSERT INTO dead_letter_queue (id, task_id, input, user_id, error_message, retry_count, status, failed_at)
      VALUES (?, ?, ?, ?, ?, 0, 'pending', datetime("now"))
    `).bind(dlqId, taskId, input, userId, errorMessage).run();
    
    console.log(`[DLQProcessor] Added task ${taskId} to DLQ: ${errorMessage}`);
    
    return dlqId;
  }

  async getDLQStats() {
    const stats = await this.env.db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'permanent_failure' THEN 1 END) as permanent_failures,
        AVG(retry_count) as avg_retries
      FROM dead_letter_queue
    `).first();
    
    return stats;
  }
}

// Singleton instance
let dlqProcessorInstance = null;

export function getDLQProcessor(env) {
  if (!dlqProcessorInstance) {
    dlqProcessorInstance = new DLQProcessor(env);
  }
  return dlqProcessorInstance;
}

export function resetDLQProcessor() {
  dlqProcessorInstance = null;
}

// Scheduled DLQ processing handler
export async function handleScheduledDLQProcessing(env) {
  const processor = getDLQProcessor(env);
  const result = await processor.processDLQ();
  
  console.log('[DLQProcessor] Scheduled DLQ processing completed:', result);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
