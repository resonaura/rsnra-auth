import { Loader2Icon } from 'lucide-react';
import { Navigate } from 'react-router';

import { useAuth } from '@/lib/auth-context';

export function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return <Navigate to={user ? '/profile' : '/auth'} replace />;
}

export default App;
