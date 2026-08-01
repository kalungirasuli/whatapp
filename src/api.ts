import {
  AuthSession,
  AuthUser,
  ChatReply,
  HistoryEntry,
  InterestEntry,
  MerchantProfile,
  ProductItem,
} from './types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8002';
const ACCESS_KEY = 'wa_access_token';
const REFRESH_KEY = 'wa_refresh_token';

export function getApiUrl(): string {
  return API_URL;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem('wa_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
  localStorage.setItem('wa_session', JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('wa_session');
}

class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; json?: unknown; form?: FormData; params?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const url = new URL(path, API_URL);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const data = await res.json();
      detail = (data as { detail?: unknown }).detail ?? data;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ---- Auth ---- */

export async function requestOtp(phone: string): Promise<{ message: string; expires_in: number }> {
  return request('/api/auth/request-otp', { method: 'POST', json: { phone } });
}

export async function verifyOtp(
  phone: string,
  code: string,
  role: 'client' | 'merchant',
  name?: string,
): Promise<AuthSession> {
  return request('/api/auth/verify-otp', { method: 'POST', json: { phone, code, role, name } });
}

export async function getMe(): Promise<AuthUser> {
  return request('/api/auth/me');
}

/* ---- Chat ---- */

export async function sendChat(opts: {
  text: string;
  file?: File;
  lat?: number;
  lng?: number;
}): Promise<ChatReply> {
  const form = new FormData();
  form.append('text', opts.text);
  if (opts.file) form.append('files', opts.file);
  return request('/api/chat', {
    method: 'POST',
    form,
    params: { lat: opts.lat, lng: opts.lng },
  });
}

/* ---- Client ---- */

export async function getMyHistory(): Promise<{ history: HistoryEntry[]; total: number }> {
  return request('/api/clients/me/history');
}

export async function getMyInterests(): Promise<InterestEntry[]> {
  return request('/api/clients/me/interests');
}

export async function expressInterest(productId: number): Promise<{ id: number; status: string }> {
  return request(`/api/clients/me/interests/${productId}`, { method: 'POST' });
}

export async function removeInterest(productId: number): Promise<{ message: string }> {
  return request(`/api/clients/me/interests/${productId}`, { method: 'DELETE' });
}

/* ---- Merchant / Shop ---- */

export async function updateMerchantProfile(data: {
  business_name?: string;
  category?: string;
  location_lat?: number;
  location_lng?: number;
}): Promise<MerchantProfile> {
  return request('/api/merchants/me/profile', {
    method: 'PUT',
    params: {
      business_name: data.business_name,
      category: data.category,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
    },
  });
}

export async function getMerchantProfile(): Promise<MerchantProfile> {
  return request('/api/merchants/me/profile');
}

export async function getMyProducts(): Promise<ProductItem[]> {
  return request('/api/products');
}

export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  brand?: string;
  stock_qty?: number;
}): Promise<{ id: number }> {
  return request('/api/products', {
    method: 'POST',
    params: {
      name: data.name,
      category: data.category,
      price: data.price,
      brand: data.brand,
      stock_qty: data.stock_qty,
    },
  });
}

export async function updateProduct(
  id: number,
  data: { name?: string; category?: string; price?: number; brand?: string; stock_qty?: number },
): Promise<{ id: number }> {
  return request(`/api/products/${id}`, {
    method: 'PUT',
    params: {
      name: data.name,
      category: data.category,
      price: data.price,
      brand: data.brand,
      stock_qty: data.stock_qty,
    },
  });
}

export async function deleteProduct(id: number): Promise<{ message: string }> {
  return request(`/api/products/${id}`, { method: 'DELETE' });
}

export async function uploadProductImage(id: number, file: File): Promise<{ id: number; url: string }> {
  const form = new FormData();
  form.append('file', file);
  return request(`/api/products/${id}/images`, { method: 'POST', form });
}

/* ---- Result codes ---- */

export async function lookupResultCode(code: string): Promise<{
  code: string;
  search_query: string | null;
  image_description: string | null;
  category: string | null;
  product_count: number;
  sample_products: Array<Record<string, unknown>>;
  created_at: string;
}> {
  return request(`/api/result-codes/${encodeURIComponent(code)}`);
}
