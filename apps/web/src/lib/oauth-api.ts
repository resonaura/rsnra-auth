import { apiFetch } from '@/lib/api';

export interface OAuthClient {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  isFirstParty: boolean;
  privacyUrl: string | null;
  termsUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthClientWithSecret extends OAuthClient {
  clientSecret: string;
}

export interface AuthorizeResult {
  code: string;
  redirectUri: string;
  state?: string;
}

export interface PublicClientInfo {
  clientId: string;
  name: string;
  privacyUrl: string | null;
  termsUrl: string | null;
}

/**
 * Fetch public information about an OAuth client (name, legal page
 * URLs). No authentication required.
 */
export function getPublicClientInfo(clientId: string) {
  return apiFetch<PublicClientInfo>(`/oauth/clients/${clientId}`);
}

/**
 * Create a short-lived authorization code. Requires the user to be
 * authenticated (rsnra_session cookie).
 */
export function createAuthorizeCode(input: {
  clientId: string;
  redirectUri: string;
  state?: string;
}) {
  return apiFetch<AuthorizeResult>('/oauth/authorize', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ── Admin: OAuth client management ────────────────────────────────

export function adminListOAuthClients() {
  return apiFetch<OAuthClient[]>('/admin/oauth-clients');
}

export function adminCreateOAuthClient(input: {
  clientId: string;
  name: string;
  redirectUris: string[];
  firstParty?: string;
  privacyUrl?: string;
  termsUrl?: string;
}) {
  return apiFetch<OAuthClientWithSecret>('/admin/oauth-clients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateOAuthClient(
  id: string,
  input: {
    name?: string;
    redirectUris?: string[];
    firstParty?: string;
  }
) {
  return apiFetch<OAuthClient>(`/admin/oauth-clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function adminRegenerateOAuthClientSecret(id: string) {
  return apiFetch<OAuthClientWithSecret>(
    `/admin/oauth-clients/${id}/regenerate-secret`,
    { method: 'POST' }
  );
}

export function adminDeleteOAuthClient(id: string) {
  return apiFetch<void>(`/admin/oauth-clients/${id}`, { method: 'DELETE' });
}
