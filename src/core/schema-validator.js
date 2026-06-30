// Schema validation for model outputs
// Validates LLM responses against expected schemas

class SchemaValidator {
  constructor(env) {
    this.env = env;
    this.schemas = new Map();
  }

  addSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  getSchema(name) {
    return this.schemas.get(name);
  }

  validate(data, schemaName) {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      console.error(`[SchemaValidator] Schema not found: ${schemaName}`);
      return { valid: false, error: 'Schema not found' };
    }

    return this.validateAgainstSchema(data, schema);
  }

  validateAgainstSchema(data, schema) {
    const errors = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check field types and constraints
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          const fieldErrors = this.validateField(data[field], fieldSchema, field);
          errors.push(...fieldErrors);
        }
      }
    }

    // Check additional properties
    if (schema.additionalProperties === false) {
      const allowedFields = Object.keys(schema.properties || {});
      const actualFields = Object.keys(data);
      const extraFields = actualFields.filter(f => !allowedFields.includes(f));
      
      if (extraFields.length > 0) {
        errors.push(`Unexpected fields: ${extraFields.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data
    };
  }

  validateField(value, schema, fieldName) {
    const errors = [];

    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (actualType !== schema.type) {
        errors.push(`${fieldName}: Expected ${schema.type}, got ${actualType}`);
        return errors;
      }
    }

    // String validation
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${fieldName}: Minimum length ${schema.minLength} required`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${fieldName}: Maximum length ${schema.maxLength} exceeded`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${fieldName}: Does not match required pattern`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${fieldName}: Must be one of ${schema.enum.join(', ')}`);
      }
    }

    // Number validation
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${fieldName}: Minimum value ${schema.minimum} required`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${fieldName}: Maximum value ${schema.maximum} exceeded`);
      }
    }

    // Array validation
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`${fieldName}: Minimum ${schema.minItems} items required`);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`${fieldName}: Maximum ${schema.maxItems} items exceeded`);
      }
      
      // Validate array items
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemErrors = this.validateField(value[i], schema.items, `${fieldName}[${i}]`);
          errors.push(...itemErrors);
        }
      }
    }

    // Object validation
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      if (schema.properties) {
        for (const [subField, subSchema] of Object.entries(schema.properties)) {
          if (subField in value) {
            const subErrors = this.validateField(value[subField], subSchema, `${fieldName}.${subField}`);
            errors.push(...subErrors);
          }
        }
      }
    }

    return errors;
  }

  async validateLLMResponse(response, schemaName, context = {}) {
    let data = response;
    
    // Extract content if response has content field
    if (typeof response === 'object' && response.content) {
      data = response.content;
    }
    
    // Try to parse JSON if string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to parse response as JSON',
          response
        };
      }
    }
    
    const validation = this.validate(data, schemaName);
    
    if (!validation.valid) {
      console.error(`[SchemaValidator] Validation failed for ${schemaName}:`, validation.errors);
      
      // Log to audit log
      const { getAuditLogger } = await import('./audit-logger.js');
      const auditLogger = getAuditLogger(this.env);
      
      await auditLogger.logSecurityEvent('schema_validation_failed', {
        schema: schemaName,
        errors: validation.errors,
        context
      }, context.userId || 'system');
    }
    
    return validation;
  }

  // Common schemas
  initializeCommonSchemas() {
    // Task response schema
    this.addSchema('task_response', {
      type: 'object',
      required: ['status', 'result'],
      properties: {
        status: { type: 'string', enum: ['success', 'error', 'pending'] },
        result: { type: 'string' },
        error: { type: 'string' },
        metadata: { type: 'object' }
      }
    });

    // Agent response schema
    this.addSchema('agent_response', {
      type: 'object',
      required: ['agent', 'response'],
      properties: {
        agent: { type: 'string', minLength: 1 },
        response: { type: 'string', minLength: 1 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        tools_used: { type: 'array', items: { type: 'string' } }
      }
    });

    // GitHub operation schema
    this.addSchema('github_operation', {
      type: 'object',
      required: ['operation', 'repository'],
      properties: {
        operation: { type: 'string', enum: ['create', 'update', 'delete', 'read'] },
        repository: { type: 'string', minLength: 1 },
        files: { type: 'array', items: { type: 'object' } },
        message: { type: 'string' }
      }
    });

    // Email schema
    this.addSchema('email', {
      type: 'object',
      required: ['to', 'subject', 'body'],
      properties: {
        to: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        subject: { type: 'string', minLength: 1, maxLength: 500 },
        body: { type: 'string', minLength: 1 },
        cc: { type: 'array', items: { type: 'string' } },
        bcc: { type: 'array', items: { type: 'string' } }
      }
    });
  }
}

// Singleton instance
let validatorInstance = null;

export function getSchemaValidator(env) {
  if (!validatorInstance) {
    validatorInstance = new SchemaValidator(env);
    validatorInstance.initializeCommonSchemas();
  }
  return validatorInstance;
}

export function resetSchemaValidator() {
  validatorInstance = null;
}
