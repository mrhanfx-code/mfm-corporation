// MFM Corporation Inbound Email Webhook
// Handles CEO Remy email replies and routes to Telegram

import { SecurityManager } from '../core/security.js';
import { MemoryManager } from '../ai/memory-manager.js';

export class InboundEmailWebhook {
  constructor(env) {
    this.env = env;
    this.securityManager = new SecurityManager(env);
    this.memoryManager = new MemoryManager(env);
  }

  async handleInboundEmail(request) {
    try {
      // Validate request
      const validation = await this.securityManager.validateRequest(request);
      if (!validation.isValid) {
        await this.securityManager.logSecurityEvent('invalid_email_request', 'unknown', validation.errors);
        return new Response('Invalid request', { status: 400 });
      }

      // Verify SendGrid webhook signature
      const signature = request.headers.get('X-Twilio-Signature') || request.headers.get('X-SendGrid-Signature');
      if (!signature || !await this.verifyWebhookSignature(request, signature)) {
        await this.securityManager.logSecurityEvent('invalid_email_webhook', 'unknown', { signature });
        return new Response('Unauthorized', { status: 401 });
      }

      // Parse email data
      const emailData = await request.json();
      const processedEmail = await this.processEmailData(emailData);

      // Store email for audit
      await this.storeEmailAudit(processedEmail);

      // Route to appropriate handler
      if (processedEmail.isFromCEO) {
        return await this.handleCEOEmail(processedEmail);
      } else {
        return await this.handleOtherEmail(processedEmail);
      }

    } catch (error) {
      console.error('Error processing inbound email:', error);
      await this.securityManager.logSecurityEvent('email_processing_error', 'unknown', { error: error.message });
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async verifyWebhookSignature(request, signature) {
    // In production, implement proper webhook signature verification
    // For now, we'll use a simple validation
    const webhookSecret = this.env.WEBHOOK_SECRET;
    return signature && webhookSecret;
  }

  async processEmailData(emailData) {
    const processed = {
      id: this.extractEmailId(emailData),
      from: this.extractSender(emailData),
      to: this.extractRecipients(emailData),
      subject: this.extractSubject(emailData),
      text: this.extractTextContent(emailData),
      html: this.extractHtmlContent(emailData),
      timestamp: this.extractTimestamp(emailData),
      attachments: this.extractAttachments(emailData),
      headers: this.extractHeaders(emailData),
      isFromCEO: false,
      isReply: false,
      originalMessageId: null,
      threadId: null
    };

    // Determine if this is from CEO Remy
    processed.isFromCEO = this.isFromCEO(processed.from);
    
    // Check if this is a reply to a previous message
    if (processed.headers['in-reply-to'] || processed.headers.references) {
      processed.isReply = true;
      processed.originalMessageId = processed.headers['in-reply-to'];
      processed.threadId = this.extractThreadId(processed.headers);
    }

    // Extract email text content
    processed.cleanText = this.cleanEmailText(processed.text);
    processed.extractedText = this.extractEmailText(processed);

    return processed;
  }

  extractEmailId(emailData) {
    return emailData.id || emailData.messageId || `email_${Date.now()}`;
  }

  extractSender(emailData) {
    if (emailData.from) {
      return {
        email: emailData.from.email || emailData.from,
        name: emailData.from.name || emailData.from.split('@')[0]
      };
    }
    return { email: 'unknown', name: 'Unknown' };
  }

  extractRecipients(emailData) {
    const recipients = [];
    
    if (emailData.to) {
      if (Array.isArray(emailData.to)) {
        recipients.push(...emailData.to.map(to => ({
          email: to.email || to,
          name: to.name || to.split('@')[0]
        })));
      } else {
        recipients.push({
          email: emailData.to.email || emailData.to,
          name: emailData.to.name || emailData.to.split('@')[0]
        });
      }
    }

    return recipients;
  }

  extractSubject(emailData) {
    return emailData.subject || 'No Subject';
  }

  extractTextContent(emailData) {
    return emailData.text || emailData.content?.[0]?.value || '';
  }

  extractHtmlContent(emailData) {
    return emailData.html || emailData.content?.[1]?.value || '';
  }

  extractTimestamp(emailData) {
    return emailData.timestamp || emailData.date || new Date().toISOString();
  }

  extractAttachments(emailData) {
    const attachments = [];
    
    if (emailData.attachments) {
      for (const attachment of emailData.attachments) {
        attachments.push({
          filename: attachment.filename || attachment.name,
          contentType: attachment.contentType || attachment.type,
          size: attachment.size || attachment.content?.length || 0,
          contentId: attachment.contentId,
          disposition: attachment.contentDisposition || 'attachment'
        });
      }
    }

    return attachments;
  }

  extractHeaders(emailData) {
    return emailData.headers || {};
  }

  isFromCEO(sender) {
    const ceoEmail = this.env.CEO_EMAIL || 'remy@mfm-corporation.com';
    return sender.email.toLowerCase() === ceoEmail.toLowerCase();
  }

  extractThreadId(headers) {
    // Try to extract thread ID from various headers
    return headers['thread-id'] || 
           headers['message-id'] || 
           headers['references']?.split(' ')[0] ||
           headers['in-reply-to'];
  }

  cleanEmailText(text) {
    if (!text) return '';
    
    return text
      // Remove email signatures
      .split('--')[0]
      // Remove quoted text
      .split('> On')[0]
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractEmailText(processedEmail) {
    // Priority: clean text > HTML text > original text
    let text = processedEmail.cleanText;
    
    if (!text && processedEmail.html) {
      // Simple HTML to text conversion
      text = processedEmail.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (!text) {
      text = processedEmail.text;
    }
    
    return text || '';
  }

  async storeEmailAudit(processedEmail) {
    const auditEntry = {
      emailId: processedEmail.id,
      from: processedEmail.from,
      to: processedEmail.to,
      subject: processedEmail.subject,
      timestamp: processedEmail.timestamp,
      isFromCEO: processedEmail.isFromCEO,
      isReply: processedEmail.isReply,
      threadId: processedEmail.threadId,
      hasAttachments: processedEmail.attachments.length > 0,
      processedAt: new Date().toISOString()
    };

    const auditKey = `email_audit:${processedEmail.id}`;
    await this.env.KV.put(auditKey, JSON.stringify(auditEntry), {
      expirationTtl: 86400 * 90 // 90 days
    });

    // Also store in email logs
    await this.env.KV.put(`email_log:${Date.now()}`, JSON.stringify(auditEntry), {
      expirationTtl: 86400 * 30 // 30 days
    });
  }

  async handleCEOEmail(processedEmail) {
    console.log(`Processing CEO email: ${processedEmail.subject}`);

    try {
      // Find the original Telegram user this reply is for
      const targetUser = await this.findOriginalTelegramUser(processedEmail);
      
      if (targetUser && targetUser.chatId) {
        // Send notification to Telegram user
        await this.sendTelegramNotification(targetUser.chatId, processedEmail);
        
        // Store the email response in memory
        await this.storeEmailResponse(processedEmail, targetUser);
        
        // Update conversation context
        await this.updateConversationContext(processedEmail, targetUser);
        
        await this.securityManager.logSecurityEvent('ceo_email_processed', targetUser.userId, {
          emailId: processedEmail.id,
          subject: processedEmail.subject
        });
        
        return new Response('CEO email processed successfully', { status: 200 });
      } else {
        // No matching Telegram user found
        await this.securityManager.logSecurityEvent('ceo_email_no_match', 'unknown', {
          emailId: processedEmail.id,
          threadId: processedEmail.threadId
        });
        
        return new Response('No matching Telegram user found', { status: 404 });
      }
    } catch (error) {
      console.error('Error handling CEO email:', error);
      await this.securityManager.logSecurityEvent('ceo_email_error', 'unknown', {
        emailId: processedEmail.id,
        error: error.message
      });
      
      return new Response('Error processing CEO email', { status: 500 });
    }
  }

  async findOriginalTelegramUser(processedEmail) {
    // Try to find the original user by thread ID
    if (processedEmail.threadId) {
      const threadKey = `email_thread:${processedEmail.threadId}`;
      const threadData = await this.env.KV.get(threadKey);
      
      if (threadData) {
        const thread = JSON.parse(threadData);
        return {
          userId: thread.userId,
          chatId: thread.chatId,
          originalMessageId: thread.originalMessageId
        };
      }
    }

    // Try to find by original message ID
    if (processedEmail.originalMessageId) {
      const messageKey = `email_message:${processedEmail.originalMessageId}`;
      const messageData = await this.env.KV.get(messageKey);
      
      if (messageData) {
        const message = JSON.parse(messageData);
        return {
          userId: message.userId,
          chatId: message.chatId,
          originalMessageId: message.messageId
        };
      }
    }

    // Try to find by recent CEO emails
    const recentEmails = await this.findRecentCEOEmails();
    for (const email of recentEmails) {
      if (email.threadId === processedEmail.threadId) {
        return {
          userId: email.userId,
          chatId: email.chatId,
          originalMessageId: email.originalMessageId
        };
      }
    }

    return null;
  }

  async findRecentCEOEmails() {
    const list = await this.env.KV.list({ prefix: 'ceo_email_sent:' });
    const emails = [];
    
    for (const key of list.keys.slice(-10)) { // Last 10 emails
      const data = await this.env.KV.get(key.name);
      if (data) {
        emails.push(JSON.parse(data));
      }
    }
    
    return emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async sendTelegramNotification(chatId, processedEmail) {
    const notification = this.formatTelegramNotification(processedEmail);
    
    const telegramUrl = `https://api.telegram.org/bot${this.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text: notification,
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    };

    // Add inline keyboard for quick actions
    if (processedEmail.attachments.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            { text: '📎 View Attachments', callback_data: `view_attachments:${processedEmail.id}` },
            { text: '💬 Reply', callback_data: `reply_email:${processedEmail.id}` }
          ],
          [
            { text: '📋 Save to Notes', callback_data: `save_email:${processedEmail.id}` }
          ]
        ]
      };
    } else {
      payload.reply_markup = {
        inline_keyboard: [
          [
            { text: '💬 Reply', callback_data: `reply_email:${processedEmail.id}` },
            { text: '📋 Save to Notes', callback_data: `save_email:${processedEmail.id}` }
          ]
        ]
      };
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    return response;
  }

  formatTelegramNotification(processedEmail) {
    const timestamp = new Date(processedEmail.timestamp).toLocaleString();
    const emailText = processedEmail.extractedText;
    const truncatedText = emailText.length > 300 ? emailText.substring(0, 300) + '...' : emailText;
    
    let notification = `📧 **New Email from CEO Remy**\n\n`;
    notification += `**Subject:** ${processedEmail.subject}\n`;
    notification += `**Time:** ${timestamp}\n\n`;
    
    if (truncatedText) {
      notification += `**Message:**\n${truncatedText}\n\n`;
    }
    
    if (processedEmail.attachments.length > 0) {
      notification += `📎 **Attachments:** ${processedEmail.attachments.length} file(s)\n`;
      notification += processedEmail.attachments.map(att => `• ${att.filename}`).join('\n') + '\n\n';
    }
    
    notification += `💬 *Reply directly here to continue the conversation*\n`;
    notification += `🔒 *Your replies will be sent securely via email*`;
    
    return notification;
  }

  async storeEmailResponse(processedEmail, targetUser) {
    const emailResponse = {
      id: processedEmail.id,
      from: processedEmail.from,
      subject: processedEmail.subject,
      text: processedEmail.extractedText,
      timestamp: processedEmail.timestamp,
      attachments: processedEmail.attachments,
      userId: targetUser.userId,
      chatId: targetUser.chatId,
      originalMessageId: targetUser.originalMessageId,
      threadId: processedEmail.threadId,
      processedAt: new Date().toISOString()
    };

    const responseKey = `email_response:${processedEmail.id}`;
    await this.env.KV.put(responseKey, JSON.stringify(emailResponse), {
      expirationTtl: 86400 * 30 // 30 days
    });

    // Also store in user's email history
    const userHistoryKey = `user_email_history:${targetUser.userId}`;
    const existingHistory = await this.env.KV.get(userHistoryKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    
    history.unshift(emailResponse);
    
    // Keep last 50 emails
    if (history.length > 50) {
      history.splice(50);
    }
    
    await this.env.KV.put(userHistoryKey, JSON.stringify(history), {
      expirationTtl: 86400 * 90 // 90 days
    });
  }

  async updateConversationContext(processedEmail, targetUser) {
    // Store in memory manager for AI context
    await this.memoryManager.storeContext(targetUser.userId, {
      text: processedEmail.extractedText,
      subject: processedEmail.subject,
      isEmail: true,
      isFromCEO: true
    }, {
      text: `Email received from CEO Remy: ${processedEmail.subject}`,
      confidence: 0.9,
      suggestedActions: this.generateEmailActions(processedEmail)
    }, {
      intent: { intent: 'email_response', confidence: 0.9 },
      entities: this.extractEmailEntities(processedEmail),
      sentiment: { sentiment: 'neutral', confidence: 0.5 },
      urgency: this.assessEmailUrgency(processedEmail),
      emotionalTone: { tone: 'professional', confidence: 0.8 },
      conversationState: 'email_exchange',
      userMood: 'neutral',
      contextRelevance: 0.9,
      interactionType: 'email_response'
    });
  }

  extractEmailEntities(processedEmail) {
    const entities = {
      people: [processedEmail.from.name],
      dates: this.extractDatesFromEmail(processedEmail.extractedText),
      projects: this.extractProjectsFromEmail(processedEmail.extractedText),
      teams: this.extractTeamsFromEmail(processedEmail.extractedText),
      priorities: this.extractPrioritiesFromEmail(processedEmail.extractedText)
    };

    return entities;
  }

  extractDatesFromEmail(text) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b/gi
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) dates.push(...matches);
    }

    return [...new Set(dates)];
  }

  extractProjectsFromEmail(text) {
    const projectKeywords = ['project', 'initiative', 'program', 'campaign', 'launch'];
    const projects = [];
    
    for (const keyword of projectKeywords) {
      const regex = new RegExp(`\\b\\w+\\s+${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) projects.push(...matches);
    }
    
    return [...new Set(projects)];
  }

  extractTeamsFromEmail(text) {
    const teamKeywords = ['marketing', 'development', 'design', 'sales', 'finance', 'hr', 'operations'];
    const teams = [];
    
    for (const keyword of teamKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        teams.push(keyword);
      }
    }
    
    return [...new Set(teams)];
  }

  extractPrioritiesFromEmail(text) {
    const priorityKeywords = ['urgent', 'high priority', 'low priority', 'critical', 'important'];
    const priorities = [];
    
    for (const keyword of priorityKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        priorities.push(keyword);
      }
    }
    
    return [...new Set(priorities)];
  }

  assessEmailUrgency(processedEmail) {
    const text = processedEmail.extractedText.toLowerCase();
    const subject = processedEmail.subject.toLowerCase();
    
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline'];
    
    const urgencyScore = urgencyKeywords.filter(keyword => 
      text.includes(keyword) || subject.includes(keyword)
    ).length;
    
    return {
      urgency: urgencyScore >= 2 ? 'high' : urgencyScore >= 1 ? 'medium' : 'low',
      score: urgencyScore
    };
  }

  generateEmailActions(processedEmail) {
    const actions = ['Reply to email'];
    
    if (processedEmail.attachments.length > 0) {
      actions.push('Review attachments');
    }
    
    const urgency = this.assessEmailUrgency(processedEmail);
    if (urgency.urgency === 'high') {
      actions.unshift('Handle with priority');
    }
    
    if (this.extractDatesFromEmail(processedEmail.extractedText).length > 0) {
      actions.push('Check calendar for dates');
    }
    
    return actions;
  }

  async handleOtherEmail(processedEmail) {
    console.log(`Processing non-CEO email: ${processedEmail.subject}`);
    
    // Log non-CEO emails for monitoring
    await this.securityManager.logSecurityEvent('non_ceo_email_received', 'unknown', {
      from: processedEmail.from.email,
      subject: processedEmail.subject
    });
    
    // Could implement forwarding or other handling here
    return new Response('Non-CEO email processed', { status: 200 });
  }
}

// Main export for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const webhook = new InboundEmailWebhook(env);
    
    // Handle different HTTP methods
    if (request.method === 'POST') {
      return await webhook.handleInboundEmail(request);
    } else if (request.method === 'GET') {
      return new Response('Email webhook endpoint is active', {
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      return new Response('Method Not Allowed', { status: 405 });
    }
  }
};
