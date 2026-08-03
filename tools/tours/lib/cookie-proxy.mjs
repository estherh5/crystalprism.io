// A local HTTP reverse proxy that injects a session cookie on every request.
//
// Why this is needed: tours record the PRODUCTION build (`next start`), because
// dev mode paints a Next.js dev indicator badge that would end up in the video.
// But `next start` sets NODE_ENV=production, so sessionCookieConfig() names the
// cookie `__Secure-crystalprism.session-token` — and browsers refuse to send a
// `__Secure-`-prefixed cookie over plain http://localhost.
//
// The `__Secure-` rule is a browser storage/transport rule, not a server parsing
// rule. So we let the browser hold nothing, and this proxy adds the Cookie header
// server-side on the way through. Next.js reads it happily.
//
// Host header is passed through unchanged — rewriting it breaks Auth.js host
// checks on the crystalprism ring.

import http from 'node:http';

/**
 * @param {object} opts
 * @param {number} opts.listenPort
 * @param {number} opts.targetPort
 * @param {string} opts.cookieName
 * @param {string} opts.cookieValue
 * @returns {Promise<{port: number, close: () => Promise<void>}>}
 */
export function startCookieProxy({ listenPort, targetPort, cookieName, cookieValue }) {
  const inject = `${cookieName}=${cookieValue}`;

  const server = http.createServer((req, res) => {
    const existing = req.headers.cookie;
    // Our cookie goes last so it wins if the app also set a stale one.
    const cookie = existing ? `${existing}; ${inject}` : inject;

    const proxyReq = http.request(
      {
        host: '127.0.0.1',
        port: targetPort,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, cookie },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end(`proxy error: ${err.message}`);
    });

    req.pipe(proxyReq, { end: true });
  });

  // Next's prod build still opens websockets for some features; pass them through
  // rather than letting the handshake hang.
  server.on('upgrade', (req, socket, head) => {
    const proxyReq = http.request({
      host: '127.0.0.1',
      port: targetPort,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, cookie: inject },
    });
    proxyReq.end();
    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(proxyRes.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n')}\r\n\r\n`,
      );
      if (proxyHead?.length) socket.unshift(proxyHead);
      if (head?.length) proxySocket.unshift(head);
      proxySocket.pipe(socket).pipe(proxySocket);
    });
    proxyReq.on('error', () => socket.destroy());
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(listenPort, '127.0.0.1', () => {
      resolve({
        port: listenPort,
        close: () =>
          new Promise((done) => {
            server.closeAllConnections?.();
            server.close(() => done());
          }),
      });
    });
  });
}
