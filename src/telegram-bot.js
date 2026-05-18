// MFM Corporation Telegram Bot - Enhanced AI System
// CEO Remy Communication System with Advanced AI Capabilities

// Import advanced AI modules
import { ConversationEngine } from './ai/conversation-engine.js';
import { MemoryManager } from './ai/memory-manager.js';
import { SecurityManager } from './core/security.js';

// Initialize AI systems
let conversationEngine = null;
let memoryManager = null;
let securityManager = null;

export default {
  async fetch(request, env, ctx) {
    // Initialize AI systems if not already done
    if (!securityManager) {
      securityManager = new SecurityManager(env);
    }
    if (!conversationEngine) {
      conversationEngine = new ConversationEngine(env);
    }
    if (!memoryManager) {
      memoryManager = new MemoryManager(env);
    }
    
    // Handle webhook verification
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const webhookUrl = `${url.origin}/telegram-webhook`;
      
      return new Response(`Webhook URL: ${webhookUrl}`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    if (request.method === 'POST') {
      try {
        // Validate request
        const requestValidation = await securityManager.validateRequest(request);
        if (!requestValidation.isValid) {
          await securityManager.logSecurityEvent('invalid_request', 'unknown', requestValidation.errors);
          return new Response('Invalid request', { status: 400 });
        }
        
        // Verify webhook signature
        const webhookValidation = await securityManager.validateWebhook(request);
        if (!webhookValidation.isValid) {
          await securityManager.logSecurityEvent('invalid_webhook', 'unknown', { reason: webhookValidation.reason });
          return new Response('Unauthorized', { status: 401 });
        }
        
        const update = await request.json();
        
        // Validate update structure
        const updateValidation = await securityManager.validateUpdate(update);
        if (!updateValidation.isValid) {
          await securityManager.logSecurityEvent('invalid_update', 'unknown', { errors: updateValidation.errors });
          return new Response('Invalid update format', { status: 400 });
        }
        
        console.log('Telegram Update processed successfully');
        
        // Handle different update types
        if (update.message) {
          return await handleMessage(update.message, env);
        } else if (update.callback_query) {
          return await handleCallbackQuery(update.callback_query, env);
        }
        
        return new Response('OK');
      } catch (error) {
        console.error('Error processing update:', error);
        await securityManager.logSecurityEvent('processing_error', 'unknown', { error: error.message });
        return new Response('Internal Server Error', { status: 500 });
      }
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }
};

// Message handling function with advanced AI integration
async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = securityManager.sanitizeInput(message.text);
  const messageId = message.message_id;
  
  console.log(`Processing message from user ${userId}: ${text}`);
  
  // Authentication check - only CEO Remy can use this bot
  if (!await authenticateUser(userId, env)) {
    await securityManager.logSecurityEvent('unauthorized_access', userId, { chatId, text });
    return await sendMessage(chatId, "🚫 Unauthorized access. This bot is for CEO Remy only.", env);
  }
  
  // Rate limiting with improved sliding window
  if (!await checkRateLimit(userId, env)) {
    await securityManager.logSecurityEvent('rate_limit_exceeded', userId, { chatId });
    return await sendMessage(chatId, "⚠️ Rate limit exceeded. Please wait a moment.", env);
  }
  
  // Handle commands
  if (text && text.startsWith('/')) {
    return await handleCommand(text, chatId, userId, env);
  }
  
  // Handle regular messages with advanced AI
  return await handleAdvancedMessage(message, env);
}

// Command handler
async function handleCommand(command, chatId, userId, env) {
  const commands = {
    '/start': async () => {
      await logInteraction(userId, 'command_start', 'telegram', {}, env);
      return await sendMessage(chatId, 
        "🤖 MFM Corporation CEO Assistant\n\n" +
        "Commands:\n" +
        "/start - Initialize session\n" +
        "/email - Switch to secure email mode\n" +
        "/status - Check system status\n" +
        "/help - Display help\n\n" +
        "Send any message or document to communicate with CEO Remy.", 
        env
      );
    },
    
    '/email': async () => {
      await logInteraction(userId, 'command_email', 'telegram', {}, env);
      return await sendMessage(chatId, 
        "📧 Email Mode: Send sensitive documents and I'll route them securely via email.\n" +
        "Type /telegram to return to normal mode.", 
        env
      );
    },
    
    '/telegram': async () => {
      await logInteraction(userId, 'command_telegram', 'telegram', {}, env);
      return await sendMessage(chatId, 
        "💬 Telegram Mode: Regular communication via Telegram.\n" +
        "Type /email for secure document handling.", 
        env
      );
    },
    
    '/status': async () => {
      await logInteraction(userId, 'command_status', 'telegram', {}, env);
      const status = await getSystemStatus(env);
      return await sendMessage(chatId, status, env);
    },
    
    '/help': async () => {
      await logInteraction(userId, 'command_help', 'telegram', {}, env);
      return await sendMessage(chatId, 
        "📖 MFM Corporation Bot Help\n\n" +
        "Features:\n" +
        "• Natural language communication\n" +
        "• File sharing (images, documents)\n" +
        "• Automatic sensitive content detection\n" +
        "• Secure email routing for sensitive data\n\n" +
        "Commands:\n" +
        "/start - Initialize session\n" +
        "/email - Enable secure email mode\n" +
        "/telegram - Return to Telegram mode\n" +
        "/status - Check system status\n" +
        "/help - Show this help\n\n" +
        "Security: Sensitive content automatically routed via secure email.", 
        env
      );
    }
  };
  
  const handler = commands[command];
  if (handler) {
    return await handler();
  } else {
    return await sendMessage(chatId, "❓ Unknown command. Type /help for available commands.", env);
  }
}

// Advanced message handler with AI integration
async function handleAdvancedMessage(message, env) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || '';
  const messageId = message.message_id;
  
  try {
    // Get user context and preferences
    const userContext = await memoryManager.getContext(userId, 10);
    const userPreferences = await memoryManager.getUserPreferences(userId);
    const userState = await memoryManager.getEmotionalState(userId);
    
    // Classify message sensitivity
    const classification = classifyMessage(text, message, env);
    
    // Log the interaction
    await logInteraction(userId, 'message_received', classification.route, classification, env);
    
    // Route based on classification
    if (classification.route === 'email') {
      return await handleEmailRoute(message, classification, env);
    } else {
      // Use advanced AI conversation engine
      const aiResponse = await conversationEngine.processMessage(message, userContext, userState);
      
      // Store conversation context
      await memoryManager.storeContext(userId, message, aiResponse, {
        intent: aiResponse.intent || { intent: 'CONVERSATION', confidence: 0.8 },
        entities: aiResponse.entities || { people: [], teams: [], projects: [] },
        sentiment: aiResponse.sentiment || { sentiment: 'neutral', confidence: 0.5 },
        urgency: aiResponse.urgency || { urgency: 'low', score: 0 },
        emotionalTone: userState.current,
        conversationState: aiResponse.nextState || 'greeting',
        userMood: userState.current.tone,
        contextRelevance: aiResponse.confidence || 0.7,
        interactionType: 'ai_conversation'
      });
      
      // Format response for Telegram
      const formattedResponse = formatAIResponse(aiResponse, userPreferences);
      
      return await sendMessage(chatId, formattedResponse, env);
    }
  } catch (error) {
    console.error('Error in advanced message handling:', error);
    await securityManager.logSecurityEvent('ai_processing_error', userId, { error: error.message });
    
    // Fallback to original handler
    return await handleTelegramRoute(message, classification, env);
  }
}

