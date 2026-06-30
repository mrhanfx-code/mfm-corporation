// Distributed tracing with OpenTelemetry
// Provides end-to-end request tracing across services

let tracer = null;
let provider = null;

export function initTracing(env) {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log('[Tracing] OpenTelemetry endpoint not configured, tracing disabled');
    return;
  }

  try {
    // Dynamic import for OpenTelemetry
    import('@opentelemetry/api').then(otel => {
      const { trace } = otel;
      tracer = trace.getTracer('mfm-corporation', '1.0.0');
      console.log('[Tracing] OpenTelemetry initialized');
    }).catch(err => {
      console.error('[Tracing] Failed to initialize OpenTelemetry:', err);
    });
  } catch (err) {
    console.error('[Tracing] OpenTelemetry import failed:', err);
  }
}

export function startSpan(name, options = {}) {
  if (!tracer) {
    return {
      end: () => {},
      setAttribute: () => {},
      recordException: () => {},
      setStatus: () => {}
    };
  }

  return tracer.startSpan(name, options);
}

export function startActiveSpan(name, fn, options = {}) {
  if (!tracer) {
    return fn(null);
  }

  return tracer.startActiveSpan(name, options, fn);
}

export function recordException(span, error) {
  if (!span) return;
  
  span.recordException(error);
  span.setStatus({ code: 2, message: error.message }); // Error status
}

export function setSpanAttributes(span, attributes) {
  if (!span) return;
  
  span.setAttributes(attributes);
}

export function setSpanStatus(span, status) {
  if (!span) return;
  
  span.setStatus(status);
}

// Context propagation for distributed tracing
export function injectContext(context) {
  if (!tracer) return {};
  
  // Would use OpenTelemetry context propagation
  return context;
}

export function extractContext(carrier) {
  if (!tracer) return null;
  
  // Would use OpenTelemetry context extraction
  return null;
}

// Common span attributes
export const SPAN_ATTRIBUTES = {
  // Agent attributes
  AGENT_ID: 'agent.id',
  AGENT_NAME: 'agent.name',
  AGENT_DEPARTMENT: 'agent.department',
  
  // Task attributes
  TASK_ID: 'task.id',
  TASK_TYPE: 'task.type',
  TASK_STATUS: 'task.status',
  
  // LLM attributes
  LLM_PROVIDER: 'llm.provider',
  LLM_MODEL: 'llm.model',
  LLM_TOKENS: 'llm.tokens',
  LLM_LATENCY: 'llm.latency',
  
  // Database attributes
  DB_OPERATION: 'db.operation',
  DB_TABLE: 'db.table',
  DB_ROWS: 'db.rows',
  
  // External API attributes
  API_URL: 'api.url',
  API_METHOD: 'api.method',
  API_STATUS: 'api.status',
  
  // Error attributes
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
};

// Span names
export const SPAN_NAMES = {
  AGENT_EXECUTION: 'agent.execution',
  LLM_CALL: 'llm.call',
  TOOL_EXECUTION: 'tool.execution',
  DATABASE_QUERY: 'database.query',
  API_REQUEST: 'api.request',
  ORCHESTRATOR_ROUTING: 'orchestrator.routing',
};
