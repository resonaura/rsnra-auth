import { PageShell } from '@/components/page-shell';
import { useDocumentTitle } from '@/lib/use-document-title';

export function TermsPage() {
  useDocumentTitle('Terms of Use');
  return (
    <PageShell title="Terms of Use" maxWidth="max-w-2xl">
      <div className="text-foreground/90 flex flex-col gap-6 text-sm leading-relaxed">
        <p className="text-muted-foreground">Last updated: June 28, 2026</p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            1. Accepting these terms
          </h2>
          <p>
            By creating an account or signing in through RSNRA Auth, you agree
            to these terms. If you do not agree, please do not use the service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">2. The service</h2>
          <p>
            RSNRA Auth is the central identity provider for RSNRA services. It
            provides account creation, authentication, profile management,
            session management, and OAuth-based single sign-on (SSO) for
            connected services including rsnra.link and md.rsnra.com.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            3. Account responsibilities
          </h2>
          <ul className="ml-5 list-disc">
            <li>
              You are responsible for keeping your password secure and for all
              activity under your account.
            </li>
            <li>
              You must provide accurate information when creating your account.
            </li>
            <li>
              You must not share your account credentials with others or allow
              unauthorized access.
            </li>
            <li>
              Notify us promptly if you believe your account has been
              compromised.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            4. Acceptable use
          </h2>
          <ul className="ml-5 list-disc">
            <li>
              Do not attempt to disrupt, bypass, or gain unauthorized access to
              RSNRA Auth or any connected service.
            </li>
            <li>Do not create accounts for automated or malicious purposes.</li>
            <li>
              Do not use RSNRA Auth to impersonate another person or entity.
            </li>
            <li>
              Do not abuse the OAuth flow to circumvent rate limits or access
              controls on connected services.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            5. OAuth and connected services
          </h2>
          <p>
            When you sign into a connected service (e.g., rsnra.link,
            md.rsnra.com) through RSNRA Auth, the following occurs:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              For same-domain services (md.rsnra.com), your session cookie is
              shared directly within the .rsnra.com domain.
            </li>
            <li>
              For cross-domain services (rsnra.link), a short-lived
              authorization code is issued via the OAuth 2.0 authorization code
              flow, which the service exchanges for an access token.
            </li>
            <li>
              In both cases, the connected service receives your user ID, email,
              display name, avatar URL, and role. It does not receive your
              password.
            </li>
          </ul>
          <p>
            Each connected service is governed by its own terms of use. RSNRA
            Auth is not responsible for the content, data practices, or
            availability of connected services.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            6. Intellectual property
          </h2>
          <p>
            RSNRA Auth is owned and operated by Andrii Vynohradov. The service
            name, logos, and software are protected by intellectual property
            laws. You retain ownership of your profile information (display
            name, avatar URL).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            7. Service availability
          </h2>
          <p>
            The service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, express or implied.
            We aim for reliable account access but do not guarantee
            uninterrupted availability. We are not liable for any loss arising
            from service downtime or unavailability.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            8. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, Andrii Vynohradov shall not
            be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of RSNRA Auth or any
            connected service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            9. Account termination
          </h2>
          <p>
            You may delete your account at any time from the profile page.
            Accounts that violate these terms may be suspended or terminated
            without notice.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            10. Changes to these terms
          </h2>
          <p>
            We may update these terms from time to time. Material changes will
            be reflected by an updated &quot;Last updated&quot; date. Continued
            use of RSNRA Auth after changes constitutes acceptance of the
            revised terms.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">11. Contact</h2>
          <p>
            For questions about these terms, contact{' '}
            <a
              href="mailto:resonaura@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              resonaura@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}

export default TermsPage;
