// Request signing with HMAC for internal API security
// Provides cryptographic verification of internal API calls

class RequestSigner {
  constructor(secretKey) {
    this.secretKey = secretKey;
    this.algorithm = 'SHA-256';
  }

  async sign(payload) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.secretKey),
        { name: 'HMAC', hash: this.algorithm },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, data);
      const signatureArray = new Uint8Array(signature);
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
      
      return {
        signature: signatureBase64,
        timestamp: Date.now(),
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('[RequestSigner] Failed to sign request:', error);
      throw new Error('Failed to sign request');
    }
  }

  async verify(payload, signature, timestamp, maxAge = 300000) {
    // Check timestamp freshness (default 5 minutes)
    const now = Date.now();
    if (now - timestamp > maxAge) {
      console.error('[RequestSigner] Signature expired');
      return false;
    }
    
    if (timestamp > now) {
      console.error('[RequestSigner] Signature from future');
      return false;
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.secretKey),
        { name: 'HMAC', hash: this.algorithm },
        false,
        ['verify']
      );
      
      const signatureArray = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureArray,
        data
      );
      
      return isValid;
    } catch (error) {
      console.error('[RequestSigner] Failed to verify signature:', error);
      return false;
    }
  }

  async signHeaders(headers, payload) {
    const signatureData = await this.sign(payload);
    
    return {
      ...headers,
      'X-Signature': signatureData.signature,
      'X-Signature-Timestamp': signatureData.timestamp.toString(),
      'X-Signature-Algorithm': signatureData.algorithm
    };
  }

  async verifyHeaders(headers, payload) {
    const signature = headers.get('X-Signature');
    const timestamp = headers.get('X-Signature-Timestamp');
    const algorithm = headers.get('X-Signature-Algorithm');
    
    if (!signature || !timestamp) {
      console.error('[RequestSigner] Missing signature headers');
      return false;
    }
    
    if (algorithm && algorithm !== this.algorithm) {
      console.error('[RequestSigner] Algorithm mismatch');
      return false;
    }
    
    return await this.verify(payload, signature, parseInt(timestamp));
  }
}

// Singleton instance
let signerInstance = null;

export function getRequestSigner(secretKey) {
  if (!signerInstance) {
    signerInstance = new RequestSigner(secretKey);
  }
  return signerInstance;
}

export function resetRequestSigner() {
  signerInstance = null;
}

// Middleware for request signing verification
export async function verifySignedRequest(request, env) {
  if (!env.REQUEST_SIGNING_SECRET) {
    console.warn('[RequestSigner] REQUEST_SIGNING_SECRET not configured, skipping verification');
    return true;
  }
  
  try {
    const body = await request.json();
    const signer = getRequestSigner(env.REQUEST_SIGNING_SECRET);
    
    const isValid = await signer.verifyHeaders(request.headers, body);
    
    if (!isValid) {
      console.error('[RequestSigner] Invalid signature for request');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[RequestSigner] Signature verification failed:', error);
    return false;
  }
}