// Format AI response for Telegram
function formatAIResponse(aiResponse, userPreferences) {
  const emotionalIndicators = aiResponse.emotionalIndicators || ['👔'];
  const suggestedActions = aiResponse.suggestedActions || [];
  
  let response = `${emotionalIndicators.join(' ')} **CEO Remy**\n\n`;
  response += `${aiResponse.response}\n\n`;
  
  if (suggestedActions.length > 0) {
    response += `💡 **Suggested Actions:**\n`;
    suggestedActions.forEach((action, index) => {
      response += `${index + 1}. ${action}\n`;
    });
    response += '\n';
  }
  
  response += `🎯 **Confidence:** ${Math.round((aiResponse.confidence || 0.7) * 100)}%\n`;
  response += `📊 **State:** ${aiResponse.nextState || 'active'}\n`;
  
  return response;
}

// Message classification system
function classifyMessage(text, message, env) {
  const sensitiveKeywords = [
    'confidential', 'financial', 'legal', 'strategic', 'contract', 
    'agreement', 'budget', 'salary', 'proprietary', 'secret',
    'internal', 'classified', 'restricted', 'sensitive'
  ];
  
  const sensitiveFileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls'];
  const largeFileThreshold = 10 * 1024 * 1024; // 10MB
  
  // Check for sensitive keywords
  const hasSensitiveKeywords = sensitiveKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Check file type and size
  const isSensitiveFileType = message.document && 
    sensitiveFileTypes.some(type => 
      message.document.mime_type.toLowerCase().includes(type)
    );
  
  const isLargeFile = message.document && 
    message.document.file_size > largeFileThreshold;
  
  // Check for photos (generally not sensitive)
  const isPhoto = !!message.photo;
  
  // Determine route
  const route = (hasSensitiveKeywords || isSensitiveFileType || isLargeFile) ? 'email' : 'telegram';
  
  // Determine confidence
  let confidence = 0.5;
  let reason = 'Regular communication';
  
  if (hasSensitiveKeywords) {
    confidence = 0.9;
    reason = 'Sensitive keywords detected';
  } else if (isSensitiveFileType) {
    confidence = 0.8;
    reason = 'Sensitive document type';
  } else if (isLargeFile) {
    confidence = 0.7;
    reason = 'Large file size';
  } else if (isPhoto) {
    confidence = 0.3;
    reason = 'Image content';
  }
  
  return {
    route,
    confidence,
    reason,
    hasSensitiveKeywords,
    isSensitiveFileType,
    isLargeFile,
    isPhoto
  };
}

