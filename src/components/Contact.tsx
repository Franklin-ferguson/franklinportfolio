import { useState } from 'react';
import { contact, person } from '../content';
import { Icon } from './Icon';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${person.email}`;
    }
  }
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title" data-dark>
      <div className="container">
        <div className="contact__grid">
          <div data-reveal>
            <p className="eyebrow" data-r>Contact</p>
            <h2 id="contact-title" className="h1" data-r>{contact.title}</h2>
            <p className="body-lg contact__body" data-r>{contact.body}</p>
            <div className="contact__actions" data-r>
              <a className="btn btn--accent btn--large" href={`mailto:${person.email}`}>
                <Icon name="mail" />
                <span>Email me</span>
              </a>
              <a className="btn btn--ghost btn--large" href={person.cv} download>
                <Icon name="download" />
                <span>Download CV (PDF)</span>
              </a>
            </div>
          </div>
          <ul className="channels" data-reveal>
            <li data-r>
              <span className="channels__label">Email</span>
              <span className="channels__row">
                <a href={`mailto:${person.email}`}>{person.email}</a>
                <button type="button" className="icon-btn" onClick={copy} aria-label={copied ? 'Email address copied' : 'Copy email address'}>
                  <Icon name={copied ? 'check' : 'copy'} size={16} />
                </button>
              </span>
              <span className="sr-only" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
            </li>
            <li data-r>
              <span className="channels__label">Phone</span>
              <a href={person.phoneHref}>{person.phone}</a>
            </li>
            <li data-r>
              <span className="channels__label">GitHub</span>
              <a href={person.github} target="_blank" rel="noopener">github.com/Franklin-ferguson<span className="sr-only"> (opens in a new tab)</span></a>
            </li>
            {person.linkedin ? (
              <li data-r>
                <span className="channels__label">LinkedIn</span>
                <a href={person.linkedin} target="_blank" rel="noopener">LinkedIn profile</a>
              </li>
            ) : null}
            <li data-r>
              <span className="channels__label">Based in</span>
              <span>{person.location}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
