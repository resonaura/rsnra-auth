import { PageShell } from '@/components/page-shell';
import { useDocumentTitle } from '@/lib/use-document-title';

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy');
  return (
    <PageShell title="Privacy Policy" maxWidth="max-w-2xl">
      <div className="text-foreground/90 flex flex-col gap-6 text-sm leading-relaxed">
        <p className="text-muted-foreground">Last updated: June 28, 2026</p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">1. Who we are</h2>
          <p>
            RSNRA Auth (operated by Andrii Vynohradov) is the central identity
            provider for the RSNRA family of services, including rsnra.link
            (music streaming) and md.rsnra.com (markdown editor). It manages
            user accounts, authentication, profile information, and sessions
            across all RSNRA services.
          </p>
          <p>
            Contact:{' '}
            <a
              href="mailto:resonaura@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              resonaura@gmail.com
            </a>
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            2. What data we collect
          </h2>
          <p>If you create an account, we store:</p>
          <ul className="ml-5 list-disc">
            <li>
              <strong>Email address</strong> — used as your unique identifier
              across all RSNRA services.
            </li>
            <li>
              <strong>Password</strong> — stored as a salted bcrypt hash. We
              never store or transmit your plaintext password.
            </li>
            <li>
              <strong>Display name</strong> (optional) — a human-friendly name
              shown across RSNRA services.
            </li>
            <li>
              <strong>Avatar URL</strong> (optional) — a link to your profile
              image.
            </li>
            <li>
              <strong>Account role</strong> — either "user" or "admin", used to
              control access to administrative features.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            3. How we use your data
          </h2>
          <ul className="ml-5 list-disc">
            <li>To authenticate you and manage your sessions.</li>
            <li>
              To share your identity (email, display name, avatar URL, role)
              with RSNRA services you sign into, so they can display your
              profile without separate registration.
            </li>
            <li>To protect admin-only features and prevent abuse.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            4. Cookies and sessions
          </h2>
          <p>
            After signing in, we set an HTTP-only cookie named{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              rsnra_session
            </code>{' '}
            containing a signed JWT. The cookie:
          </p>
          <ul className="ml-5 list-disc">
            <li>Is valid for 365 days from the time of login.</li>
            <li>
              Is scoped to the <code>.rsnra.com</code> domain in production,
              enabling seamless sign-in across auth.rsnra.com and md.rsnra.com.
            </li>
            <li>
              Is never accessible to JavaScript (HttpOnly), preventing XSS-based
              token theft.
            </li>
            <li>
              Does not contain your password — only a signed token identifying
              your account.
            </li>
          </ul>
          <p>
            For services on a different domain (rsnra.link), we use the OAuth
            2.0 authorization code flow. Your RSNRA Auth session cookie is never
            sent to rsnra.link; instead, a short-lived authorization code is
            exchanged server-to-server for an access token.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            5. Data sharing between services
          </h2>
          <p>
            When you sign into a RSNRA service, that service may receive the
            following information from RSNRA Auth:
          </p>
          <ul className="ml-5 list-disc">
            <li>Your user ID (a UUID).</li>
            <li>Your email address.</li>
            <li>Your display name and avatar URL.</li>
            <li>Your account role.</li>
          </ul>
          <p>
            Each service has its own privacy policy describing how it handles
            this data in combination with its service-specific data. We do not
            share your password hash with any service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            6. What we don&apos;t do
          </h2>
          <ul className="ml-5 list-disc">
            <li>We don&apos;t run ads or third-party trackers.</li>
            <li>We don&apos;t sell your account data.</li>
            <li>We don't expose your password to other RSNRA services.</li>
            <li>
              We don&apos;t use your data to train machine learning models.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            7. Data retention
          </h2>
          <p>
            Your auth profile is retained for as long as your account exists.
            You may delete your account at any time from the profile page, which
            permanently removes your email, password hash, display name, and
            avatar URL from the auth database. Service-specific data (e.g.,
            documents on md.rsnra.com, playlists on rsnra.link) must be deleted
            separately through each service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            8. Your rights (GDPR / PIPEDA)
          </h2>
          <p>You have the right to:</p>
          <ul className="ml-5 list-disc">
            <li>
              <strong>Access</strong> — request a copy of your data.
            </li>
            <li>
              <strong>Rectification</strong> — update your display name or
              avatar at any time from the profile page.
            </li>
            <li>
              <strong>Erasure</strong> — delete your account from the profile
              page.
            </li>
            <li>
              <strong>Data portability</strong> — export your email and profile
              information.
            </li>
            <li>
              <strong>Objection</strong> — contact us to restrict processing.
            </li>
          </ul>
          <p>
            To exercise these rights, email{' '}
            <a
              href="mailto:resonaura@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              resonaura@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">9. Security</h2>
          <p>
            Passwords are hashed with bcrypt (cost factor 12). Session tokens
            are JWTs signed with a server-side secret. All production traffic
            uses HTTPS. The database is self-hosted and not shared with third
            parties.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            10. Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time. Material changes will
            be reflected by an updated "Last updated" date at the top of this
            page.
          </p>
        </section>
      </div>
    </PageShell>
  );
}

export default PrivacyPage;
