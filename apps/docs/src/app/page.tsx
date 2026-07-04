'use client';

import { useEffect, useMemo, useState } from 'react';

import { ArchitectureFlow } from '@/components/ArchitectureFlow';
import { MermaidDiagram } from '@/components/MermaidDiagram';

const navItems = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'learning', label: 'Learning' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'backend', label: 'Backend' },
  { id: 'database', label: 'Database' },
  { id: 'deployment', label: 'Deployment' },
];

const docs = [
  {
    id: 'sprint-0',
    title: 'Sprint 0: Product Stack',
    section: 'Learning',
    body: 'React Native Expo for mobile, NestJS for APIs, Next.js for admin and docs, PostgreSQL for durable product data.',
  },
  {
    id: 'sprint-1',
    title: 'Sprint 1: Authentication',
    section: 'Learning',
    body: 'Firebase verifies the phone number. NestJS verifies the Firebase ID token. Prisma stores or updates the Niva user.',
  },
  {
    id: 'http',
    title: 'HTTP Requests',
    section: 'Backend',
    body: 'The app talks to the backend over HTTPS. The backend decides what the user can read or change.',
  },
  {
    id: 'firebase',
    title: 'Firebase Auth',
    section: 'Authentication',
    body: 'Firebase owns OTP delivery and identity proof. It does not own Niva business rules.',
  },
  {
    id: 'phone-metadata',
    title: 'Phone Country Metadata',
    section: 'Mobile',
    body: 'The current country picker is hardcoded for the initial UI. Production should use a real phone metadata library or shared metadata source.',
  },
  {
    id: 'username-onboarding',
    title: 'Username Onboarding',
    section: 'Authentication',
    body: 'After phone verification, the current app asks for a username so the signed-in state can show a product identity instead of only a phone number.',
  },
  {
    id: 'social-auth',
    title: 'Social Sign-In',
    section: 'Authentication',
    body: 'Google, Apple, and other providers can be added later through Firebase Auth providers. They are not wired into the current Expo client yet.',
  },
  {
    id: 'postgres',
    title: 'PostgreSQL',
    section: 'Database',
    body: 'PostgreSQL stores users, attendance, events, communities, host status, and trust signals as the product grows.',
  },
  {
    id: 'interviews',
    title: 'Interview Questions',
    section: 'Learning',
    body: 'Explain why mobile apps should call an API instead of connecting directly to a production database.',
  },
];

const architectureChart = `flowchart TD
  user[User] --> app[React Native Expo App]
  app --> api[HTTPS Request]
  api --> backend[NestJS Backend]
  backend --> firebase[Firebase Auth]
  backend --> postgres[(PostgreSQL)]
  firebase --> sms[SMS Provider]
`;

export default function DocsHome() {
  const [query, setQuery] = useState('');
  const [darkMode, setDarkMode] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem('niva-docs-theme') === 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    window.localStorage.setItem('niva-docs-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return docs;
    }

    return docs.filter((doc) =>
      `${doc.title} ${doc.section} ${doc.body}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <main className="docs-layout">
      <aside className="sidebar">
        <a className="brand" href="#introduction" aria-label="Niva Docs home">
          <span className="brand-mark">N</span>
          <span>
            <strong>Niva Docs</strong>
            <small>Academy</small>
          </span>
        </a>

        <label className="search">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="auth, database, mobile"
            type="search"
            value={query}
          />
        </label>

        <nav className="nav-links" aria-label="Documentation sections">
          {navItems.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              {item.label}
            </a>
          ))}
        </nav>

        <button className="theme-toggle" onClick={() => setDarkMode((value) => !value)} type="button">
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>

      <section className="content">
        <section className="hero" id="introduction">
          <p className="eyebrow">Niva Academy</p>
          <h1>Learn the product by building the product.</h1>
          <p className="hero-copy">
            Every sprint explains what we built, why it exists, and how it fits into Niva.
            The stack is TypeScript-first: React Native Expo, NestJS, Next.js, and PostgreSQL.
          </p>
          <div className="stack-strip" aria-label="Niva stack">
            <span>React Native Expo</span>
            <span>NestJS</span>
            <span>Next.js</span>
            <span>PostgreSQL</span>
            <span>Firebase</span>
          </div>
        </section>

        <section className="section-band" id="learning">
          <div className="section-heading">
            <p className="eyebrow">Learning Model</p>
            <h2>Three perspectives for every feature</h2>
          </div>
          <div className="principles">
            <article>
              <span>01</span>
              <h3>What</h3>
              <p>The definition in plain engineering language.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Why</h3>
              <p>The product or technical problem this piece solves.</p>
            </article>
            <article>
              <span>03</span>
              <h3>How</h3>
              <p>The exact place it fits inside Niva.</p>
            </article>
          </div>
        </section>

        <section className="section-band" id="architecture">
          <div className="section-heading">
            <p className="eyebrow">Architecture</p>
            <h2>React Native, Firebase, NestJS, and PostgreSQL</h2>
          </div>
          <MermaidDiagram chart={architectureChart} />
          <ArchitectureFlow />
        </section>

        <section className="split-section" id="mobile">
          <div>
            <p className="eyebrow">Mobile</p>
            <h2>React Native Expo replaces Flutter</h2>
          </div>
          <p>
            The mobile app now uses TypeScript, so the mobile client, backend, admin,
            docs, and shared packages can speak the same language.
          </p>
        </section>

        <section className="split-section" id="backend">
          <div>
            <p className="eyebrow">Backend</p>
            <h2>NestJS owns product decisions</h2>
          </div>
          <p>
            Firebase can prove who the user is. NestJS decides what that user can do
            inside Niva and protects PostgreSQL from direct client access.
          </p>
        </section>

        <section className="split-section" id="database">
          <div>
            <p className="eyebrow">Database</p>
            <h2>PostgreSQL is the durable source of truth</h2>
          </div>
          <p>
            User profiles, activities, attendance, host promotion, trust signals, and
            matching data belong in a relational database behind the API.
          </p>
        </section>

        <section className="section-band" id="deployment">
          <div className="section-heading">
            <p className="eyebrow">Deployment</p>
            <h2>Local today, production-ready shape tomorrow</h2>
          </div>
          <div className="timeline">
            <span>Local Expo app</span>
            <span>Local NestJS API</span>
            <span>Managed PostgreSQL</span>
            <span>Firebase Auth project</span>
            <span>EAS builds</span>
          </div>
        </section>

        <section className="section-band">
          <div className="section-heading">
            <p className="eyebrow">Library</p>
            <h2>Searchable handbook entries</h2>
          </div>
          <div className="doc-grid">
            {filteredDocs.map((doc) => (
              <article className="doc-card" key={doc.id}>
                <p>{doc.section}</p>
                <h3>{doc.title}</h3>
                <span>{doc.body}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
