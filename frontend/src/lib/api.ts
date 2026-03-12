import { config } from "./config";

export async function api<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let message = `Request failed ${res.status}`;
    if (contentType.includes("application/json")) {
      try {
        const data = (await res.json()) as { error?: string; message?: string };
        message = data?.error || data?.message || JSON.stringify(data);
      } catch {
        message = `Request failed ${res.status}`;
      }
    } else {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
