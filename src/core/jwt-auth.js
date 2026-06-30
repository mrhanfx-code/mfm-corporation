// JWT Authentication Module for MFM Corporation
// Provides token generation, validation, and refresh functionality

import { logger } from './logger.js';

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a JWT access token
 */
export async function generateAccessToken(userId, env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Date.now();
  const payload = {
    userId,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + TOKEN_EXPIRY_MS) / 1000),
    type: 'access'
  };

  const token = await signJWT(header, payload, env.JWT_SECRET);
  
  // Store token in KV for blacklist capability
  if (env.KV) {
    const tokenKey = `jwt:${userId}:${token}`;
    await env.KV.put(tokenKey, 'active', { expirationTtl: TOKEN_EXPIRY_MS / 1000 });
  }

  logger.info('jwt-auth', 'access_token_generated', { userId });
  return token;
}

/**
 * Generate a JWT refresh token
 */
export async function generateRefreshToken(userId, env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Date.now();
  const payload = {
    userId,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + REFRESH_TOKEN_EXPIRY_MS) / 1000),
    type: 'refresh'
  };

  const token = await signJWT(header, payload, env.JWT_SECRET);
  
  // Store refresh token in KV
  if (env.KV) {
    const refreshKey = `refresh:${userId}:${token}`;
    await env.KV.put(refreshKey, 'active', { expirationTtl: REFRESH_TOKEN_EXPIRY_MS / 1000 });
  }

  logger.info('jwt-auth', 'refresh_token_generated', { userId });
  return token;
}

/**
 * Validate a JWT token
 */
export async function validateToken(token, env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    // Check if token is blacklisted
    if (env.KV && payload.userId) {
      const tokenKey = `jwt:${payload.userId}:${token}`;
      const status = await env.KV.get(tokenKey);
      if (status === 'blacklisted') {
        logger.warn('jwt-auth', 'token_blacklisted', { userId: payload.userId });
        return null;
      }
    }

    // Check token type
    if (payload.type !== 'access') {
      logger.warn('jwt-auth', 'invalid_token_type', { type: payload.type });
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      logger.warn('jwt-auth', 'token_expired', { userId: payload.userId });
      return null;
    }

    return payload;
  } catch (error) {
    logger.error('jwt-auth', 'validation_failed', { error: error.message });
    return null;
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken, env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const payload = await verifyJWT(refreshToken, env.JWT_SECRET);
    
    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      logger.warn('jwt-auth', 'invalid_refresh_token', { type: payload.type });
      return null;
    }

    // Check if refresh token is still active
    if (env.KV && payload.userId) {
      const refreshKey = `refresh:${payload.userId}:${refreshToken}`;
      const status = await env.KV.get(refreshKey);
      if (!status || status === 'revoked') {
        logger.warn('jwt-auth', 'refresh_token_revoked', { userId: payload.userId });
        return null;
      }
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken(payload.userId, env);
    
    logger.info('jwt-auth', 'token_refreshed', { userId: payload.userId });
    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken // Keep same refresh token
    };
  } catch (error) {
    logger.error('jwt-auth', 'refresh_failed', { error: error.message });
    return null;
  }
}

/**
 * Revoke a token (logout)
 */
export async function revokeToken(token, env) {
  if (!env.KV) {
    logger.warn('jwt-auth', 'kv_not_available', { action: 'revoke' });
    return false;
  }

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    if (payload.userId) {
      const tokenKey = `jwt:${payload.userId}:${token}`;
      await env.KV.put(tokenKey, 'blacklisted', { expirationTtl: TOKEN_EXPIRY_MS / 1000 });
      
      // Also revoke refresh token if it's a refresh token
      if (payload.type === 'refresh') {
        const refreshKey = `refresh:${payload.userId}:${token}`;
        await env.KV.put(refreshKey, 'revoked', { expirationTtl: REFRESH_TOKEN_EXPIRY_MS / 1000 });
      }
      
      logger.info('jwt-auth', 'token_revoked', { userId: payload.userId });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('jwt-auth', 'revoke_failed', { error: error.message });
    return false;
  }
}

/**
 * Simple JWT signing (HMAC-SHA256)
 * Note: In production, use a proper JWT library like jsonwebtoken
 */
async function signJWT(header, payload, secret) {
  const encoder = new TextEncoder();
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerEncoded}.${payloadEncoded}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  const signatureEncoded = base64UrlEncode(signature);
  return `${data}.${signatureEncoded}`;
}

/**
 * Simple JWT verification (HMAC-SHA256)
 * Note: In production, use a proper JWT library like jsonwebtoken
 */
async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  
  const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
  const data = `${headerEncoded}.${payloadEncoded}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signature = base64UrlDecode(signatureEncoded);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(data)
  );
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }
  
  const payload = JSON.parse(base64UrlDecode(payloadEncoded));
  return payload;
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data) {
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
