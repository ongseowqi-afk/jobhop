import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3002/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function apiGet<T = unknown>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, { headers });
    const json = await res.json();
    if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
    return { data: json.data ?? json };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown
): Promise<{ data?: T; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
    return { data: json.data ?? json };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function apiPatch<T = unknown>(
  path: string,
  body?: unknown
): Promise<{ data?: T; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
    return { data: json.data ?? json };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
