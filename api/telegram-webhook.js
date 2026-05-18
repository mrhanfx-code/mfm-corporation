// MFM Corporation Telegram Bot - GitHub Pages Webhook Handler
// This handles Telegram webhook requests via GitHub Pages

// GitHub Pages doesn't support server-side processing, so we'll use GitHub Actions
// This file is for documentation and reference

export default async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'MFM Corporation Telegram Bot',
      webhook: '/api/telegram-webhook',
      method: 'POST required for webhook'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  if (request.method === 'POST') {
    try {
      const update = await request.json();
      
      // Log the update (for debugging)
      console.log('Telegram Update:', JSON.stringify(update, null, 2));
      
      // Process the update
      const response = await processTelegramUpdate(update);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}

async function processTelegramUpdate(update) {
  // This would contain the same logic as telegram-bot.js
  // For now, return a simple acknowledgment
  
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    
    // Check if user is authorized
    if (userId !== 6847462500) {
      return { status: 'unauthorized', message: 'User not authorized' };
    }
    
    // Simple response for testing
    return {
      status: 'success',
      message: 'Message received',
      userId: userId,
      chatId: chatId,
      text: message.text || 'No text'
    };
  }
  
  return { status: 'received', update: update };
}
