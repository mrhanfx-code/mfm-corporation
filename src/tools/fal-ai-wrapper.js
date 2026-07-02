// fal.ai Wrapper — video rendering API wrapper with Queue support

const FAL_API_BASE = 'https://queue.fal.run';

/**
 * Submit a video rendering job to fal.ai
 * @param {object} params - Rendering parameters
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Job submission result
 */
export async function submitRenderingJob(params, env) {
  const falApiKey = env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error('FAL_API_KEY not configured in environment');
  }

  const endpoint = getFalEndpoint(params.model || 'fal-ai/flux-pro/v1.1-ultra');
  
  try {
    const response = await fetch(`${FAL_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`fal.ai API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    return {
      requestId: result.request_id,
      status: result.status || 'pending',
      queuePosition: result.queue_position,
      estimatedTime: result.estimate_time_seconds
    };
  } catch (error) {
    console.error('[fal.ai] Job submission failed:', error.message);
    throw error;
  }
}

/**
 * Check the status of a rendering job
 * @param {string} requestId - Job request ID
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Job status
 */
export async function getJobStatus(requestId, env) {
  const falApiKey = env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error('FAL_API_KEY not configured in environment');
  }

  try {
    const response = await fetch(`${FAL_API_BASE}/${requestId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${falApiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`fal.ai API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    return {
      requestId: result.request_id,
      status: result.status, // pending, processing, completed, failed
      logs: result.logs || [],
      error: result.error || null,
      completedAt: result.completed_at || null
    };
  } catch (error) {
    console.error('[fal.ai] Status check failed:', error.message);
    throw error;
  }
}

/**
 * Get the result of a completed rendering job
 * @param {string} requestId - Job request ID
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Job result with video URL
 */
export async function getJobResult(requestId, env) {
  const falApiKey = env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error('FAL_API_KEY not configured in environment');
  }

  try {
    const response = await fetch(`${FAL_API_BASE}/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${falApiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`fal.ai API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    return {
      requestId: result.request_id,
      status: result.status,
      videoUrl: result.video?.url || result.output_url,
      thumbnailUrl: result.video?.thumbnail_url || null,
      duration: result.video?.duration || null,
      width: result.video?.width || null,
      height: result.video?.height || null,
      fileSize: result.video?.file_size || null,
      completedAt: result.completed_at
    };
  } catch (error) {
    console.error('[fal.ai] Result retrieval failed:', error.message);
    throw error;
  }
}

/**
 * Submit job to Cloudflare Queue for async processing
 * @param {object} jobData - Job data to queue
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Queue submission result
 */
export async function queueRenderingJob(jobData, env) {
  if (!env.TASK_QUEUE) {
    throw new Error('TASK_QUEUE binding not configured');
  }

  try {
    await env.TASK_QUEUE.send(jobData, {
      contentType: 'application/json'
    });
    
    return {
      success: true,
      message: 'Job queued successfully',
      jobId: jobData.jobId
    };
  } catch (error) {
    console.error('[Queue] Job submission failed:', error.message);
    throw error;
  }
}

/**
 * Process a rendering job from the Queue
 * @param {object} message - Queue message
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Processing result
 */
export async function processQueuedJob(message, env) {
  const jobData = JSON.parse(message.body);
  
  try {
    // Submit to fal.ai
    const submission = await submitRenderingJob(jobData.params, env);
    
    // Poll for completion (simplified - in production use webhooks)
    let status = await getJobStatus(submission.requestId, env);
    let attempts = 0;
    const maxAttempts = 120; // 20 minutes max wait (120 × 10s)
    
    while (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      status = await getJobStatus(submission.requestId, env);
      attempts++;
    }
    
    if (status.status === 'completed') {
      const result = await getJobResult(submission.requestId, env);
      
      // Store result in R2
      if (env.mfm_corporation_uploads && result.videoUrl) {
        await storeVideoInR2(result.videoUrl, jobData.jobId, env);
      }
      
      return {
        success: true,
        jobId: jobData.jobId,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        completedAt: result.completedAt
      };
    } else {
      throw new Error(`Job failed with status: ${status.status}`);
    }
  } catch (error) {
    console.error('[Queue] Job processing failed:', error.message);
    
    // Send to dead letter queue if configured
    if (env.TASK_QUEUE) {
      await env.TASK_QUEUE.send({
        ...jobData,
        error: error.message,
        failedAt: new Date().toISOString()
      }, {
        contentType: 'application/json'
      });
    }
    
    throw error;
  }
}

/**
 * Store video in R2 storage
 * @param {string} videoUrl - Video URL from fal.ai
 * @param {string} jobId - Job ID for naming
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<string>} - R2 object key
 */
async function storeVideoInR2(videoUrl, jobId, env) {
  if (!env.mfm_corporation_uploads) {
    throw new Error('R2 binding not configured');
  }

  try {
    // Download video from fal.ai
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    
    // Upload to R2
    const key = `videos/${jobId}.mp4`;
    await env.mfm_corporation_uploads.put(key, videoBuffer, {
      httpMetadata: {
        contentType: 'video/mp4'
      }
    });
    
    return key;
  } catch (error) {
    console.error('[R2] Video storage failed:', error.message);
    throw error;
  }
}

/**
 * Get fal.ai endpoint for a model
 * @param {string} model - Model name
 * @returns {string} - API endpoint
 */
function getFalEndpoint(model) {
  const endpoints = {
    'fal-ai/flux-pro/v1.1-ultra': '/fal-ai/flux-pro/v1.1-ultra',
    'fal-ai/flux-pro/v1.1': '/fal-ai/flux-pro/v1.1',
    'fal-ai/flux-dev/v1.1': '/fal-ai/flux-dev/v1.1',
    'fal-ai/flux-schnell/v1.1': '/fal-ai/flux-schnell/v1.1'
  };
  
  return endpoints[model] || `/${model}`;
}

/**
 * Estimate rendering cost based on model and duration
 * @param {string} model - Model name
 * @param {number} durationSeconds - Video duration in seconds
 * @returns {object} - Cost estimate
 */
export function estimateCost(model, durationSeconds) {
  const pricing = {
    'fal-ai/flux-pro/v1.1-ultra': 0.40, // $0.40/second
    'fal-ai/flux-pro/v1.1': 0.25,       // $0.25/second
    'fal-ai/flux-dev/v1.1': 0.10,       // $0.10/second
    'fal-ai/flux-schnell/v1.1': 0.05    // $0.05/second
  };
  
  const rate = pricing[model] || 0.10;
  const cost = rate * durationSeconds;
  
  return {
    model,
    durationSeconds,
    ratePerSecond: rate,
    estimatedCost: Math.round(cost * 100) / 100,
    currency: 'USD'
  };
}
