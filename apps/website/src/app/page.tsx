'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';

type BetaForm = {
  city: string;
  email: string;
  interest: string;
};

const initialForm: BetaForm = {
  city: 'Bangalore',
  email: '',
  interest: 'Joining gatherings',
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001');

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [form, setForm] = useState<BetaForm>(initialForm);

  const goTo = (sectionId: string) => {
    setMenuOpen(false);
    scrollToSection(sectionId);
  };

  const openBeta = (interest?: BetaForm['interest']) => {
    setForm((value) => ({ ...value, interest: interest ?? value.interest }));
    setSubmitted(false);
    setBetaOpen(true);
  };

  const submitBeta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const company =
      new FormData(event.currentTarget).get('company')?.toString() ?? '';
    setSubmitting(true);
    setFormError(undefined);
    try {
      const response = await fetch(`${apiUrl}/beta/access-requests`, {
        body: JSON.stringify({ ...form, company, consent: true }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await response.text());
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to save this request.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-scrim" />
        <header className="site-header">
          <button
            aria-label="Return to the top of the Niva website"
            className="wordmark"
            onClick={() => scrollToSection('top')}
            type="button"
          >
            niva.
          </button>
          <button
            aria-controls="site-navigation"
            aria-expanded={menuOpen}
            className="menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            Menu
          </button>
          <nav
            aria-label="Main navigation"
            className={menuOpen ? 'site-nav site-nav-open' : 'site-nav'}
            id="site-navigation"
          >
            <button onClick={() => goTo('why-niva')} type="button">
              Why Niva
            </button>
            <button onClick={() => goTo('how-it-works')} type="button">
              How it works
            </button>
            <button onClick={() => goTo('safety')} type="button">
              Safety
            </button>
            <button onClick={() => goTo('hosts')} type="button">
              For hosts
            </button>
          </nav>
        </header>

        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">Closed beta · Bangalore</p>
          <h1 id="hero-title">
            Meet people who will be there <em>next week.</em>
          </h1>
          <p className="hero-description">
            Niva is a women-centred community for turning a good plan into a
            familiar circle. Join small, hosted gatherings. Return to the people
            and interests that feel right.
          </p>
          <div className="hero-actions">
            <button
              className="button button-coral"
              onClick={() => openBeta('Joining gatherings')}
              type="button"
            >
              Request beta access
            </button>
            <button
              className="hero-link"
              onClick={() => goTo('how-it-works')}
              type="button"
            >
              See the member journey <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>

        <div className="hero-status" aria-label="Niva beta principles">
          <p>
            <strong>Small groups</strong>
            <span>Made for conversation.</span>
          </p>
          <p>
            <strong>Hosted plans</strong>
            <span>Clear intent, clear context.</span>
          </p>
          <p>
            <strong>Shared momentum</strong>
            <span>Return when it feels good.</span>
          </p>
        </div>
      </section>

      <section
        className="statement-band"
        id="why-niva"
        aria-labelledby="statement-title"
      >
        <div className="section-shell statement-grid">
          <p className="eyebrow">Not another social feed</p>
          <div>
            <h2 id="statement-title">
              Friendship does better with a place to go.
            </h2>
            <p>
              Niva is designed around the part after the introduction: an
              activity with a real shape, a small group with a reason to talk,
              and a next plan worth coming back for.
            </p>
          </div>
        </div>
      </section>

      <section
        className="section-shell journey"
        id="how-it-works"
        aria-labelledby="journey-title"
      >
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">The member journey</p>
            <h2 id="journey-title">A considered way in. A reason to return.</h2>
          </div>
          <p>
            The beta starts with a limited city, small gatherings, and
            intentional participation. The experience stays focused on
            real-world plans rather than endless scrolling.
          </p>
        </div>
        <ol className="journey-grid">
          <li className="journey-step">
            <p className="step-number">01</p>
            <p className="step-kicker">Set up your place</p>
            <h3>Tell us a little about you.</h3>
            <p>
              Build a member profile, make a self-declaration, and request
              access before you enter a shared space.
            </p>
          </li>
          <li className="journey-step">
            <p className="step-number">02</p>
            <p className="step-kicker">Choose one good plan</p>
            <h3>See what fits your week.</h3>
            <p>
              Browse hosted events and continuing circles by interest,
              neighbourhood, and rhythm. Request to join with context.
            </p>
          </li>
          <li className="journey-step">
            <p className="step-number">03</p>
            <p className="step-kicker">Make continuity easy</p>
            <h3>Return to a familiar room.</h3>
            <p>
              Keep a circle going, find the next gathering, and let repeated
              shared time do the work of building trust.
            </p>
          </li>
        </ol>
      </section>

      <section className="format-section" aria-labelledby="format-title">
        <div
          className="format-image"
          role="img"
          aria-label="A hosted pottery gathering with tea"
        />
        <div className="format-copy">
          <p className="eyebrow">What a Niva plan feels like</p>
          <h2 id="format-title">
            A little structure. Plenty of room to be yourself.
          </h2>
          <p>
            Plans have a host, a place, a clear size, and a practical next step.
            That makes arriving easier, whether it is your first time or the
            fourth time you have met the same people.
          </p>
          <div className="plan-outline">
            <div>
              <span>10:30</span>
              <p>Arrive, settle in, and meet the host.</p>
            </div>
            <div>
              <span>11:00</span>
              <p>Make, move, read, or walk together.</p>
            </div>
            <div>
              <span>12:30</span>
              <p>Leave with a next plan, if you want one.</p>
            </div>
          </div>
          <button
            className="text-link"
            onClick={() => openBeta('Joining gatherings')}
            type="button"
          >
            Request an invite <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <section
        className="section-shell collection-section"
        aria-labelledby="collection-title"
      >
        <div className="section-heading collection-heading">
          <div>
            <p className="eyebrow">Find your entry point</p>
            <h2 id="collection-title">A plan can be a beginning.</h2>
          </div>
          <button
            className="text-link dark-link"
            onClick={() => openBeta('Joining a circle')}
            type="button"
          >
            Join the beta <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="collection-grid">
          <article className="collection-card collection-card-tall">
            <Image
              alt="A woman writing at a shared creative table"
              height={1402}
              src="/images/niva-circle-notes.png"
              width={1122}
            />
            <div>
              <p className="card-label">KEEP GOING</p>
              <h3>Circles that meet again</h3>
              <p>For the slow confidence that comes from familiarity.</p>
            </div>
          </article>
          <article className="collection-card">
            <Image
              alt="Hands holding a handmade ceramic cup"
              height={1402}
              src="/images/niva-gathering-cup.png"
              width={1122}
            />
            <div>
              <p className="card-label">MAKE SOMETHING</p>
              <h3>Workshops and easy evenings</h3>
              <p>
                A shared activity means nobody has to invent a conversation.
              </p>
            </div>
          </article>
          <article className="collection-card">
            <Image
              alt="A welcoming creative studio entrance with plants"
              height={1402}
              src="/images/niva-safe-arrival.png"
              width={1122}
            />
            <div>
              <p className="card-label">STEP OUT</p>
              <h3>Neighbourhood plans</h3>
              <p>
                Small groups with enough context to make the first hello easier.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        className="safety-section"
        id="safety"
        aria-labelledby="safety-title"
      >
        <div className="section-shell safety-grid">
          <div className="safety-intro">
            <p className="eyebrow">Safety is part of the product</p>
            <h2 id="safety-title">Warmth needs boundaries.</h2>
            <p>
              Niva is deliberately smaller and more considered than a public
              social network. That creates a clearer basis for both connection
              and care.
            </p>
          </div>
          <div className="safety-points">
            <article>
              <p className="safety-number">01</p>
              <h3>Access with context</h3>
              <p>
                Members create a profile and request access before joining
                shared activities.
              </p>
            </article>
            <article>
              <p className="safety-number">02</p>
              <h3>Activity-first spaces</h3>
              <p>
                Conversation stays tied to the events and circles people have
                joined. No random direct-message layer.
              </p>
            </article>
            <article>
              <p className="safety-number">03</p>
              <h3>Intentional hosting</h3>
              <p>
                Hosts, member requests, and event details are part of a clear,
                reviewable experience.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="host-section" id="hosts" aria-labelledby="host-title">
        <div className="host-copy">
          <p className="eyebrow">For thoughtful hosts</p>
          <h2 id="host-title">
            Bring your good idea to people who will value it.
          </h2>
          <p>
            Niva is for the person who would host a book circle, walk, game
            night, skill-share, or workshop if there were a better way to gather
            the right room.
          </p>
          <button
            className="button button-outline"
            onClick={() => openBeta('Hosting an activity')}
            type="button"
          >
            Register host interest
          </button>
        </div>
        <div className="host-principles" aria-label="What hosts can expect">
          <div>
            <span>01</span>
            <p>Define the experience: size, tone, location, and rhythm.</p>
          </div>
          <div>
            <span>02</span>
            <p>
              Review requests with enough member context to make a considered
              welcome.
            </p>
          </div>
          <div>
            <span>03</span>
            <p>Offer a clear next step for a group that wants to keep going.</p>
          </div>
        </div>
      </section>

      <section className="faq section-shell" aria-labelledby="faq-title">
        <div className="section-heading">
          <p className="eyebrow">Beta basics</p>
          <h2 id="faq-title">A few practical things.</h2>
        </div>
        <div className="faq-list">
          <details open>
            <summary>Who is Niva for?</summary>
            <p>
              Niva is being shaped for women and women-aligned identities who
              want to make local friendship more possible through shared,
              offline plans.
            </p>
          </details>
          <details>
            <summary>Where is Niva opening first?</summary>
            <p>
              The first closed beta is focused on Bangalore so we can keep the
              community, hosting, and support close to the experience.
            </p>
          </details>
          <details>
            <summary>Is this a dating or open-chat app?</summary>
            <p>
              No. Niva is for friendship and community. The product centres on
              hosted events and circles, not swiping, public feeds, or
              unsolicited direct messages.
            </p>
          </details>
          <details>
            <summary>What does requesting access mean?</summary>
            <p>
              It puts you on the beta list. As Niva opens gatherings, the team
              can invite people in a measured way for the right early
              experience.
            </p>
          </details>
        </div>
      </section>

      <section className="closing-section">
        <div className="section-shell closing-inner">
          <p className="eyebrow">Start with one plan</p>
          <h2>Make room for a friendship routine.</h2>
          <button
            className="button button-coral"
            onClick={() => openBeta('Joining gatherings')}
            type="button"
          >
            Request beta access
          </button>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <p className="footer-brand">niva.</p>
          <p>Small plans. Familiar faces.</p>
        </div>
        <div className="footer-links">
          <button onClick={() => goTo('why-niva')} type="button">
            Why Niva
          </button>
          <button onClick={() => goTo('safety')} type="button">
            Safety
          </button>
          <button onClick={() => goTo('hosts')} type="button">
            Host with us
          </button>
        </div>
        <div className="footer-links">
          <a href="mailto:care@niva.community">Contact care</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/delete-account">Account deletion</a>
        </div>
      </footer>

      {betaOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="beta-title"
            aria-modal="true"
            className="beta-modal"
            role="dialog"
          >
            <button
              aria-label="Close beta interest form"
              className="modal-close"
              onClick={() => setBetaOpen(false)}
              type="button"
            >
              Close
            </button>
            {submitted ? (
              <div className="success-state">
                <p className="eyebrow">Request received</p>
                <h2 id="beta-title">You are on the Niva beta list.</h2>
                <p>
                  Your request is saved securely with Niva. We will use your
                  city and interest only to shape closed-beta invitations.
                </p>
                <button
                  className="button button-coral"
                  onClick={() => setBetaOpen(false)}
                  type="button"
                >
                  Back to Niva
                </button>
              </div>
            ) : (
              <form onSubmit={submitBeta}>
                <label aria-hidden="true" className="honeypot">
                  Company
                  <input autoComplete="off" name="company" tabIndex={-1} />
                </label>
                <p className="eyebrow">Niva closed beta</p>
                <h2 id="beta-title">Request a considered invite.</h2>
                <p className="modal-description">
                  We are starting carefully in Bangalore, with small hosted
                  gatherings and circles. Tell us how you would like to take
                  part.
                </p>
                <label>
                  Email address
                  <input
                    autoComplete="email"
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        email: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={form.email}
                  />
                </label>
                <label>
                  City
                  <select
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        city: event.target.value,
                      }))
                    }
                    value={form.city}
                  >
                    <option>Bangalore</option>
                    <option>Another city</option>
                  </select>
                </label>
                <label>
                  I would like to
                  <select
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        interest: event.target.value,
                      }))
                    }
                    value={form.interest}
                  >
                    <option>Joining gatherings</option>
                    <option>Joining a circle</option>
                    <option>Hosting an activity</option>
                  </select>
                </label>
                <p className="form-consent">
                  By requesting access, you agree that Niva may store these
                  details to contact you about the closed beta. You can ask us
                  to delete them at any time.
                </p>
                {formError ? (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                ) : null}
                <button
                  className="button button-coral"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Saving request...' : 'Request beta access'}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
