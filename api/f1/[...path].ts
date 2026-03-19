const ERGAST_BASE = 'https://ergast.com/api/f1';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

type VercelRequest = any;
type VercelResponse = any;

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const contentType = res.headers.get('content-type') || '';
  const body = await res.arrayBuffer();
  return { contentType, body };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Preserve path + query after /api/f1
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path ?? '');
    const qsIndex = (req.url || '').indexOf('?');
    const query = qsIndex >= 0 ? (req.url || '').slice(qsIndex) : '';
    const suffix = `/${path}${query}`;

    let lastErr: unknown = null;
    for (const base of [ERGAST_BASE, JOLPICA_BASE]) {
      try {
        const { contentType, body } = await fetchJson(`${base}${suffix}`);
        res.setHeader('content-type', contentType || 'application/json');
        res.setHeader('cache-control', 's-maxage=3600, stale-while-revalidate=86400');
        // CORS (handy if you ever call this from a different origin)
        res.setHeader('access-control-allow-origin', '*');
        res.status(200).send(Buffer.from(body));
        return;
      } catch (e) {
        lastErr = e;
      }
    }

    res.status(502).json({
      error: 'F1 proxy failed',
      detail: String((lastErr as any)?.message ?? lastErr),
    });
  } catch (e: any) {
    res.status(500).json({ error: 'Proxy error', detail: e?.message ?? String(e) });
  }
}
