// Image generation tool — Cloudflare Workers AI (free tier: 10,000 neurons/day)
// Models: flux-1-schnell (fast, high quality), stable-diffusion-xl-base-1.0 (detailed)

const MODELS = {
  flux:  '@cf/black-forest-labs/flux-1-schnell',
  sdxl:  '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  sd15:  '@cf/runwayml/stable-diffusion-v1-5',
};

/**
 * Generate an image from a text prompt.
 * Returns { url, key, model } on success or { error } on failure.
 * The image is saved to R2 and served via the worker's /file/ route.
 */
export async function generateImage(prompt, env, options = {}) {
  if (!env.AI) return { error: 'Cloudflare AI binding not configured.' };
  if (!prompt?.trim()) return { error: 'No prompt provided.' };

  const model = MODELS[options.model] || MODELS.flux;
  const steps = options.steps || 4;

  let imageBytes;
  try {
    const response = await env.AI.run(model, {
      prompt: prompt.trim(),
      num_inference_steps: steps,
    });

    // Workers AI returns a ReadableStream or ArrayBuffer
    if (response instanceof ReadableStream) {
      const reader = response.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      imageBytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        imageBytes.set(chunk, offset);
        offset += chunk.length;
      }
    } else if (response?.image) {
      // Some models return base64
      const binary = atob(response.image);
      imageBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);
    } else {
      imageBytes = new Uint8Array(response);
    }
  } catch (err) {
    return { error: `Image generation failed: ${err.message}` };
  }

  // Save to R2 and return a shareable URL
  const bucket = env['mfm-corporation-uploads'];
  if (!bucket) {
    // Return base64 if no R2
    const b64 = btoa(String.fromCharCode(...imageBytes));
    return { base64: b64, model, prompt };
  }

  const imageId = crypto.randomUUID();
  const key = `images/${imageId}.png`;
  await bucket.put(key, imageBytes, { httpMetadata: { contentType: 'image/png' } });

  return { key, model, prompt, content_type: 'image/png' };
}

/**
 * Format a response message with image info for the CEO chat.
 */
export function formatImageResponse(result, workerHost) {
  if (result.error) return `⚠️ Image generation failed: ${result.error}`;
  const url = `https://${workerHost}/file/${result.key}`;
  return { text: `✅ Image generated successfully.\n\n**Prompt:** ${result.prompt}\n**Model:** ${result.model.split('/').pop()}\n**URL:** ${url}`, attachment: { url, name: 'generated-image.png', type: 'image/png' } };
}
