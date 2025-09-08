export default async function handler(req: any, res: any) {
  const { path } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const targetPath = path.join('/');
  const targetUrl = `https://w-corp-staticblitz.com/${targetPath}`;

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {},
    };

    // Copy relevant headers
    const headersToCopy = ['accept', 'accept-encoding', 'accept-language', 'cache-control', 'user-agent', 'authorization', 'content-type'];
    for (const header of headersToCopy) {
      if (req.headers[header]) {
        (fetchOptions.headers as any)[header] = req.headers[header];
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const arrayBuffer = await response.arrayBuffer();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Set COI headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}