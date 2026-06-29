import { Loader2Icon } from 'lucide-react';
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { useTheme } from '@/components/theme/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { createAuthorizeCode } from '@/lib/oauth-api';
import { useDocumentTitle } from '@/lib/use-document-title';

type Status =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'redirecting'; clientName: string };

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function OAuthAuthorizePage() {
  useDocumentTitle('Authorize');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { theme } = useTheme();

  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const state = searchParams.get('state') ?? undefined;
  const responseType = searchParams.get('response_type') ?? 'code';

  const [status, setStatus] = React.useState<Status>(() => {
    if (!clientId || !redirectUri) {
      return {
        kind: 'error',
        message: 'Missing required parameters: client_id and redirect_uri.',
      };
    }
    if (responseType !== 'code') {
      return {
        kind: 'error',
        message: `Unsupported response_type "${responseType}". Only "code" is supported.`,
      };
    }
    return { kind: 'loading' };
  });

  const retryCount = React.useRef(0);
  const proceedRef = React.useRef<() => void>(() => {});

  const proceed = React.useCallback(() => {
    return createAuthorizeCode({
      clientId,
      redirectUri,
      state,
    })
      .then(result => {
        const url = new URL(result.redirectUri);
        url.searchParams.set('code', result.code);
        if (result.state) url.searchParams.set('state', result.state);
        setStatus({ kind: 'redirecting', clientName: clientId });
        window.location.assign(url.toString());
      })
      .catch(error => {
        retryCount.current += 1;
        if (retryCount.current < MAX_RETRIES) {
          // Retry — the API might still be starting up.
          setTimeout(() => void proceedRef.current(), RETRY_DELAY);
        } else {
          const message =
            error instanceof ApiError
              ? error.message
              : 'Authorization request failed.';
          setStatus({ kind: 'error', message });
        }
      });
  }, [clientId, redirectUri, state]);

  React.useEffect(() => {
    proceedRef.current = proceed;
  }, [proceed]);

  React.useEffect(() => {
    if (isAuthLoading || status.kind !== 'loading') return;

    if (!user) {
      const currentPath = `/oauth/authorize?${searchParams.toString()}`;
      const params = new URLSearchParams(searchParams);
      params.set('redirect', currentPath);
      navigate(`/auth?${params.toString()}`, { replace: true });
      return;
    }

    void proceed();
  }, [isAuthLoading, user, status.kind, proceed, navigate, searchParams]);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src={theme === 'dark' ? '/icon.svg' : '/icon-light.svg'}
            alt="RSNRA Auth"
            className="size-11"
          />
        </div>

        <Card className="border-border bg-transparent">
          <CardHeader>
            <h2 className="text-center text-lg font-medium">
              {status.kind === 'redirecting'
                ? `Redirecting to ${status.clientName}…`
                : 'Authorize'}
            </h2>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            {status.kind === 'loading' && (
              <>
                <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Preparing authorization…
                </p>
              </>
            )}

            {status.kind === 'redirecting' && (
              <>
                <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
                <p className="text-muted-foreground text-center text-sm">
                  You're being redirected to {status.clientName}.
                </p>
              </>
            )}

            {status.kind === 'error' && (
              <>
                <p className="text-destructive text-center text-sm">
                  {status.message}
                </p>
                <Button render={<a href="/" />}>Back to home</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OAuthAuthorizePage;
