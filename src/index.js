// MFM Corporation Cloudflare Worker API
// Backend API endpoints for enhanced functionality

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route requests to appropriate handlers
      switch (path) {
        case '/api/status':
          return handleStatus(request, env);
        case '/api/user/preferences':
          return handleUserPreferences(request, env);
        case '/api/tools/search':
          return handleToolsSearch(request, env);
        case '/api/analytics':
          return handleAnalytics(request, env);
        case '/api/upload':
          return handleFileUpload(request, env);
        default:
          return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Handle system status
async function handleStatus(request, env) {
  const status = {
    system: 'MFM Corporation',
    version: '2.0.0',
    platform: 'Cloudflare Pages',
    features: {
      database: !!env.DB,
      kv_storage: !!env.KV_BINDING,
      r2_storage: !!env.BUCKET,
      workers: true
    },
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle user preferences
async function handleUserPreferences(request, env) {
  if (!env.KV_BINDING) {
    return new Response(JSON.stringify({ error: 'KV storage not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'default';

  if (request.method === 'GET') {
    const preferences = await env.KV_BINDING.get(`preferences:${userId}`);
    return new Response(preferences || '{}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const preferences = await request.json();
    await env.KV_BINDING.put(`preferences:${userId}`, JSON.stringify(preferences));
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle tools search
async function handleToolsSearch(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || '';

  // Mock search results (would integrate with actual tools database)
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
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle analytics
async function handleAnalytics(request, env) {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mock analytics data
  const analytics = {
    page_views: 1250,
    unique_visitors: 342,
    tools_searched: 89,
    popular_tools: ['figma', 'sketch', 'adobe-xd'],
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(analytics), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle file uploads
async function handleFileUpload(request, env) {
  if (!env.BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 storage not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const fileName = `uploads/${Date.now()}-${file.name}`;
  await env.BUCKET.put(fileName, file);

  return new Response(JSON.stringify({ 
    success: true, 
    fileName: fileName,
    url: `https://pub-${env.BUCKET.bucketName}.r2.dev/${fileName}`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
