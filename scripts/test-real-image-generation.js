/**
 * Test Real Image Generation via Deployed Worker
 * Tests Cloudflare Workers AI image generation on deployed worker
 */

const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
const DASHBOARD_SECRET = 'mfm-dashboard-secret-2026-xyz';

async function testRealImageGeneration() {
  console.log('=== Testing Real Image Generation on Deployed Worker ===\n');
  
  const corporatePrompt = 'MFM Corporation headquarters - modern glass building with MFM logo, professional business setting, natural lighting, city skyline background';
  
  try {
    // Call the image generation endpoint
    const response = await fetch(`${WORKER_URL}/api/v1/dashboard/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHBOARD_SECRET}`
      },
      body: JSON.stringify({
        prompt: corporatePrompt,
        model: 'flux'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Image Generated Successfully!');
    console.log('--- Image Details ---');
    console.log(`Model: ${result.model}`);
    console.log(`File Key: ${result.key}`);
    console.log(`Content-Type: ${result.content_type}`);
    console.log(`Prompt: ${result.prompt}`);
    console.log('\n--- R2 Storage URL ---');
    console.log(`https://pub-{bucket-id}.r2.dev/${result.key}`);
    
    console.log('\n--- Success ---');
    console.log('Real AI image generation is working on deployed worker!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n--- Alternative Test ---');
    console.log('Testing dashboard status endpoint...');
    
    try {
      const statusResponse = await fetch(`${WORKER_URL}/api/v1/dashboard/status`, {
        headers: {
          'Authorization': `Bearer ${DASHBOARD_SECRET}`
        }
      });
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log('✅ Dashboard status endpoint working');
        console.log('System status:', status.system_status);
        console.log('Active agents:', status.active_agents);
      }
    } catch (statusError) {
      console.error('❌ Dashboard status also failed:', statusError.message);
    }
  }
}

testRealImageGeneration().catch(console.error);
