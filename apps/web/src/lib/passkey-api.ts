import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:2998';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `Request failed with status ${res.status}`
    );
  }
  return res.json();
}

export interface PasskeyUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

export interface PasskeyLoginResult {
  accessToken: string;
  user: PasskeyUser;
}

/** Register a new passkey for the current user. */
export async function registerPasskey(deviceName?: string) {
  const options = await apiFetch<unknown>('/passkey/register/start', {
    method: 'POST',
    body: '{}',
  });

  const response = await startRegistration({
    optionsJSON: options as Parameters<
      typeof startRegistration
    >[0]['optionsJSON'],
  });

  return apiFetch('/passkey/register/finish', {
    method: 'POST',
    body: JSON.stringify({ response, deviceName }),
  });
}

/** Authenticate with an existing passkey (no prior login required). */
export async function authenticateWithPasskey(): Promise<PasskeyLoginResult> {
  const { sessionId, options } = await apiFetch<{
    sessionId: string;
    options: unknown;
  }>('/passkey/login/start', {
    method: 'POST',
    body: '{}',
  });

  const response = await startAuthentication({
    optionsJSON: options as Parameters<
      typeof startAuthentication
    >[0]['optionsJSON'],
  });

  return apiFetch<PasskeyLoginResult>('/passkey/login/finish', {
    method: 'POST',
    body: JSON.stringify({ sessionId, response }),
  });
}

export interface PasskeyInfo {
  id: string;
  deviceName: string | null;
  createdAt: string;
}

export async function listPasskeys() {
  return apiFetch<PasskeyInfo[]>('/passkey');
}

export async function deletePasskey(id: string) {
  return apiFetch<void>(`/passkey/${id}`, { method: 'DELETE' });
}