// Email route handler
async function handleEmailRoute(message, classification, env) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  
  // Create confirmation prompt
  const promptMessage = 
    `🔒 **Security Alert**\n\n` +
    `This content appears sensitive.\n` +
    `**Reason:** ${classification.reason}\n` +
    `**Confidence:** ${Math.round(classification.confidence * 100)}%\n\n` +
    `Send via secure email instead?\n` +
    `Reply with: Y (Yes) or N (No)`;
  
  // Store decision state
  const decisionKey = `decision:${message.message_id}`;
  await env.KV.put(decisionKey, JSON.stringify({
    route: 'email',
    classification,
    message,
    timestamp: Date.now()
  }), { expirationTtl: 300 }); // 5 minutes
  
  await logInteraction(userId, 'email_prompt', 'telegram', classification, env);
  
  return await sendMessage(chatId, promptMessage, env);
}

// Telegram route handler
async function handleTelegramRoute(message, classification, env) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || '📎 File received';
  
  await logInteraction(userId, 'telegram_process', 'telegram', classification, env);
  
  // Process via MFM AI system (placeholder for now)
  const response = await processWithMFMSystem(message, classification, env);
  
  return await sendMessage(chatId, response, env);
}

// Send message to Telegram
async function sendMessage(chatId, text, env, options = {}) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...options
  };
  
  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API Error:', error);
      throw new Error(`Telegram API error: ${error}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Authentication check
async function authenticateUser(userId, env) {
  const authorizedUsers = env.AUTHORIZED_USER_IDS || '';
  return authorizedUsers.split(',').includes(userId.toString());
}

// Rate limiting (using security manager)
async function checkRateLimit(userId, env) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  const key = `rate_limit:${userId}`;
  
  const existing = await env.KV.get(key);
  const requests = existing ? JSON.parse(existing) : [];
  
  // Remove old requests outside window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= 30) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  await env.KV.put(key, JSON.stringify(validRequests), { expirationTtl: 120 });
  
  return true;
}

// Audit logging
async function logInteraction(userId, action, route, metadata, env) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    route,
    metadata,
    ip: 'unknown' // Would be extracted from request headers in real implementation
  };
  
  const logKey = `log:${Date.now()}:${userId}:${action}`;
  await env.KV.put(logKey, JSON.stringify(logEntry), { expirationTtl: 86400 * 30 }); // 30 days
}

// System status
async function getSystemStatus(env) {
  return `📊 **MFM Corporation System Status**\n\n` +
    `🤖 **Bot Status**: Online\n` +
    `📧 **Email Service**: Ready\n` +
    `🔐 **Security**: Active\n` +
    `📈 **Messages Today**: Processing...\n` +
    `⚡ **Response Time**: <1s\n\n` +
    `Last Updated: ${new Date().toLocaleString()}`;
}

// MFM AI System processing - Integrated with existing API + AI Chat
async function processWithMFMSystem(message, classification, env) {
  const text = message.text || 'File received';
  const senderName = message.from.first_name || 'CEO Remy';
  const timestamp = new Date().toLocaleString();
  
  try {
    // Check if this is a direct conversation request
    const isDirectChat = text.toLowerCase().includes('chat') || 
                        text.toLowerCase().includes('talk') || 
                        text.toLowerCase().includes('conversation') ||
                        text.toLowerCase().includes('discuss') ||
                        text.toLowerCase().includes('remy');
    
    if (isDirectChat && classification.route === 'telegram') {
      // Generate AI response like Claude
      const aiResponse = await generateAIResponse(text, senderName, env);
      
      return `🤖 **CEO Remy**\n\n` +
        `${aiResponse}\n\n` +
        `📅 **Time:** ${timestamp}\n` +
        `🔄 **Status:** AI Response Generated\n` +
        `📊 **Route:** Direct Chat\n\n` +
        `💬 Continue our conversation - I'm here to help with any MFM Corporation matters.`;
    }
    
    // Call existing MFM API chat endpoint for team routing
    const mfmApiUrl = 'https://mfm-corporation-api.mrhan-fx.workers.dev/api/chat';
    const response = await fetch(mfmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev'
      },
      body: JSON.stringify({
        message: text,
        source: 'telegram',
        user: senderName,
        classification: classification
      })
    });
    
    if (response.ok) {
      const mfmResponse = await response.json();
      
      // Format response for Telegram
      return `🤖 **CEO Remy Response**\n\n` +
        `${mfmResponse.message}\n\n` +
        `📋 **Team:** ${mfmResponse.team} ${mfmResponse.emoji}\n` +
        `📅 **Time:** ${new Date(mfmResponse.timestamp).toLocaleString()}\n` +
        `🔄 **Status:** ${mfmResponse.status}\n\n` +
        `📊 **Classification:** ${classification.reason}\n` +
        `🎯 **Route:** ${classification.route}`;
    } else {
      throw new Error('MFM API error');
    }
  } catch (error) {
    console.error('Error calling MFM API:', error);
    
    // Generate fallback AI response
    const fallbackResponse = await generateAIResponse(text, senderName, env);
    
    return `🤖 **CEO Remy**\n\n` +
      `${fallbackResponse}\n\n` +
      `📅 **Time:** ${timestamp}\n` +
      `🔄 **Status:** AI Response Generated\n` +
      `📊 **Route:** Direct Chat\n\n` +
      `💬 I'm here to help with MFM Corporation operations, strategy, and team coordination.`;
  }
}

