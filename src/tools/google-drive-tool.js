// Google Drive Tool — read/write files via Google Drive REST API
// Requires: GOOGLE_SERVICE_ACCOUNT_KEY (base64 JSON), GOOGLE_DRIVE_FOLDER_ID (target folder)

import { logger } from '../core/logger.js';

const DRIVE_API  = 'https://www.googleapis.com/drive/v3';
const DOCS_API   = 'https://docs.googleapis.com/v1';
const OAUTH_URL  = 'https://oauth2.googleapis.com/token';
const SCOPES     = 'https://www.googleapis.com/auth/drive';

// ─── JWT / OAuth2 helpers ──────────────────────────────────────────────────

function base64url(data) {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) return null;
  try {
    const sa = JSON.parse(atob(env.GOOGLE_SERVICE_ACCOUNT_KEY));
    const now = Math.floor(Date.now() / 1000);
    const header  = { alg: 'RS256', typ: 'JWT' };
    const payload = { iss: sa.client_email, scope: SCOPES, aud: OAUTH_URL, iat: now, exp: now + 3600 };
    const headerB64  = base64url(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
    const sigInput   = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      'pkcs8',
      _pemToDer(sa.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput));
    const jwt = `${sigInput}.${base64url(sig)}`;

    const res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    logger.error('google-drive', 'auth_failed', { error: err.message });
    return null;
  }
}

function _pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin = atob(b64);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der.buffer;
}

// ─── List files in a folder ───────────────────────────────────────────────

export async function listDriveFolder(env, folderId) {
  const token = await getAccessToken(env);
  if (!token) return null;
  const id = folderId || env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) return null;
  try {
    const res = await fetch(
      `${DRIVE_API}/files?q='${id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime+desc&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Drive list ${res.status}`);
    const data = await res.json();
    const files = (data.files || []).map(f => `${f.name} (${f.mimeType.split('.').pop()}) — ${f.id}`);
    logger.info('google-drive', 'list_ok', { count: files.length });
    return files.join('\n') || 'No files found';
  } catch (err) {
    logger.error('google-drive', 'list_failed', { error: err.message });
    return null;
  }
}

// ─── Read a file (text/docs) ──────────────────────────────────────────────

export async function readDriveFile(fileId, env) {
  const token = await getAccessToken(env);
  if (!token) return null;
  try {
    // Get metadata first
    const metaRes = await fetch(`${DRIVE_API}/files/${fileId}?fields=mimeType,name`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!metaRes.ok) throw new Error(`Meta ${metaRes.status}`);
    const { mimeType, name } = await metaRes.json();

    let content;
    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc as plain text
      const expRes = await fetch(`${DRIVE_API}/files/${fileId}/export?mimeType=text/plain`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!expRes.ok) throw new Error(`Export ${expRes.status}`);
      content = await expRes.text();
    } else {
      // Download raw file
      const dlRes = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!dlRes.ok) throw new Error(`Download ${dlRes.status}`);
      content = await dlRes.text();
    }
    logger.info('google-drive', 'read_ok', { fileId, name });
    return content.slice(0, 8000);
  } catch (err) {
    logger.error('google-drive', 'read_failed', { error: err.message });
    return null;
  }
}

// ─── Write / create a plain text file ─────────────────────────────────────

export async function writeDriveFile(fileName, content, env, folderId) {
  const token = await getAccessToken(env);
  if (!token) return null;
  const parentId = folderId || env.GOOGLE_DRIVE_FOLDER_ID;
  try {
    const metadata = { name: fileName, mimeType: 'text/plain', ...(parentId ? { parents: [parentId] } : {}) };
    const boundary = '-------mfm_boundary';
    const body = [
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}`,
      `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}`,
      `--${boundary}--`
    ].join('\r\n');
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body
    });
    if (!res.ok) throw new Error(`Write ${res.status}: ${await res.text()}`);
    const data = await res.json();
    logger.info('google-drive', 'write_ok', { fileId: data.id, fileName });
    return `File "${fileName}" saved to Drive (ID: ${data.id})`;
  } catch (err) {
    logger.error('google-drive', 'write_failed', { error: err.message });
    return null;
  }
}

// ─── Search Drive ──────────────────────────────────────────────────────────

export async function searchDriveFiles(query, env) {
  const token = await getAccessToken(env);
  if (!token) return null;
  try {
    const q = encodeURIComponent(`name contains '${query}' and trashed=false`);
    const res = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name,mimeType,modifiedTime)&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Search ${res.status}`);
    const data = await res.json();
    const files = (data.files || []).map(f => `${f.name} — ID: ${f.id} (modified: ${f.modifiedTime?.slice(0, 10)})`);
    return files.join('\n') || 'No matching files found';
  } catch (err) {
    logger.error('google-drive', 'search_failed', { error: err.message });
    return null;
  }
}
