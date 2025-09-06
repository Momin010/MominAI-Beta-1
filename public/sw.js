// public/sw.js

self.addEventListener('install', (event) => {
  // Activate the new service worker as soon as it's installed.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD') {
        event.ports[0].postMessage({ reloaded: true });
    }
});

self.addEventListener('fetch', (event) => {
  // We only want to modify the main document request (navigation).
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);

    // If the user is navigating to the IDE page, apply the COOP/COEP headers
    // required for WebContainers to function.
    if (url.searchParams.get('ide') === 'true') {
      event.respondWith(
        (async () => {
          try {
            const response = await fetch(event.request);
            
            // Create a new response with the required headers.
            // We can't modify the original response, so we clone it.
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          } catch (error) {
            console.error('Service Worker fetch failed:', error);
            // If fetch fails, return a network error response
            return new Response('Network error', {
              status: 500,
              statusText: 'Service Worker fetch failed',
            });
          }
        })()
      );
    }
    // For other navigation requests (e.g., to the landing page),
    // do nothing and let the browser handle it normally.
  }
  // For all sub-resource requests (JS, CSS, images, etc.), do nothing.
  // The browser will enforce security policies based on the headers
  // of the document that loaded them.
});