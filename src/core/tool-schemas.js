// Tool Parameter Validation Schemas using Zod

import { z } from 'zod';

// Web & Search Tools
const WebFetchSchema = z.object({
  url: z.string().url('Invalid URL format'),
  maxChars: z.number().min(1).max(10000).optional()
});

const ExaSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  numResults: z.number().min(1).max(20).optional()
});

const PerplexitySearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

const BraveSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  count: z.number().min(1).max(20).optional()
});

// Communication Tools
const SendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1).max(500, 'Subject must be 1-500 characters'),
  body: z.string().min(1).max(10000, 'Body must be 1-10000 characters')
});

const SocialPostSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok'], 'Invalid platform'),
  text: z.string().optional(),
  caption: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  videoUrl: z.string().url('Invalid video URL').optional()
});

const SlackNotifySchema = z.object({
  text: z.string().min(1, 'Message cannot be empty')
});

const SMSAlertSchema = z.object({
  to: z.string().min(10, 'Invalid phone number'),
  message: z.string().min(1).max(160, 'Message must be 1-160 characters')
});

// GitHub Tools
const GitHubIssuesSchema = z.object({
  owner: z.string().min(1, 'Owner cannot be empty'),
  repo: z.string().min(1, 'Repo cannot be empty'),
  state: z.enum(['open', 'closed', 'all']).optional()
});

const GitHubPushSchema = z.object({
  repo: z.string().min(1, 'Repo cannot be empty'),
  path: z.string().min(1, 'Path cannot be empty'),
  content: z.string().min(1, 'Content cannot be empty'),
  message: z.string().min(1).max(200).optional()
});

const GitHubCreateRepoSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be 1-100 characters'),
  description: z.string().max(500).optional()
});

const GitHubListReposSchema = z.object({});

// Notion Tools
const NotionSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

// Google Drive Tools
const DriveListSchema = z.object({
  folderId: z.string().optional()
});

const DriveReadSchema = z.object({
  fileId: z.string().min(1, 'File ID cannot be empty')
});

const DriveWriteSchema = z.object({
  fileName: z.string().min(1).max(255, 'Filename must be 1-255 characters'),
  content: z.string().min(1, 'Content cannot be empty'),
  folderId: z.string().optional()
});

const DriveSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

// Calendar Tools
const CalendarListSchema = z.object({
  maxResults: z.number().min(1).max(50).optional()
});

const CalendarCreateSchema = z.object({
  summary: z.string().min(1).max(200, 'Summary must be 1-200 characters'),
  startDatetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid datetime format (use ISO 8601)'),
  endDatetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid datetime format (use ISO 8601)'),
  description: z.string().max(2000).optional(),
  attendees: z.array(z.string().email()).optional()
});

const CalendarFreeSlotSchema = z.object({
  durationMinutes: z.number().min(15).max(480).optional(),
  withinDays: z.number().min(1).max(30).optional()
});

// PDF Tools
const PDFGenerateSchema = z.object({
  title: z.string().min(1).max(200, 'Title must be 1-200 characters'),
  content: z.string().min(1, 'Content cannot be empty')
});

// Stripe Tools
const StripeBalanceSchema = z.object({});

const StripeChargesSchema = z.object({
  limit: z.number().min(1).max(100).optional()
});

// Video Tools
const VideoPromptSchema = z.object({
  topic: z.string().min(1).optional(),
  style: z.enum(['cinematic', 'social', 'product']).optional(),
  duration: z.string().optional(),
  platform: z.enum(['instagram', 'tiktok', 'facebook']).optional()
});

// Codegraph Tools
const CodegraphQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

const CodegraphContextSchema = z.object({
  task: z.string().min(1, 'Task cannot be empty')
});

// Database Tools
const D1QuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  params: z.array(z.any()).optional()
});

// Memory Tools
const MemorySearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  limit: z.number().min(1).max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
  categories: z.array(z.string()).optional()
});

const MemoryRememberSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  importance: z.enum(['low', 'normal', 'high']).optional()
});

const MemoryContextSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  limit: z.number().min(1).max(20).optional(),
  includeHistory: z.boolean().optional()
});

const MemoryEnrichSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  enrichWith: z.array(z.enum(['category', 'metadata', 'related'])).optional(),
  query: z.string().optional()
});

// Complete schema registry
const ToolSchemas = {
  'web-fetch': WebFetchSchema,
  'send-email': SendEmailSchema,
  'exa-search': ExaSearchSchema,
  'social-post': SocialPostSchema,
  'perplexity-search': PerplexitySearchSchema,
  'brave-search': BraveSearchSchema,
  'github-issues': GitHubIssuesSchema,
  'notion-search': NotionSearchSchema,
  'drive-list': DriveListSchema,
  'drive-read': DriveReadSchema,
  'drive-write': DriveWriteSchema,
  'drive-search': DriveSearchSchema,
  'calendar-list': CalendarListSchema,
  'calendar-create': CalendarCreateSchema,
  'calendar-free-slot': CalendarFreeSlotSchema,
  'pdf-generate': PDFGenerateSchema,
  'slack-notify': SlackNotifySchema,
  'sms-alert': SMSAlertSchema,
  'stripe-balance': StripeBalanceSchema,
  'stripe-charges': StripeChargesSchema,
  'github-push': GitHubPushSchema,
  'github-create-repo': GitHubCreateRepoSchema,
  'github-list-repos': GitHubListReposSchema,
  'video-prompt': VideoPromptSchema,
  'codegraph-query': CodegraphQuerySchema,
  'codegraph-context': CodegraphContextSchema,
  'd1-query': D1QuerySchema,
  'memory-search': MemorySearchSchema,
  'memory-remember': MemoryRememberSchema,
  'memory-context': MemoryContextSchema,
  'memory-enrich': MemoryEnrichSchema
};

/**
 * Validate tool parameters against Zod schema
 * @param {string} toolName - Name of the tool
 * @param {object} args - Arguments to validate
 * @returns {object} Validated arguments
 * @throws {Error} If validation fails
 */
function validateToolCall(toolName, args) {
  const schema = ToolSchemas[toolName];
  
  if (!schema) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  try {
    return schema.parse(args);
  } catch (error) {
    if (error.name === 'ZodError') {
      const formattedErrors = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      throw new Error(`Validation failed for ${toolName}: ${formattedErrors}`);
    }
    throw error;
  }
}

/**
 * Get schema for a tool
 * @param {string} toolName - Name of the tool
 * @returns {z.ZodSchema|null} Schema or null if not found
 */
function getToolSchema(toolName) {
  return ToolSchemas[toolName] || null;
}

/**
 * List all available tool names
 * @returns {string[]} Array of tool names
 */
function listToolNames() {
  return Object.keys(ToolSchemas);
}

export { 
  ToolSchemas, 
  validateToolCall, 
  getToolSchema, 
  listToolNames 
};
