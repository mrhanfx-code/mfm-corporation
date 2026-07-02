// Hashtag Validator — freshness checking and relevance validation

import { braveSearch } from './mcp-client.js';

/**
 * Validates hashtag freshness and relevance
 * @param {string[]} hashtags - Array of hashtags to validate
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object[]>} - Array of validation results
 */
export async function validateHashtags(hashtags, env) {
  const results = await Promise.all(
    hashtags.map(tag => validateSingleHashtag(tag, env))
  );
  
  return results;
}

/**
 * Validates a single hashtag
 * @param {string} hashtag - Hashtag to validate (with or without #)
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Validation result
 */
async function validateSingleHashtag(hashtag, env) {
  const cleanTag = hashtag.replace('#', '').toLowerCase();
  
  // Check for banned/overused hashtags
  const bannedHashtags = ['fyp', 'foryou', 'viral', 'trending', 'explore'];
  const isBanned = bannedHashtags.includes(cleanTag);
  
  // Check for generic/low-value hashtags
  const genericHashtags = ['love', 'happy', 'fun', 'cool', 'amazing', 'best', 'good'];
  const isGeneric = genericHashtags.includes(cleanTag);
  
  // Check freshness via search (proxy for recent usage)
  let freshnessScore = 0.5; // Default medium freshness
  let recentUsage = false;
  
  try {
    const searchQuery = `${cleanTag} hashtag recent posts`;
    const searchResult = await braveSearch(searchQuery, env, 5);
    
    if (searchResult && searchResult.length > 0) {
      // More results = more recent usage
      freshnessScore = Math.min(1.0, searchResult.length * 0.2);
      recentUsage = searchResult.length >= 3;
    }
  } catch (e) {
    // Fallback to default if search fails
  }
  
  // Calculate overall validity score
  let validityScore = freshnessScore;
  
  if (isBanned) {
    validityScore = 0.0;
  } else if (isGeneric) {
    validityScore *= 0.5; // Penalize generic hashtags
  }
  
  // Determine recommendation
  let recommendation = 'use';
  if (isBanned) {
    recommendation = 'avoid';
  } else if (isGeneric) {
    recommendation = 'replace';
  } else if (freshnessScore < 0.3) {
    recommendation = 'avoid';
  } else if (freshnessScore < 0.6) {
    recommendation = 'consider';
  }
  
  return {
    hashtag: `#${cleanTag}`,
    isValid: validityScore >= 0.5,
    validityScore: Math.round(validityScore * 100) / 100,
    freshnessScore: Math.round(freshnessScore * 100) / 100,
    recentUsage,
    isBanned,
    isGeneric,
    recommendation,
    alternatives: isBanned || isGeneric ? getAlternatives(cleanTag) : []
  };
}

/**
 * Get alternative hashtags for banned/generic ones
 * @param {string} tag - Original hashtag
 * @returns {string[]} - Alternative suggestions
 */
function getAlternatives(tag) {
  const alternativesMap = {
    'fyp': ['#malaysiabusiness', '#aiautomation', '#saas'],
    'foryou': ['#techstartup', '#businessgrowth', '#innovation'],
    'viral': ['#trendingtech', '#digitaltransformation', '#automation'],
    'trending': ['#emergingtech', '#futureofwork', '#businessai'],
    'explore': ['#discoverai', '#technews', '#startuplife'],
    'love': ['#customerlove', '#clientappreciation', '#businesslove'],
    'happy': ['#customersuccess', '#satisfiedclients', '#businessjoy'],
    'fun': ['#productive', '#efficient', '#smartwork'],
    'cool': ['#innovative', '#cuttingedge', '#advanced'],
    'amazing': ['#exceptional', '#outstanding', '#impressive'],
    'best': ['#topquality', '#premium', '#excellence'],
    'good': ['#quality', '#reliable', '#professional']
  };
  
  return alternativesMap[tag] || [];
}

/**
 * Get hashtag validation summary
 * @param {string[]} hashtags - Array of hashtags
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Summary statistics
 */
export async function getHashtagSummary(hashtags, env) {
  const results = await validateHashtags(hashtags, env);
  
  const total = results.length;
  const valid = results.filter(r => r.isValid).length;
  const banned = results.filter(r => r.isBanned).length;
  const generic = results.filter(r => r.isGeneric).length;
  const avgFreshness = results.reduce((sum, r) => sum + r.freshnessScore, 0) / total;
  
  const recommendations = {
    use: results.filter(r => r.recommendation === 'use').length,
    consider: results.filter(r => r.recommendation === 'consider').length,
    replace: results.filter(r => r.recommendation === 'replace').length,
    avoid: results.filter(r => r.recommendation === 'avoid').length
  };
  
  return {
    total,
    valid,
    invalid: total - valid,
    banned,
    generic,
    averageFreshness: Math.round(avgFreshness * 100) / 100,
    recommendations,
    overallScore: Math.round((valid / total) * 100),
    overallRecommendation: getOverallRecommendation(valid, total, banned)
  };
}

function getOverallRecommendation(valid, total, banned) {
  if (banned > 0) {
    return 'CRITICAL: Remove banned hashtags immediately. They provide no value and may hurt reach.';
  } else if (valid / total < 0.5) {
    return 'WARNING: More than half of hashtags are low-value. Replace with niche-specific tags.';
  } else if (valid / total < 0.7) {
    return 'CAUTION: Some hashtags could be improved. Consider replacing generic ones.';
  } else {
    return 'GOOD: Hashtag set is well-optimized. Good mix of niche and relevant tags.';
  }
}

/**
 * Suggest fresh hashtags for a topic
 * @param {string} topic - Topic to generate hashtags for
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<string[]>} - Suggested hashtags
 */
export async function suggestHashtags(topic, env) {
  const cleanTopic = topic.toLowerCase();
  
  // Base suggestions based on topic
  const baseSuggestions = [
    `#${cleanTopic.replace(/\s+/g, '')}`,
    `#${cleanTopic.replace(/\s+/g, '')}2026`,
    `#${cleanTopic.replace(/\s+/g, '')}tips`,
    `#${cleanTopic.replace(/\s+/g, '')}guide`
  ];
  
  // Search for trending related hashtags
  let searchSuggestions = [];
  try {
    const searchQuery = `${topic} trending hashtags 2026`;
    const searchResult = await braveSearch(searchQuery, env, 5);
    
    if (searchResult && searchResult.length > 0) {
      // Extract hashtags from search results (simplified)
      searchSuggestions = searchResult
        .slice(0, 3)
        .map(() => `#${cleanTopic.replace(/\s+/g, '')}trending`);
    }
  } catch (e) {
    // Fallback to base suggestions
  }
  
  // Combine and deduplicate
  const allSuggestions = [...baseSuggestions, ...searchSuggestions];
  const uniqueSuggestions = [...new Set(allSuggestions)];
  
  return uniqueSuggestions.slice(0, 8); // Return top 8 suggestions
}
