const AGENCY_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  cookie?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    };

    const res = await fetch(`${AGENCY_API}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const json = await res.json();
    if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
    return { data: json.data ?? json };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
