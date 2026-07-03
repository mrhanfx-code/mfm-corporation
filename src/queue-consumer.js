// Queue Consumer — processes async tasks from mfm-task-queue

import { processQueuedJob } from './tools/fal-ai-wrapper.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle queue messages
      if (request.method === 'POST') {
        const message = await request.json();
        
        // Process video rendering jobs
        if (message.body) {
          try {
            const result = await processQueuedJob(message, env);
            console.log('[Queue Consumer] Job processed successfully:', result.jobId);
            return new Response(JSON.stringify({ success: true, result }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error('[Queue Consumer] Job processing failed:', error.message);
            return new Response(JSON.stringify({ success: false, error: error.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      return new Response('Queue Consumer Active', { status: 200 });
    } catch (error) {
      console.error('[Queue Consumer] Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
