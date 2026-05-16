// MFM Corporation Cloudflare Worker API - Secure Version
// Backend API endpoints with security, validation, and error handling

// Security configuration - FREE-TIER OPTIMIZED
const SECURITY_CONFIG = {
  allowedOrigins: [
    'https://mfm-corporation.pages.dev',
    'https://mfm-corporation-api.mrhan-fx.workers.dev'
  ],
  maxFileSize: 5 * 1024 * 1024, // 5MB (free-tier friendly)
  maxRequestSize: 1024 * 1024, // 1MB request size limit
  rateLimitPerMinute: 60, // Reduced for free-tier
  requestTimeout: 15000, // 15 seconds (free-tier friendly)
  allowedMethods: ['GET', 'POST', 'OPTIONS'] // HTTP method validation
};

// Rate limiting using KV - SECURE VERSION
async function checkRateLimit(clientIP, env) {
  const key = `rate_limit:${clientIP}`;
  const current = await env.KV.get(key);
  
  // Validate numeric input to prevent bypass
  const count = /^\d+$/.test(current) ? parseInt(current, 10) : 0;
  
  if (count >= SECURITY_CONFIG.rateLimitPerMinute) {
    return false;
  }
  
  // Atomic increment with validation
  const newCount = count + 1;
  await env.KV.put(key, newCount.toString(), { expirationTtl: 60 });
  return true;
}

// Input validation schemas - SECURE VERSION
const validateInput = {
  searchQuery: (query) => {
    if (!query || typeof query !== 'string') return false;
    
    // Normalize Unicode to prevent bypass attacks
    const normalized = query.normalize('NFKC');
    if (normalized.length > 100) return false;
    
    // Strict ASCII validation - prevents Unicode bypass
    return /^[\x20-\x7E]+$/.test(normalized);
  },
  userId: (userId) => {
    if (!userId || typeof userId !== 'string') return false;
    
    // Normalize Unicode and validate
    const normalized = userId.normalize('NFKC');
    if (normalized.length > 50 || normalized.length < 1) return false;
    
    // Strict ASCII validation
    return /^[a-zA-Z0-9\-_]+$/.test(normalized);
  },
  // JSON validation with schema
  validateJSON: (body) => {
    try {
      const parsed = JSON.parse(body);
      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  },
  // Schema validation for preferences
  validatePreferencesSchema: (data) => {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Preferences must be an object' };
    }
    
    // Check for nested objects (prevent deep nesting)
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 10000) { // 10KB limit
      return { valid: false, error: 'Preferences too large' };
    }
    
    return { valid: true, data };
  }
};

// Security headers - SECURE VERSION
const getSecurityHeaders = (origin) => {
  // Normalize and validate origin to prevent spoofing
  const normalizedOrigin = origin && origin !== 'null' && origin !== 'undefined' 
    ? origin.toLowerCase().trim() 
    : '';
  
  const isAllowed = SECURITY_CONFIG.allowedOrigins.includes(normalizedOrigin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? normalizedOrigin : SECURITY_CONFIG.allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'"
  };
};

// Structured error responses
const createErrorResponse = (message, status = 500, code = 'INTERNAL_ERROR') => {
  return {
    error: {
      message: message,
      code: code,
      timestamp: new Date().toISOString()
    },
    status: status
  };
};

// Response caching utility
const cacheMiddleware = (cacheTime = 300) => {
  return (response) => {
    response.headers.set('Cache-Control', `public, max-age=${cacheTime}`);
    response.headers.set('ETag', `"${Date.now()}"`);
    return response;
  };
};

// Performance monitoring
const metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTime: [],
  
  recordRequest(duration, success) {
    this.requestCount++;
    if (!success) this.errorCount++;
    this.responseTime.push(duration);
    
    // Keep only last 100 response times
    if (this.responseTime.length > 100) {
      this.responseTime.shift();
    }
  },
  
  getStats() {
    const avgTime = this.responseTime.length > 0 
      ? this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length 
      : 0;
    
    return {
      totalRequests: this.requestCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100) : 0,
      avgResponseTime: Math.round(avgTime),
      timestamp: new Date().toISOString()
    };
  }
};

