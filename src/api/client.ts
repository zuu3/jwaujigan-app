const DEFAULT_BASE_URL = 'https://jwj.zuu3.kr';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
export type ApiClientOptions = { token?: string | null };
export async function apiGet<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const res = await fetch(resolveUrl(path), { headers: buildHeaders(options.token) });
  return parseResponse<T>(res);
}
export async function apiPost<T>(path: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
  const res = await fetch(resolveUrl(path), { method: 'POST', headers: buildHeaders(options.token), body: body == null ? undefined : JSON.stringify(body) });
  return parseResponse<T>(res);
}
function resolveUrl(path: string) { if (path.startsWith('http')) return path; return API_BASE_URL + (path.startsWith('/') ? path : '/' + path); }
function buildHeaders(token?: string | null) { return { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : null) }; }
async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message ?? '요청에 실패했어요.');
  return data as T;
}