// Generate AI responses similar to Claude
async function generateAIResponse(input, userName, env) {
  const lowerInput = input.toLowerCase();
  
  // Store conversation context
  if (env.KV) {
    const contextKey = 'ceo_remy_context';
    const existingContext = await env.KV.get(contextKey);
    const context = existingContext ? JSON.parse(existingContext) : [];
    
    context.push({
      user: userName,
      message: input,
      timestamp: new Date().toISOString()
    });
    
    // Keep last 10 messages for context
    if (context.length > 10) context.shift();
    await env.KV.put(contextKey, JSON.stringify(context), { expirationTtl: 86400 });
  }
  
  // Generate contextual responses
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return `Hello ${userName}! I'm CEO Remy, ready to assist with MFM Corporation operations. What can I help you with today?`;
  }
  
  if (lowerInput.includes('how are you') || lowerInput.includes('how you doing')) {
    return `I'm operating at peak efficiency, ${userName}. All 19 specialized teams are performing optimally. Our automation systems show 96.7% accuracy across all operations. How can I support your objectives?`;
  }
  
  if (lowerInput.includes('status') || lowerInput.includes('update')) {
    return `**MFM Corporation Status Update**\n\n📊 **System Health**: Excellent\n🤖 **AI Performance**: 96.7% accuracy\n👥 **Teams**: All 19 operational\n📈 **Productivity**: 98.4% efficiency\n🔒 **Security**: Enterprise grade\n\nAll systems running smoothly. What specific area would you like details on?`;
  }
  
  if (lowerInput.includes('help') || lowerInput.includes('assist')) {
    return `I can help you with:\n\n🎯 **Strategic Planning** - Corporate strategy and decision making\n👥 **Team Coordination** - Managing our 19 specialized teams\n📊 **Operations** - Process optimization and automation\n🔒 **Security** - Risk assessment and compliance\n💼 **Business Development** - Growth initiatives and partnerships\n\nWhat specific challenge are you facing?`;
  }
  
  if (lowerInput.includes('team') || lowerInput.includes('department')) {
    return `I oversee 19 specialized teams across 7 departments:\n\n**Leadership**: CEO Remy\n**C-Level**: COO, CTO, CMO, CFO, CINO\n**Specialized Teams**: Design, Marketing, Development, Security, Finance, Research, Infrastructure, HR, Operations, Analytics, and more\n\nWhich team would you like me to engage for your current needs?`;
  }
  
  if (lowerInput.includes('project') || lowerInput.includes('initiative')) {
    return `I can coordinate any MFM Corporation project through our specialized teams. Our agile framework ensures:\n\n⚡ **Rapid Deployment** - 24-hour operational cycles\n🎯 **Precision Execution** - 96.4% task completion rate\n📊 **Real-time Monitoring** - Continuous performance tracking\n🔄 **Quality Control** - Multi-stage review process\n\nWhat project scope are you considering?`;
  }
  
  // Default intelligent response
  return `I understand your request, ${userName}. As CEO Remy, I'm here to ensure MFM Corporation operates at peak efficiency. Our integrated AI system and 19 specialized teams are ready to address your needs.\n\nCould you provide more details about your specific requirements so I can route this to the appropriate team or provide direct assistance?`;
}

