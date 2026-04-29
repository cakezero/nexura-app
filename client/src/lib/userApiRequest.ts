import { BACKEND_URL } from "./constants";
import { getStoredUserToken } from "./userSession";

export const userApiRequest = async <T = any>({
  method,
  endpoint,
  data,
  formData,
  auth = true,
}: {
  method: string;
  endpoint: string;
  data?: any;
  formData?: FormData;
  auth?: boolean;
}): Promise<T> => {
  const headers: Record<string, string> = {};

  if (auth) {
    const token = getStoredUserToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  if (!formData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BACKEND_URL}/api${endpoint}`, {
    method,
    headers,
    body: formData ?? (data ? JSON.stringify(data) : undefined),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
};