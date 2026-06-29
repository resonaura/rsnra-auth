import { Route, Routes } from 'react-router';

import App from '@/app';
import { AccountPage } from '@/pages/account-page';
import { AdminPage } from '@/pages/admin-page';
import { AuthPage } from '@/pages/auth-page';
import { OAuthAuthorizePage } from '@/pages/oauth-authorize-page';
import { PrivacyPage } from '@/pages/privacy-page';
import { TermsPage } from '@/pages/terms-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/profile" element={<AccountPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
    </Routes>
  );
}
