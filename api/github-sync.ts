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
// IMPORTANT — signature note: this function used to be written with the Web
// Fetch API signature `(request: Request) => Promise<Response>`. Vercel's
// Node.js runtime logged a warning that it was actually invoking this route
// with the CLASSIC Node handler signature `(req, res)`, and since our code
// only ever did `return new Response(...)` — never called `res.end()` —
// Vercel sat waiting for a response that was never going to come, all the
// way until maxDuration (30s) force-killed it. That's what was showing up
// as "Vercel Runtime Timeout Error" on every single call. Rewriting this
// with the classic (req, res) signature removes that ambiguity entirely.
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// Calls to api.github.com had no timeout of their own — if the outbound
// connection stalled, the function just sat there. Wrapping every GitHub
// call in an explicit ~12s AbortController means a stuck connection fails
// fast with a real message instead of quietly eating the whole budget.
async function githubFetch(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(`تعذّر الوصول لـ api.github.com خلال ${Math.round(timeoutMs / 1000)} ث (اتصال عالق قبل أي رد).`);
    }
    throw new Error(`فشل الاتصال بـ GitHub: ${e?.message || String(e)}`);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Wrap EVERYTHING in try/catch. Without this, any unhandled exception
  // crashes the whole function and Vercel returns a generic 500 with no
  // detail. This way we always return real JSON explaining what broke.
  try {
    await innerHandler(req, res);
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: `Function crashed: ${e?.message || String(e)}`.slice(0, 500) });
    }
  }
}

async function innerHandler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'GITHUB_TOKEN غير مُعرّف على السيرفر (Vercel → Settings → Environment Variables).' });
    return;
  }

  const owner = typeof req.query.owner === 'string' ? req.query.owner : undefined;
  const repo = typeof req.query.repo === 'string' ? req.query.repo : undefined;
  const branch = typeof req.query.branch === 'string' ? req.query.branch : 'main';
  if (!owner || !repo) {
    res.status(400).json({ error: 'owner و repo مطلوبين' });
    return;
  }
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${DATA_PATH}`;

  if (req.method === 'GET') {
    // Used both for the initial pull AND for polling (see subscribe() in
    // storageAdapters.ts) — an incoming If-None-Match is forwarded straight
    // through to GitHub so unchanged polls stay cheap (304, no body) on
    // both legs of the trip.
    const inm = req.headers['if-none-match'];
    const ghRes = await githubFetch(`${api}?ref=${branch}`, {
      headers: { ...githubHeaders(token), ...(inm ? { 'If-None-Match': String(inm) } : {}) },
    });
    if (ghRes.status === 304) {
      res.status(304).end();
      return;
    }
    if (!ghRes.ok) {
      const detail = await ghRes.text().catch(() => '');
      res.status(ghRes.status).json({ error: `GitHub read failed: ${ghRes.status} ${detail}`.slice(0, 300) });
      return;
    }
    const json = await ghRes.json();
    const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
    const etag = ghRes.headers.get('etag');
    if (etag) res.setHeader('ETag', etag);
    res.status(200).setHeader('Content-Type', 'application/json').send(decoded);
    return;
  }

  if (req.method === 'POST') {
    const snapshot = req.body;
    const content = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf-8').toString('base64');

    let sha: string | undefined;
    const existing = await githubFetch(`${api}?ref=${branch}`, { headers: githubHeaders(token) });
    if (existing.ok) sha = (await existing.json()).sha;

    // Retry once on a 409 (sha conflict — another device's push landed
    // between our GET above and this PUT) instead of failing outright.
    for (let attempt = 0; attempt < 2; attempt++) {
      const putRes = await githubFetch(api, {
        method: 'PUT',
        headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `chore: sync site data ${new Date().toISOString()}`,
          content,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (putRes.ok) {
        res.status(200).json({ ok: true });
        return;
      }
      if (putRes.status === 409 && attempt === 0) {
        const retry = await githubFetch(`${api}?ref=${branch}`, { headers: githubHeaders(token) });
        if (retry.ok) sha = (await retry.json()).sha;
        continue;
      }
      const detail = await putRes.text().catch(() => '');
      res.status(putRes.status).json({ error: `GitHub write failed: ${putRes.status} ${detail}`.slice(0, 300) });
      return;
    }
    res.status(500).json({ error: 'GitHub write failed after retry' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
