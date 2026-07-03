// Trend Scorer — quantitative velocity scoring for trends

import { perplexitySearch, braveSearch } from './mcp-client.js';

/**
 * Calculates trend velocity score based on multiple proxy metrics
 * @param {string} trend - The trend/topic to score
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Score object with velocity score and breakdown
 */
export async function scoreTrendVelocity(trend, env) {
  const lowerTrend = trend.toLowerCase();
  
  // Proxy metrics for trend velocity (no direct API access)
  const metrics = {
    searchVolume: 0,      // Normalized 0-100
    socialMentions: 0,     // Normalized 0-100
    recency: 0,            // 0-100 based on how recent the trend is
    relevance: 0           // 0-100 based on business relevance
  };
  
  // Search volume metric (use web search results count as proxy)
  try {
    const searchResult = await braveSearch(trend, env, 10);
    if (searchResult && searchResult.length > 0) {
      // More results = higher search volume
      metrics.searchVolume = Math.min(100, searchResult.length * 10);
    }
  } catch (e) {
    // Fallback if search fails
  }
  
  // Social mentions metric (use search for social platforms)
  try {
    const socialQuery = `${trend} tiktok instagram trending`;
    const socialResult = await braveSearch(socialQuery, env, 5);
    if (socialResult && socialResult.length > 0) {
      metrics.socialMentions = Math.min(100, socialResult.length * 20);
    }
  } catch (e) {
    // Fallback
  }
  
  // Recency metric (based on current year/month relevance)
  const currentYear = new Date().getFullYear();
  const yearKeywords = [String(currentYear), '2026', '2025', 'recent', 'new', 'latest', 'this month', 'this week'];
  const recencyScore = yearKeywords.filter(kw => lowerTrend.includes(kw)).length * 25;
  metrics.recency = Math.min(100, recencyScore);
  
  // Relevance metric (business relevance keywords)
  const relevanceKeywords = ['ai', 'automation', 'saas', 'startup', 'business', 'enterprise', 'marketing', 'sales', 'productivity', 'malaysia', 'sea'];
  const relevanceScore = relevanceKeywords.filter(kw => lowerTrend.includes(kw)).length * 20;
  metrics.relevance = Math.min(100, relevanceScore);
  
  // Calculate weighted velocity score
  const weights = {
    searchVolume: 0.3,
    socialMentions: 0.3,
    recency: 0.2,
    relevance: 0.2
  };
  
  const velocityScore = 
    (metrics.searchVolume * weights.searchVolume) +
    (metrics.socialMentions * weights.socialMentions) +
    (metrics.recency * weights.recency) +
    (metrics.relevance * weights.relevance);
  
  // Normalize to 0-100
  const normalizedScore = Math.round(velocityScore);
  
  // Determine velocity tier
  let tier = 'low';
  if (normalizedScore >= 70) tier = 'high';
  else if (normalizedScore >= 40) tier = 'medium';
  
  return {
    trend,
    velocityScore: normalizedScore,
    tier,
    breakdown: metrics,
    recommendation: getRecommendation(tier, normalizedScore)
  };
}

function getRecommendation(tier, score) {
  if (tier === 'high') {
    return 'ACT NOW: This trend has high velocity. Create content immediately to capture momentum.';
  } else if (tier === 'medium') {
    return 'MONITOR: This trend has moderate velocity. Consider creating content if it aligns with current campaigns.';
  } else {
    return 'SKIP: This trend has low velocity. Focus resources on higher-velocity trends.';
  }
}

/**
 * Batch score multiple trends
 * @param {string[]} trends - Array of trends to score
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object[]>} - Array of score objects
 */
export async function scoreTrendsBatch(trends, env) {
  const scores = await Promise.all(
    trends.map(trend => scoreTrendVelocity(trend, env))
  );
  
  // Sort by velocity score descending
  return scores.sort((a, b) => b.velocityScore - a.velocityScore);
}