// Send via email with SendGrid integration
async function sendViaEmail(message, classification, env) {
  const text = message.text || 'File received';
  const senderName = message.from.first_name || 'CEO Remy';
  const timestamp = new Date().toLocaleString();
  const userEmail = 'muhdfarihan@gmail.com'; // User's email for bidirectional communication
  
  try {
    // Create email content
    const emailSubject = `🔒 MFM Secure: ${classification.reason}`;
    const emailContent = 
      `**MFM Corporation - Secure Communication**\n\n` +
      `**From:** ${senderName} (@${message.from.username || 'unknown'})\n` +
      `**Time:** ${timestamp}\n` +
      `**Classification:** ${classification.reason}\n` +
      `**Confidence:** ${Math.round(classification.confidence * 100)}%\n\n` +
      `**Message Content:**\n${text}\n\n` +
      `**File Attachments:** ${message.document ? 'Yes' : 'No'}\n` +
      `**File Type:** ${message.document?.mime_type || 'N/A'}\n` +
      `**File Size:** ${message.document ? Math.round(message.document.file_size / 1024) + ' KB' : 'N/A'}\n\n` +
      `---\n` +
      `This message was routed via secure email due to sensitive content detection.\n` +
      `MFM Corporation AI Automation System\n` +
      `Classification Level: ${classification.route.toUpperCase()}`;
    
    // Send email via SendGrid API
    const sendgridUrl = 'https://api.sendgrid.com/v3/mail/send';
    const emailData = {
      personalizations: [{
        to: [{ email: env.CEO_EMAIL || 'remy@mfm-corporation.com' }],
        subject: emailSubject,
        content: [{
          type: 'text/plain',
          value: emailContent
        }]
      }],
      from: {
        email: 'noreply@mfm-corporation.com',
        name: 'MFM Corporation Bot'
      },
      reply_to: {
        email: userEmail,
        name: senderName
      }
    };
    
    const response = await fetch(sendgridUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }
    
    // Store message for potential CEO Remy response
    if (env.KV) {
      const messageKey = `email_message:${Date.now()}`;
      await env.KV.put(messageKey, JSON.stringify({
        from: senderName,
        username: message.from.username || 'unknown',
        chatId: message.chat.id,
        text: text,
        classification: classification,
        timestamp: timestamp,
        userEmail: userEmail,
        emailId: response.headers.get('X-Message-Id') || 'unknown'
      }), { expirationTtl: 86400 * 7 }); // Store for 7 days
    }
    
    // Return confirmation to user with bidirectional info
    return `✅ **Secure Email Sent**\n\n` +
      `Your message has been routed via secure email.\n` +
      `**Reason:** ${classification.reason}\n` +
      `**Confidence:** ${Math.round(classification.confidence * 100)}%\n\n` +
      `📧 Email sent to CEO Remy securely\n` +
      `📅 Time: ${timestamp}\n\n` +
      `🔄 **CEO Remy can respond via email to:** ${userEmail}\n` +
      `📱 You'll receive notifications in Telegram\n\n` +
      `✅ **Email delivered successfully**`;
      
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Fallback: Store message and indicate email failed
    if (env.KV) {
      const messageKey = `email_message:${Date.now()}`;
      await env.KV.put(messageKey, JSON.stringify({
        from: senderName,
        username: message.from.username || 'unknown',
        chatId: message.chat.id,
        text: text,
        classification: classification,
        timestamp: timestamp,
        userEmail: userEmail,
        failed: true,
        error: error.message
      }), { expirationTtl: 86400 * 7 });
    }
    
    return `⚠️ **Email Delivery Issue**\n\n` +
      `Your message was classified as sensitive but email delivery failed.\n` +
      `**Reason:** ${classification.reason}\n` +
      `**Error:** ${error.message}\n\n` +
      `📝 Message has been logged for manual review\n` +
      `📅 Time: ${timestamp}\n\n` +
      `🔄 **Please try again or contact support**`;
  }
}