// Logging utility
const logRequest = (method, path, status, clientIP, userAgent) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    path,
    status,
    clientIP,
    userAgent,
    environment: ENVIRONMENT || 'unknown'
  }));
};

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '';
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    try {
      // HTTP method validation (CRITICAL SECURITY)
      if (!SECURITY_CONFIG.allowedMethods.includes(request.method)) {
        logRequest(request.method, path, 405, clientIP, userAgent);
        return new Response(
          JSON.stringify(createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED')),
          { 
            status: 405, 
            headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
          }
        );
      }

      // Request size validation (free-tier protection)
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > SECURITY_CONFIG.maxRequestSize) {
        logRequest(request.method, path, 413, clientIP, userAgent);
        return new Response(
          JSON.stringify(createErrorResponse('Request too large', 413, 'PAYLOAD_TOO_LARGE')),
          { 
            status: 413, 
            headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
          }
        );
      }

      // Actual payload validation for POST requests
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          if (body.length > SECURITY_CONFIG.maxRequestSize) {
            logRequest(request.method, path, 413, clientIP, userAgent);
            return new Response(
              JSON.stringify(createErrorResponse('Payload too large', 413, 'PAYLOAD_TOO_LARGE')),
              { 
                status: 413, 
                headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
              }
            );
          }
          // Store body for later use
          request._body = body;
        } catch (error) {
          logRequest(request.method, path, 400, clientIP, userAgent);
          return new Response(
            JSON.stringify(createErrorResponse('Invalid request body', 400, 'INVALID_BODY')),
            { 
              status: 400, 
              headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Rate limiting
      if (!(await checkRateLimit(clientIP, env))) {
        logRequest(request.method, path, 429, clientIP, userAgent);
        return new Response(
          JSON.stringify(createErrorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')),
          { 
            status: 429, 
            headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
          }
        );
      }

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { 
          status: 200,
          headers: getSecurityHeaders(origin)
        });
      }

      // Route requests with validation
      let response;
      switch (path) {
        case '/api/status':
          response = await handleStatus(request, env);
          break;
        case '/api/user/preferences':
          response = await handleUserPreferences(request, env);
          break;
        case '/api/tools/search':
          response = await handleToolsSearch(request, env);
          break;
        case '/api/analytics':
          response = await handleAnalytics(request, env);
          break;
        case '/api/upload':
          response = await handleFileUpload(request, env);
          break;
        default:
          response = new Response(
            JSON.stringify(createErrorResponse('Endpoint not found', 404, 'NOT_FOUND')),
            { status: 404, headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' } }
          );
      }

      // Log successful request
      const duration = Date.now() - startTime;
      logRequest(request.method, path, response.status, clientIP, userAgent);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Rate-Limit-Remaining', String(SECURITY_CONFIG.rateLimitPerMinute));
      
      return response;

    } catch (error) {
      // Log error without exposing sensitive information
      console.error('Worker error:', {
        message: error.message,
        stack: error.stack,
        path,
        method: request.method,
        clientIP,
        timestamp: new Date().toISOString()
      });

      logRequest(request.method, path, 500, clientIP, userAgent);

      return new Response(
        JSON.stringify(createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')),
        { 
          status: 500, 
          headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

// Enhanced handlers with validation and error handling
async function handleStatus(request, env) {
  const origin = request.headers.get('Origin') || '';
  
  try {
    // Check resource availability
    const features = {
      database: !!env.db,
      kv_storage: !!env.KV,
      r2_storage: !!env["mfm-corporation-uploads"],
      workers: true
    };

    const status = {
      system: 'MFM Corporation',
      version: '2.0.0',
      platform: 'Cloudflare Pages',
      environment: env.ENVIRONMENT || 'development',
      features,
      uptime: process.uptime ? process.uptime() : 0,
      timestamp: new Date().toISOString()
    };

    const response = new Response(JSON.stringify(status), {
      status: 200,
      headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
    });
    
    // Apply caching for status endpoint (5 minutes)
    return cacheMiddleware(300)(response);
  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse('Failed to get system status', 500, 'STATUS_ERROR')),
      { 
        status: 500, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleUserPreferences(request, env) {
  const origin = request.headers.get('Origin') || '';
  
  if (!env.KV) {
    return new Response(
      JSON.stringify(createErrorResponse('KV storage not available', 503, 'KV_UNAVAILABLE')),
      { 
        status: 503, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const url = new URL(request.url);
    const userId = validateInput.userId(url.searchParams.get('userId')) 
      ? url.searchParams.get('userId') 
      : 'default';

    if (request.method === 'GET') {
      const preferences = await env.KV.get(`preferences:${userId}`);
      return new Response(preferences || '{}', {
        status: 200,
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      // Use pre-validated body from main handler
      const body = request._body || '';
      
      // Validate JSON format
      const jsonValidation = validateInput.validateJSON(body);
      if (!jsonValidation.valid) {
        return new Response(
          JSON.stringify(createErrorResponse(jsonValidation.error, 400, 'INVALID_JSON')),
          { 
            status: 400, 
            headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate preferences schema
      const schemaValidation = validateInput.validatePreferencesSchema(jsonValidation.data);
      if (!schemaValidation.valid) {
        return new Response(
          JSON.stringify(createErrorResponse(schemaValidation.error, 400, 'INVALID_SCHEMA')),
          { 
            status: 400, 
            headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
          }
        );
      }

      await env.KV.put(`preferences:${userId}`, JSON.stringify(schemaValidation.data));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify(createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED')),
      { 
        status: 405, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse('Failed to process preferences', 500, 'PREFERENCES_ERROR')),
      { 
        status: 500, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleToolsSearch(request, env) {
  const origin = request.headers.get('Origin') || '';
  
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || '';

    // Validate input
    if (!validateInput.searchQuery(query) && query !== '') {
      return new Response(
        JSON.stringify(createErrorResponse('Invalid search query', 400, 'INVALID_QUERY')),
        { 
          status: 400, 
          headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock search results with validation
    const results = [
      {
        id: 'figma',
        name: 'Figma',
        description: 'Collaborative design tool',
        category: 'ui-design',
        pricing: 'freemium'
      },
      {
        id: 'sketch',
        name: 'Sketch',
        description: 'Digital design platform',
        category: 'ui-design',
        pricing: 'paid'
      }
    ].filter(tool => 
      tool.name.toLowerCase().includes(query.toLowerCase()) &&
      (!category || tool.category === category)
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse('Search failed', 500, 'SEARCH_ERROR')),
      { 
        status: 500, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleAnalytics(request, env) {
  const origin = request.headers.get('Origin') || '';
  
  if (!env.db) {
    return new Response(
      JSON.stringify(createErrorResponse('Database not available', 503, 'DB_UNAVAILABLE')),
      { 
        status: 503, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Mock analytics data (would query database in production)
    const analytics = {
      page_views: 1250,
      unique_visitors: 342,
      tools_searched: 89,
      popular_tools: ['figma', 'sketch', 'adobe-xd'],
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse('Analytics data unavailable', 500, 'ANALYTICS_ERROR')),
      { 
        status: 500, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleFileUpload(request, env) {
  const origin = request.headers.get('Origin') || '';
  
  if (!env["mfm-corporation-uploads"]) {
    return new Response(
      JSON.stringify(createErrorResponse('R2 storage not available', 503, 'R2_UNAVAILABLE')),
      { 
        status: 503, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify(createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED')),
      { 
        status: 405, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(
        JSON.stringify(createErrorResponse('No file provided', 400, 'NO_FILE')),
        { 
          status: 400, 
          headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file size
    if (file.size > SECURITY_CONFIG.maxFileSize) {
      return new Response(
        JSON.stringify(createErrorResponse('File too large', 413, 'FILE_TOO_LARGE')),
        { 
          status: 413, 
          headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify(createErrorResponse('File type not allowed', 400, 'INVALID_FILE_TYPE')),
        { 
          status: 400, 
          headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
        }
      );
    }

    const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    await env["mfm-corporation-uploads"].put(fileName, file);

    return new Response(JSON.stringify({ 
      success: true, 
      fileName: fileName,
      url: `https://pub-mfm-corporation-uploads.r2.dev/${fileName}`,
      size: file.size,
      type: file.type
    }), {
      status: 200,
      headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify(createErrorResponse('File upload failed', 500, 'UPLOAD_ERROR')),
      { 
        status: 500, 
        headers: { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' }
      }
    );
  }
}
