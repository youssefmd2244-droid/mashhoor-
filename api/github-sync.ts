// Real Vercel serverless function — the ONLY place GITHUB_TOKEN is ever
// read. This exists specifically so the browser (and therefore every site
// visitor, since this is a public storefront) never needs to know GitHub's
// write token.
//
// Why this matters: a GitHub personal access token is a bearer credential
// for your WHOLE account (repos, actions, packages — whatever scopes it was
// created with). If it were embedded in the client-side JS bundle (the old
// design — creds.github.token sent straight from the browser to
// api.github.com), literally anyone visiting the site could open
// DevTools → Network/Sources and lift it, then use it to read, modify, or
// delete anything that token can reach. A password screen on the admin
// panel does NOT prevent this — the JS bundle (and anything embedded in
// it) ships to every visitor's browser regardless of whether they ever see
// or pass that password screen.
//
// The fix: keep GITHUB_TOKEN as a server-only Vercel Environment Variable
// (Settings → Environment Variables — never something a browser can read).
// The browser talks to THIS endpoint instead of api.github.com directly,
// sending only non-secret info (owner/repo/branch — where to read/write,
// not a credential). This function attaches the real token itself,
// server-side, on every request.
//
// Note this does not change GitHub's fundamental shape as a storage
// backend: reads/writes still go through one JSON file in a repo, and
// there is still no realtime push from GitHub — see subscribe() in
// storageAdapters.ts, which now polls THIS endpoint instead of GitHub's.

export const config = {
  runtime: 'nodejs',
};

const DATA_PATH = 'data/site-data.json';

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'mashhoor-site-sync',
    Accept: 'application/vnd.github+json',
  };
}

export default async function handler(request: Request): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN غير مُعرّف على السيرفر (Vercel → Settings → Environment Variables).' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');
  const branch = url.searchParams.get('branch') || 'main';
  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: 'owner و repo مطلوبين' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${DATA_PATH}`;

  if (request.method === 'GET') {
    // Used both for the initial pull AND for polling (see subscribe() in
    // storageAdapters.ts) — an incoming If-None-Match is forwarded straight
    // through to GitHub so unchanged polls stay cheap (304, no body) on
    // both legs of the trip.
    const inm = request.headers.get('if-none-match');
    const res = await fetch(`${api}?ref=${branch}`, {
      headers: { ...githubHeaders(token), ...(inm ? { 'If-None-Match': inm } : {}) },
    });
    if (res.status === 304) return new Response(null, { status: 304 });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: `GitHub read failed: ${res.status} ${detail}`.slice(0, 300) }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const json = await res.json();
    const decoded = decodeURIComponent(escape(atob(json.content)));
    return new Response(decoded, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...(res.headers.get('etag') ? { ETag: res.headers.get('etag')! } : {}),
      },
    });
  }

  if (request.method === 'POST') {
    const snapshot = await request.json();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot, null, 2))));

    let sha: string | undefined;
    const existing = await fetch(`${api}?ref=${branch}`, { headers: githubHeaders(token) });
    if (existing.ok) sha = (await existing.json()).sha;

    // Retry once on a 409 (sha conflict — another device's push landed
    // between our GET above and this PUT) instead of failing outright.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(api, {
        method: 'PUT',
        headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `chore: sync site data ${new Date().toISOString()}`,
          content,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (res.ok) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (res.status === 409 && attempt === 0) {
        const retry = await fetch(`${api}?ref=${branch}`, { headers: githubHeaders(token) });
        if (retry.ok) sha = (await retry.json()).sha;
        continue;
      }
      const detail = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: `GitHub write failed: ${res.status} ${detail}`.slice(0, 300) }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'GitHub write failed after retry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
      }

