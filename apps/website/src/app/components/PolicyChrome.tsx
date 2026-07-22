import Link from 'next/link';
import type { ReactNode } from 'react';

type PolicyLink = { href: string; label: string };

export function PolicyChrome({
  activeHref,
  children,
  links,
}: {
  activeHref: string;
  children: ReactNode;
  links: PolicyLink[];
}) {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <Link className="policy-brand" href="/">
          Niva
        </Link>
        <nav className="policy-nav" aria-label="Legal and support">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Get help</Link>
        </nav>
        <Link className="policy-open" href="/">
          Open Niva
        </Link>
      </header>
      <div className="policy-layout">
        <aside className="policy-sidebar">
          {links.map((link) => (
            <Link
              className={link.href === activeHref ? 'active' : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <a href="mailto:care@niva.community">Contact us</a>
        </aside>
        <article className="policy-content">{children}</article>
      </div>
      <footer className="policy-footer">
        <strong>Niva</strong>
        <span>Plans designed for real life.</span>
        <a href="mailto:care@niva.community">care@niva.community</a>
      </footer>
    </main>
  );
}

export const policyLinks: PolicyLink[] = [
  { href: '/privacy', label: 'Privacy & safety' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/delete-account', label: 'Delete your account' },
  { href: '/support', label: 'Help & support' },
];
