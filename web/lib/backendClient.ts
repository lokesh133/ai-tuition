/**
 * Internal Backend Service Client (Vercel Multi-Service Binding)
 *
 * In Vercel Services mode, the `BACKEND_URL` environment variable is injected
 * automatically by Vercel into the `web` service functions at runtime.
 * In local development, it falls back to http://localhost:5000.
 */

export function getBackendUrl(): string {
  // In Vercel Services runtime, BACKEND_URL contains the internal service URL
  return process.env.BACKEND_URL || 'http://localhost:5000';
}

export async function callBackendService(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getBackendUrl();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${cleanBase}${cleanPath}`;

  return fetch(targetUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

