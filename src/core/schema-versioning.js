// Schema versioning for data structures
// Manages versioned schemas for backward compatibility

class SchemaVersionManager {
  constructor(env) {
    this.env = env;
    this.schemas = new Map();
    this.currentVersion = '1.0.0';
  }

  registerSchema(name, version, schema, migration = null) {
    const schemaKey = `${name}:${version}`;
    
    this.schemas.set(schemaKey, {
      name,
      version,
      schema,
      migration,
      registeredAt: new Date().toISOString()
    });
    
    console.log(`[SchemaVersioning] Registered schema ${name} v${version}`);
  }

  async getCurrentSchemaVersion(name) {
    if (this.env.KV) {
      try {
        const version = await this.env.KV.get(`schema:${name}:version`);
        if (version) {
          return version;
        }
      } catch (error) {
        console.error('[SchemaVersioning] Failed to get current version:', error);
      }
    }
    
    return '1.0.0';
  }

  async setCurrentSchemaVersion(name, version) {
    if (this.env.KV) {
      try {
        await this.env.KV.put(`schema:${name}:version`, version);
      } catch (error) {
        console.error('[SchemaVersioning] Failed to set current version:', error);
      }
    }
  }

  getSchema(name, version = null) {
    if (!version) {
      version = '1.0.0';
    }
    
    const schemaKey = `${name}:${version}`;
    return this.schemas.get(schemaKey);
  }

  async validateData(name, data, version = null) {
    const schema = this.getSchema(name, version);
    
    if (!schema) {
      console.warn(`[SchemaVersioning] Schema not found: ${name} v${version}`);
      return { valid: true, version: version || '1.0.0' };
    }
    
    // Basic validation against schema
    const errors = this.validateAgainstSchema(data, schema.schema);
    
    return {
      valid: errors.length === 0,
      errors,
      version: schema.version
    };
  }

  validateAgainstSchema(data, schema) {
    const errors = [];
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          const fieldErrors = this.validateField(data[field], fieldSchema, field);
          errors.push(...fieldErrors);
        }
      }
    }
    
    return errors;
  }

  validateField(value, schema, fieldName) {
    const errors = [];
    
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        errors.push(`${fieldName}: Expected ${schema.type}, got ${actualType}`);
      }
    }
    
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${fieldName}: Minimum length ${schema.minLength} required`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${fieldName}: Maximum length ${schema.maxLength} exceeded`);
      }
    }
    
    return errors;
  }

  async migrateData(name, data, fromVersion, toVersion) {
    const fromSchema = this.getSchema(name, fromVersion);
    const toSchema = this.getSchema(name, toVersion);
    
    if (!fromSchema || !toSchema) {
      throw new Error('Schema not found for migration');
    }
    
    if (!fromSchema.migration) {
      console.warn(`[SchemaVersioning] No migration defined for ${name} ${fromVersion} -> ${toVersion}`);
      return data;
    }
    
    try {
      const migratedData = await fromSchema.migration(data, fromVersion, toVersion);
      
      // Validate migrated data
      const validation = await this.validateData(name, migratedData, toVersion);
      
      if (!validation.valid) {
        console.error('[SchemaVersioning] Migration validation failed:', validation.errors);
        throw new Error('Migration validation failed');
      }
      
      return migratedData;
    } catch (error) {
      console.error('[SchemaVersioning] Migration failed:', error);
      throw error;
    }
  }

  async autoMigrate(name, data) {
    const currentVersion = await this.getCurrentSchemaVersion(name);
    const dataVersion = data._version || '1.0.0';
    
    if (dataVersion === currentVersion) {
      return data;
    }
    
    console.log(`[SchemaVersioning] Auto-migrating ${name} from ${dataVersion} to ${currentVersion}`);
    
    const migratedData = await this.migrateData(name, data, dataVersion, currentVersion);
    migratedData._version = currentVersion;
    
    return migratedData;
  }

  listSchemas(name = null) {
    const schemas = [];
    
    for (const [key, schema] of this.schemas.entries()) {
      if (!name || schema.name === name) {
        schemas.push(schema);
      }
    }
    
    return schemas.sort((a, b) => b.version.localeCompare(a.version));
  }

  // Common schemas
  initializeCommonSchemas() {
    // Task schema v1.0.0
    this.registerSchema('task', '1.0.0', {
      type: 'object',
      required: ['id', 'agent', 'input', 'created_at'],
      properties: {
        id: { type: 'string' },
        agent: { type: 'string' },
        input: { type: 'string' },
        output: { type: 'string' },
        quality_score: { type: 'number' },
        status: { type: 'string' },
        created_at: { type: 'string' },
        completed_at: { type: 'string' }
      }
    });

    // Task schema v1.1.0 (added user_id)
    this.registerSchema('task', '1.1.0', {
      type: 'object',
      required: ['id', 'agent', 'input', 'created_at', 'user_id'],
      properties: {
        id: { type: 'string' },
        agent: { type: 'string' },
        input: { type: 'string' },
        output: { type: 'string' },
        quality_score: { type: 'number' },
        status: { type: 'string' },
        created_at: { type: 'string' },
        completed_at: { type: 'string' },
        user_id: { type: 'string' },
        _version: { type: 'string' }
      }
    }, async (data, from, to) => {
      // Migration from 1.0.0 to 1.1.0
      if (from === '1.0.0' && to === '1.1.0') {
        return {
          ...data,
          user_id: data.user_id || 'system',
          _version: '1.1.0'
        };
      }
      return data;
    });

    // Agent memory schema v1.0.0
    this.registerSchema('agent_memory', '1.0.0', {
      type: 'object',
      required: ['agent_id', 'key', 'value', 'created_at'],
      properties: {
        agent_id: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
        created_at: { type: 'string' },
        expires_at: { type: 'string' }
      }
    });

    // Model usage schema v1.0.0
    this.registerSchema('model_usage', '1.0.0', {
      type: 'object',
      required: ['model', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost', 'timestamp'],
      properties: {
        model: { type: 'string' },
        prompt_tokens: { type: 'number' },
        completion_tokens: { type: 'number' },
        total_tokens: { type: 'number' },
        cost: { type: 'number' },
        timestamp: { type: 'number' },
        task_id: { type: 'string' },
        user_id: { type: 'string' }
      }
    });
  }
}

// Singleton instance
let schemaVersionInstance = null;

export function getSchemaVersionManager(env) {
  if (!schemaVersionInstance) {
    schemaVersionInstance = new SchemaVersionManager(env);
    schemaVersionInstance.initializeCommonSchemas();
  }
  return schemaVersionInstance;
}

export function resetSchemaVersionManager() {
  schemaVersionInstance = null;
}
