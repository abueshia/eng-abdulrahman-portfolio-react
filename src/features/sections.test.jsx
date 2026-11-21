/**
 * Behaviour and accessibility of the home sections that have no dedicated
 * suite: each renders from the mock API exactly as on the page.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Footer from '@/components/layout/Footer';
import AboutSection from '@/features/about/components/AboutSection';
import ExperienceSection from '@/features/experience/components/ExperienceSection';
import ProjectsSection from '@/features/projects/components/ProjectsSection';
import ServicesSection from '@/features/services/components/ServicesSection';
import SkillsSection from '@/features/skills/components/SkillsSection';
import StatsSection from '@/features/stats/components/StatsSection';
import TestimonialsSection from '@/features/testimonials/components/TestimonialsSection';
import { renderWithProviders } from '@/test/renderWithProviders';

const EN = { initialEntries: ['/en'] };

describe('Stats (observability)', () => {
  it('shows the real figure as text and never turns sample zeros into numbers', async () => {
    const { container } = renderWithProviders(<StatsSection />, EN);
    expect((await screen.findAllByText('No data')).length).toBeGreaterThan(0);
    expect(container.querySelector('#stats')).toHaveTextContent('4');
  });
});

describe('About (auth)', () => {
  it('renders the quote as the heading, the titles, the story and the other spellings', async () => {
    renderWithProviders(<AboutSection />, EN);
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'I write code that outlives the project.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Software Engineer')).toBeInTheDocument();
    expect(screen.getAllByText(/iCode Tech/).length).toBeGreaterThan(0);
    expect(screen.getByText(/I work from Cairo and collaborate remotely/)).toBeInTheDocument();
    const aka = screen.getByText('Also written as:').closest('p');
    expect(aka).toHaveTextContent('Abdelrahman Abu Eisha');
    expect(aka).toHaveTextContent('عبد الرحمن أبو عيشة');
  });
});

describe('Skills (services)', () => {
  it('is a WAI-ARIA tab set with roving focus, arrows mirrored in RTL', async () => {
    const { user } = renderWithProviders(<SkillsSection />); // Arabic, RTL
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(1);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');

    tabs[0].focus();
    await user.keyboard('{ArrowLeft}'); // forward in RTL
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();
    await user.keyboard('{End}');
    expect(tabs.at(-1)).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // Every panel is in the DOM (inactive ones hidden), with real meters.
    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBe(tabs.length);
    expect(screen.getAllByRole('meter', { hidden: true }).length).toBeGreaterThan(5);
  });
});

describe('Experience (queue)', () => {
  it('renders every role as a commit with its achievements', async () => {
    const { container } = renderWithProviders(<ExperienceSection />, EN);
    await screen.findAllByText(/Sample Company/);
    const commits = container.querySelectorAll('#experience article');
    expect(commits.length).toBeGreaterThan(1);
    expect(container.querySelector('#experience')).toHaveTextContent('Sample Company');
  });
});

describe('Projects (database)', () => {
  it('lists every case file as an article linking to its case study, flagged as sample', async () => {
    const { container } = renderWithProviders(<ProjectsSection />, EN);
    await screen.findAllByText('Sample');
    const files = container.querySelectorAll('#projects article');
    expect(files).toHaveLength(3);
    const first = within(/** @type {HTMLElement} */ (files[0]));
    expect(first.getByRole('link', { name: /.+/ }).getAttribute('href')).toMatch(
      /^\/en\/projects\//,
    );
    expect(screen.getAllByText('Sample').length).toBeGreaterThan(0);
  });

  it('filters with pressed toggle buttons and announces the result', async () => {
    const { user } = renderWithProviders(<ProjectsSection />, EN);
    const chips = await screen.findAllByRole('button', { pressed: false });
    await user.click(chips[0]);
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/\d/);
  });
});

describe('Services (endpoints)', () => {
  it('renders all 14 contracts as native disclosures with their text in the DOM', async () => {
    const { container } = renderWithProviders(<ServicesSection />, EN);
    await screen.findByText(/Laravel REST API development/);
    const contracts = container.querySelectorAll('details');
    expect(contracts).toHaveLength(14);
    expect(container).toHaveTextContent('Payment gateway integration in Egypt and worldwide');
    expect(container).toHaveTextContent('Laravel REST API development');
  });
});

describe('Testimonials (review)', () => {
  it('is a labelled carousel of sample reviews, each a labelled slide', async () => {
    renderWithProviders(<TestimonialsSection />, EN);
    const regions = await screen.findAllByRole('region');
    const carousel = /** @type {HTMLElement} */ (
      regions.find((region) => region.getAttribute('aria-roledescription') === 'carousel')
    );
    expect(carousel).toBeDefined();
    const slides = within(carousel).getAllByRole('group');
    expect(slides).toHaveLength(4);
    slides.forEach((slide) => expect(slide).toHaveAttribute('aria-roledescription', 'slide'));
    expect(screen.getAllByText('Sample').length).toBeGreaterThan(0);
  });
});

describe('Footer (build signature)', () => {
  it('links only the visible sections and signs the build', async () => {
    renderWithProviders(<Footer />, EN);
    const nav = await screen.findByRole('navigation');
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs.some((href) => href?.includes('#services'))).toBe(true);
    expect(hrefs.some((href) => href?.includes('credentials'))).toBe(false);
    expect(hrefs.some((href) => href?.includes('blog'))).toBe(false);
    expect(screen.getByText(/commit/)).toBeInTheDocument();
  });
});
