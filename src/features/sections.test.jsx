/**
 * Behaviour and accessibility of the home sections that have no dedicated
 * suite: each renders exactly as on the page, the static ones from the mock
 * data, the live ones from the real captured API responses (docs/api-fixtures).
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
import experiencesEn from '../../docs/api-fixtures/experiences.index.en.json';
import projectsEn from '../../docs/api-fixtures/projects.index.per_page50.en.json';
import testimonialsEn from '../../docs/api-fixtures/testimonials.index.en.json';

const EN = { initialEntries: ['/en'] };

describe('Stats (observability)', () => {
  it('shows the real figures as text with odometers and sparklines', async () => {
    const { container } = renderWithProviders(<StatsSection />, EN);
    await screen.findByText('Projects shipped');
    const statsEl = container.querySelector('#stats');
    expect(statsEl).toHaveTextContent('4');
    expect(statsEl).toHaveTextContent('52');
    expect(statsEl).toHaveTextContent('36');
    expect(statsEl).toHaveTextContent('99.9');
  });
});

describe('About (auth)', () => {
  it('renders the quote as the heading, the titles and the story', async () => {
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
    expect(screen.getByText('About the Engineer')).toBeInTheDocument();
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
  it('renders every API role as a commit with its achievements as diff lines', async () => {
    const { container } = renderWithProviders(<ExperienceSection />, EN);
    await screen.findAllByText(/Matrix Clouds/);
    const commits = container.querySelectorAll('#experience article');
    expect(commits).toHaveLength(experiencesEn.data.length);
    const section = /** @type {HTMLElement} */ (container.querySelector('#experience'));
    expect(section).toHaveTextContent('iCode Tech');
    // Achievements: one `+` line per item of the API's newline-separated text.
    const expected = experiencesEn.data.reduce(
      (sum, item) => sum + item.achievements.split('\n').filter((line) => line.trim()).length,
      0,
    );
    expect(section.querySelectorAll('.gl__add')).toHaveLength(expected);
    // The API's localised employment label, and an open end for current roles.
    expect(section).toHaveTextContent('Full-Time');
    expect(within(section).getAllByText('present')).toHaveLength(2);
  });
});

describe('Projects (database)', () => {
  it('shows three API case files on the home page and links to every project', async () => {
    const { container } = renderWithProviders(<ProjectsSection />, EN);
    await screen.findByText(projectsEn.data[0].title);
    const files = container.querySelectorAll('#projects article');
    // No project is featured yet: topped up with the API's first three.
    expect(files).toHaveLength(3);
    const first = within(/** @type {HTMLElement} */ (files[0]));
    expect(first.getByRole('link', { name: /.+/ }).getAttribute('href')).toBe(
      `/en/projects/${projectsEn.data[0].slug}`,
    );
    expect(screen.getByRole('link', { name: 'View all projects' })).toHaveAttribute(
      'href',
      '/en/projects',
    );
    expect(screen.queryByRole('button', { pressed: false })).toBeNull();
    expect(container.querySelector('.sample-badge')).toBeNull();
    expect(container).not.toHaveTextContent(/\bSample\b/);
  });

  it('lists every API project on /projects with the type facet', async () => {
    const { container } = renderWithProviders(<ProjectsSection variant="index" />, EN);
    await screen.findByText(projectsEn.data[0].title);
    expect(container.querySelectorAll('#projects article')).toHaveLength(projectsEn.data.length);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/.+/);
    // The type facet shows the API's localised labels.
    expect(screen.getAllByText(projectsEn.data[0].project_type_label).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'View all projects' })).toBeNull();
  });

  it('filters with pressed toggle buttons and announces the result', async () => {
    const { user } = renderWithProviders(<ProjectsSection variant="index" />, EN);
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
  it('is a labelled carousel of the approved API reviews, each a labelled slide', async () => {
    renderWithProviders(<TestimonialsSection />, EN);
    const regions = await screen.findAllByRole('region');
    const carousel = /** @type {HTMLElement} */ (
      regions.find((region) => region.getAttribute('aria-roledescription') === 'carousel')
    );
    expect(carousel).toBeDefined();
    const slides = within(carousel).getAllByRole('group');
    expect(slides).toHaveLength(testimonialsEn.data.length);
    slides.forEach((slide) => expect(slide).toHaveAttribute('aria-roledescription', 'slide'));
    expect(screen.queryByText('Sample')).toBeNull();
    // Featured reviews are marked; a linked published project is a link.
    const featured = testimonialsEn.data.filter((item) => item.is_featured).length;
    expect(screen.getAllByText('Featured review')).toHaveLength(featured);
    const linked = testimonialsEn.data.find((item) => item.project);
    expect(screen.getByRole('link', { name: linked?.project?.title })).toHaveAttribute(
      'href',
      `/en/projects/${linked?.project?.slug}`,
    );
    // No photo in the API (avatar: null): every card shows the generated monogram.
    expect(document.querySelectorAll('.review .avatar--photo')).toHaveLength(0);
    expect(document.querySelectorAll('.review .avatar__letters')).toHaveLength(slides.length);
    // Stars are one named image per card; the monogram is decorative.
    slides.forEach((slide) =>
      expect(
        within(slide).getByRole('img', { name: /^Rated [1-5] out of 5$/ }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Write a review' })).toBeInTheDocument();
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
