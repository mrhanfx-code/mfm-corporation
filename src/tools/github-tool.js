// GitHub tool — create repos, push files, trigger Actions via GitHub REST API
// Requires GITHUB_TOKEN secret (Personal Access Token with repo scope)

const GITHUB_API = 'https://api.github.com';
const DEFAULT_OWNER = 'mrhanfx-code';

async function ghFetch(path, method = 'GET', body = null, token) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MFM-Corporation-Bot/2.0',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${GITHUB_API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Create a new GitHub repository.
 */
export async function createRepo(name, description, env, options = {}) {
  console.log(`[createRepo] Starting: name=${name}`);
  if (!env.GITHUB_TOKEN) {
    console.log('[createRepo] ERROR: GITHUB_TOKEN not configured');
    return { error: 'GITHUB_TOKEN not configured.' };
  }
  const { ok, data, status } = await ghFetch('/user/repos', 'POST', {
    name,
    description: description || `Created by MFM Corporation AI`,
    private: options.private ?? true,
    auto_init: true,
    gitignore_template: options.gitignore || null,
  }, env.GITHUB_TOKEN);
  console.log(`[createRepo] GitHub API response: ok=${ok}, status=${status}, data=`, JSON.stringify(data));
  if (!ok) {
    console.log(`[createRepo] ERROR: Failed to create repo - ${data.message || 'Unknown error'}`);
    return { error: data.message || 'Failed to create repo.' };
  }
  console.log(`[createRepo] SUCCESS: ${data.html_url}`);
  return { url: data.html_url, clone_url: data.clone_url, name: data.full_name };
}

/**
 * Create or update a file in a GitHub repository.
 * content: plain text string (will be base64 encoded)
 */
export async function pushFile(repo, filePath, content, commitMessage, env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const owner = options.owner || DEFAULT_OWNER;
  const branch = options.branch || 'main';

  // Check if file already exists (need its SHA to update)
  let sha = null;
  const existing = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, 'GET', null, env.GITHUB_TOKEN);
  if (existing.ok && existing.data.sha) sha = existing.data.sha;

  const encoded = btoa(unescape(encodeURIComponent(content)));
  const body = {
    message: commitMessage || `feat: add ${filePath}`,
    content: encoded,
    branch,
  };
  if (sha) body.sha = sha;

  const { ok, data } = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`, 'PUT', body, env.GITHUB_TOKEN);
  if (!ok) return { error: data.message || 'Failed to push file.' };
  return { url: data.content?.html_url, commit: data.commit?.sha, path: filePath };
}

/**
 * Push multiple files to a repo in one operation (sequential commits).
 * files: [{ path, content, message }]
 */
export async function pushMultipleFiles(repo, files, env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const results = [];
  for (const file of files) {
    const result = await pushFile(repo, file.path, file.content, file.message, env, options);
    results.push({ path: file.path, ...result });
  }
  const failed = results.filter(r => r.error);
  return { results, success: results.length - failed.length, failed: failed.length };
}

/**
 * List files in a repo directory.
 */
export async function listRepoFiles(repo, path = '', env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const owner = options.owner || DEFAULT_OWNER;
  const { ok, data } = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`, 'GET', null, env.GITHUB_TOKEN);
  if (!ok) return { error: data.message || 'Failed to list files.' };
  return { files: Array.isArray(data) ? data.map(f => ({ name: f.name, type: f.type, path: f.path, url: f.html_url })) : [] };
}

/**
 * Get file content from a repo.
 */
export async function getFileContent(repo, filePath, env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const owner = options.owner || DEFAULT_OWNER;
  const { ok, data } = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`, 'GET', null, env.GITHUB_TOKEN);
  if (!ok) return { error: data.message || 'File not found.' };
  if (!data.content) return { error: 'No content.' };
  const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return { content: decoded, sha: data.sha, url: data.html_url };
}

/**
 * Trigger a GitHub Actions workflow dispatch.
 */
export async function triggerWorkflow(repo, workflowId, env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const owner = options.owner || DEFAULT_OWNER;
  const branch = options.branch || 'main';
  const inputs = options.inputs || {};
  const { ok, data } = await ghFetch(
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    'POST',
    { ref: branch, inputs },
    env.GITHUB_TOKEN
  );
  if (!ok) return { error: data.message || 'Failed to trigger workflow.' };
  return { ok: true, message: `Workflow ${workflowId} triggered on ${branch}` };
}

/**
 * List user's repositories.
 */
export async function listRepos(env, options = {}) {
  if (!env.GITHUB_TOKEN) return { error: 'GITHUB_TOKEN not configured.' };
  const { ok, data } = await ghFetch(`/user/repos?per_page=30&sort=updated`, 'GET', null, env.GITHUB_TOKEN);
  if (!ok) return { error: data.message || 'Failed to list repos.' };
  return { repos: data.map(r => ({ name: r.name, full_name: r.full_name, url: r.html_url, private: r.private, updated: r.updated_at })) };
}

/**
 * Create repo and push files in one operation - bypasses LLM tool chaining issues.
 * files: [{ path, content, message }]
 */
export async function createRepoAndPush(name, description, files, env, options = {}) {
  console.log(`[createRepoAndPush] Starting: name=${name}, files=${files?.length}`);
  
  if (!env.GITHUB_TOKEN) {
    console.log('[createRepoAndPush] ERROR: GITHUB_TOKEN not configured');
    return { error: 'GITHUB_TOKEN not configured.' };
  }
  
  try {
    // Step 1: Create the repository WITHOUT auto_init to avoid conflicts
    console.log('[createRepoAndPush] Step 1: Creating repo...');
    const createOptions = { ...options, auto_init: false };
    const createResult = await createRepo(name, description, env, createOptions);
    console.log('[createRepoAndPush] Create result:', JSON.stringify(createResult));
    
    if (createResult.error) {
      console.log('[createRepoAndPush] Create failed:', createResult.error);
      return { error: `Create failed: ${createResult.error}` };
    }
    
    // Step 2: Push all files
    console.log('[createRepoAndPush] Step 2: Pushing files...');
    const pushResult = await pushMultipleFiles(name, files, env, options);
    console.log('[createRepoAndPush] Push result:', JSON.stringify(pushResult));
    
    const result = {
      repo: createResult,
      push: pushResult,
      url: createResult.url,
      files_pushed: pushResult.success,
      files_failed: pushResult.failed
    };
    console.log('[createRepoAndPush] Final result:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.log('[createRepoAndPush] Exception:', err.message, err.stack);
    return { error: `Exception: ${err.message}` };
  }
}