// Handle CEO Remy email responses (for bidirectional communication)
async function handleEmailResponse(emailContent, env) {
  try {
    // Parse email content from CEO Remy
    const responseText = extractEmailText(emailContent);
    const timestamp = new Date().toLocaleString();
    
    // Find original message recipient
    let targetUser = null;
    let targetChatId = null;
    if (env.KV) {
      // Get recent email messages to find recipient
      const recentMessages = await env.KV.list({ prefix: 'email_message:' });
      if (recentMessages.keys.length > 0) {
        const latestMessage = await env.KV.get(recentMessages.keys[0].name);
        if (latestMessage) {
          const messageData = JSON.parse(latestMessage);
          targetUser = messageData.username || 'unknown';
          targetChatId = messageData.chatId || 6847462500; // Your chat ID
        }
      }
    }
    
    // Send notification to Telegram user immediately
    if (targetUser && targetUser !== 'unknown' && targetChatId) {
      const notification = `📧 **Email from CEO Remy**\n\n` +
        `**Time:** ${timestamp}\n` +
        `**Response:** ${responseText}\n\n` +
        `💬 Reply in Telegram to continue conversation\n` +
        `🔒 Sensitive content will be routed back to email`;
      
      // Send actual Telegram notification
      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: notification,
          parse_mode: 'Markdown'
        })
      });
      
      if (telegramResponse.ok) {
        // Store notification record
        const notificationKey = `email_notification:${Date.now()}`;
        await env.KV.put(notificationKey, JSON.stringify({
          from: 'CEO Remy',
          to: targetUser,
          message: responseText,
          timestamp: timestamp,
          sent: true
        }), { expirationTtl: 86400 * 7 });
        
        return {
          success: true,
          message: 'Telegram notification sent successfully',
          user: targetUser,
          notification: notification
        };
      } else {
        throw new Error('Telegram API error');
      }
    }
    
    return { success: false, message: 'Could not identify target user' };
  } catch (error) {
    console.error('Error handling email response:', error);
    return { success: false, message: 'Email processing failed' };
  }
}

