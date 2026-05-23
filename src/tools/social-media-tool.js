// Social Media Tool — Facebook, Instagram, TikTok posting via official APIs

const META_API   = 'https://graph.facebook.com/v21.0';
const TIKTOK_API = 'https://open.tiktokapis.com/v2';

async function getUnsplashImage(text) {
  const keywords = text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).slice(0, 3).join(',');
  return `https://source.unsplash.com/1080x1080/?${encodeURIComponent(keywords || 'business')}`;
}

export async function postToFacebook(text, env, imageUrl = null) {
  if (!env.META_PAGE_ACCESS_TOKEN) return '[facebook] Missing META_PAGE_ACCESS_TOKEN';
  if (!env.FACEBOOK_PAGE_ID)       return '[facebook] Missing FACEBOOK_PAGE_ID';

  try {
    let endpoint, body;
    if (imageUrl) {
      endpoint = `${META_API}/${env.FACEBOOK_PAGE_ID}/photos`;
      body = { url: imageUrl, message: text, access_token: env.META_PAGE_ACCESS_TOKEN };
    } else {
      endpoint = `${META_API}/${env.FACEBOOK_PAGE_ID}/feed`;
      body = { message: text, access_token: env.META_PAGE_ACCESS_TOKEN };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) return `[facebook] API error: ${data.error.message}`;
    return `[facebook] ✅ Posted. ID: ${data.post_id || data.id}`;
  } catch (err) {
    return `[facebook] Error: ${err.message}`;
  }
}

export async function postToInstagram(caption, env, imageUrl = null) {
  if (!env.META_PAGE_ACCESS_TOKEN) return '[instagram] Missing META_PAGE_ACCESS_TOKEN';
  if (!env.INSTAGRAM_ACCOUNT_ID)   return '[instagram] Missing INSTAGRAM_ACCOUNT_ID';

  try {
    const finalImage = imageUrl || await getUnsplashImage(caption);

    const containerRes = await fetch(`${META_API}/${env.INSTAGRAM_ACCOUNT_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: finalImage,
        caption,
        access_token: env.META_PAGE_ACCESS_TOKEN
      })
    });
    const container = await containerRes.json();
    if (container.error) return `[instagram] Container error: ${container.error.message}`;

    const publishRes = await fetch(`${META_API}/${env.INSTAGRAM_ACCOUNT_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: env.META_PAGE_ACCESS_TOKEN
      })
    });
    const published = await publishRes.json();
    if (published.error) return `[instagram] Publish error: ${published.error.message}`;
    return `[instagram] ✅ Posted. Media ID: ${published.id}`;
  } catch (err) {
    return `[instagram] Error: ${err.message}`;
  }
}

export async function postToTikTok(videoUrl, caption, env) {
  if (!env.TIKTOK_ACCESS_TOKEN) return '[tiktok] Missing TIKTOK_ACCESS_TOKEN';

  try {
    const res = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      })
    });
    const data = await res.json();
    if (data.error?.code && data.error.code !== 'ok') {
      return `[tiktok] API error: ${data.error.message || JSON.stringify(data.error)}`;
    }
    return `[tiktok] ✅ Video published. Publish ID: ${data.data?.publish_id}`;
  } catch (err) {
    return `[tiktok] Error: ${err.message}`;
  }
}

export async function postSocial(platform, args, env) {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return await postToFacebook(args.text || args.caption, env, args.imageUrl || null);
    case 'instagram':
      return await postToInstagram(args.caption || args.text, env, args.imageUrl || null);
    case 'tiktok':
      if (!args.videoUrl) return '[tiktok] videoUrl is required for TikTok posts';
      return await postToTikTok(args.videoUrl, args.caption || args.text, env);
    default:
      return `[social-post] Unknown platform: ${platform}. Use: facebook, instagram, or tiktok`;
  }
}
