// The server recognises this marker and sends `body` as-is with the given
// headers, which is how a route answers with HTML or SVG instead of JSON.
export const httpResponse = (
  body: string,
  headers: Record<string, string>,
  status = 200,
) => ({ __twentyHttpResponse: true as const, body, headers, status });
