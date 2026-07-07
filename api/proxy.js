/**
 * Proxy same-origin para a API backend.
 * A URL real fica em API_BACKEND_URL (variável de ambiente no Vercel).
 * Com isso o refresh_token é gravado no domínio do frontend (first-party).
 *
 * Roteado via vercel.json: /api/v1/:path* -> /api/proxy?path=:path*
 * (catch-all aninhado em api/v1/ não cobre paths com múltiplos segmentos no Vercel)
 */
module.exports = async (req, res) => {
  const backendBase = process.env.API_BACKEND_URL;
  if (!backendBase) {
    res.status(500).json({ message: 'API_BACKEND_URL not configured' });
    return;
  }

  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
  const requestUrl = new URL(req.url, `https://${req.headers.host}`);
  const forwardParams = new URLSearchParams(requestUrl.search);
  forwardParams.delete('path');
  const query = forwardParams.toString();

  const targetUrl = `${backendBase.replace(/\/$/, '')}/${subPath}${query ? `?${query}` : ''}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const hasBody = req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const body = hasBody
    ? typeof req.body === 'string'
      ? req.body
      : req.body != null
        ? JSON.stringify(req.body)
        : undefined
    : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  res.status(upstream.status);

  const setCookies = typeof upstream.headers.getSetCookie === 'function'
    ? upstream.headers.getSetCookie()
    : [];

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding') return;
    if (lower === 'set-cookie') return;
    res.setHeader(key, value);
  });

  if (setCookies.length > 0) {
    setCookies.forEach(cookie => res.appendHeader('Set-Cookie', cookie));
  } else {
    const singleCookie = upstream.headers.get('set-cookie');
    if (singleCookie) res.appendHeader('Set-Cookie', singleCookie);
  }

  const payload = await upstream.arrayBuffer();
  res.send(Buffer.from(payload));
};