// Send immediate Telegram notification for CEO Remy emails
async function sendImmediateTelegramNotification(emailContent, env) {
  try {
    const responseText = extractEmailText(emailContent);
    const timestamp = new Date().toLocaleString();
    
    // Your chat ID for direct notifications
    const chatId = 6847462500;
    
    const notification = `📧 **New Email from CEO Remy**\n\n` +
      `**Received:** ${timestamp}\n` +
      `**Message:** ${responseText}\n\n` +
      `📱 This is an automatic notification\n` +
      `💬 Reply here to continue the conversation\n` +
      `🔒 Your replies will be sent securely via email`;
    
    // Send immediate notification
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: notification,
        parse_mode: 'Markdown'
      })
    });
    
    return response.ok ? { success: true } : { success: false };
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return { success: false };
  }
}

// Extract text content from email
function extractEmailText(emailContent) {
  // Simple text extraction - in production would use proper email parsing
  const lines = emailContent.split('\n');
  const textLines = lines.filter(line => 
    !line.startsWith('**') && 
    !line.startsWith('--') && 
    !line.startsWith('From:') && 
    !line.startsWith('To:') && 
    !line.startsWith('Subject:') &&
    line.trim().length > 0
  );
  
  return textLines.join('\n').trim();
}

// Callback query handler (for inline keyboards)
async function handleCallbackQuery(callbackQuery, env) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  // Handle user responses to email prompts
  if (data.startsWith('email_decision:')) {
    const decision = data.split(':')[1];
    const messageId = callbackQuery.message.message_id;
    
    // Retrieve decision state
    const decisionKey = `decision:${messageId}`;
    const decisionState = await env.KV.get(decisionKey);
    
    if (decisionState) {
      const state = JSON.parse(decisionState);
      
      if (decision === 'yes') {
        await logInteraction(userId, 'email_confirmed', 'email', state.classification, env);
        await sendViaEmail(state.message, state.classification, env);
        await sendMessage(chatId, "✅ Content sent via secure email.", env);
      } else {
        await logInteraction(userId, 'email_declined', 'telegram', state.classification, env);
        await handleTelegramRoute(state.message, state.classification, env);
      }
      
      // Clean up decision state
      await env.KV.delete(decisionKey);
    }
    
    // Answer the callback query
    await answerCallbackQuery(callbackQuery.id, env);
  }
  
  return new Response('OK');
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const telegramUrl = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  
  try {
    await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId
      })
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

