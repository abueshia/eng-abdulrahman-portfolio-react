import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Seo } from '@/components/ui/Seo';
import { useFaqs } from '@/features/faq/hooks/useFaqs';
import { useServices } from '@/features/services/hooks/useServices';
import { useLocale } from '@/hooks/useLocale';
import { useSettings } from '@/hooks/useSettings';
import { Hero } from '@/features/hero/components/Hero';
import { HeroFx } from '@/features/hero/components/HeroFx';
import { buildHomeJsonLd } from '@/utils/structured-data';
import { PlaceholderSection } from './home/PlaceholderSection';

/*
 * Real sections are separate chunks: they are fully prerendered (the
 * prerenderer waits for them) and hydrate as soon as their chunk arrives, so
 * their markup code never weighs on the initial bundle. Their motion layers
 * load later still, only near the viewport (SectionFx).
 */
const SECTION_COMPONENTS = {
  stats: lazy(() => import('@/features/stats/components/StatsSection')),
  about: lazy(() => import('@/features/about/components/AboutSection')),
  skills: lazy(() => import('@/features/skills/components/SkillsSection')),
  experience: lazy(() => import('@/features/experience/components/ExperienceSection')),
  projects: lazy(() => import('@/features/projects/components/ProjectsSection')),
  services: lazy(() => import('@/features/services/components/ServicesSection')),
  testimonials: lazy(() => import('@/features/testimonials/components/TestimonialsSection')),
  blog: lazy(() => import('@/features/blog/components/BlogSection')),
  faq: lazy(() => import('@/features/faq/components/FaqSection')),
  contact: lazy(() => import('@/features/contact/components/ContactSection')),
};

/** Section order and the phase in which each real section lands. */
const SECTIONS = [
  { id: 'stats', phase: 3 },
  { id: 'about', phase: 3 },
  { id: 'skills', phase: 3 },
  { id: 'experience', phase: 3 },
  { id: 'projects', phase: 4 },
  { id: 'services', phase: 4 },
  { id: 'credentials', phase: 4 },
  { id: 'testimonials', phase: 5 },
  { id: 'blog', phase: 5 },
  { id: 'faq', phase: 5 },
  { id: 'contact', phase: 5 },
];

/**
 * Home page: the journey. The hero is the Gateway; every visible section
 * follows in order (each carries its journey station, see config/journey.js).
 * `HeroFx` adds the client-only motion layers once the page is idle.
 */
export default function HomePage() {
  const { data } = useSettings();
  const { locale } = useLocale();
  const seo = data?.data?.seo;
  const general = data?.data?.general;
  const { t } = useTranslation();
  const { data: services } = useServices();
  const { data: faqs } = useFaqs();
  const faqVisible = data?.data?.sections_visibility?.faq !== false;
  const catalogName = t('sections.services');
  const jsonLd = useMemo(
    () =>
      buildHomeJsonLd(general, locale, {
        services: services?.data ?? [],
        catalogName,
        faqs: faqVisible ? (faqs?.data ?? []) : [],
      }),
    [general, locale, services, catalogName, faqs, faqVisible],
  );

  return (
    <>
      <Seo
        description={seo?.meta_description}
        image={seo?.og_image}
        type="profile"
        jsonLd={jsonLd}
      />
      <Hero />
      <HeroFx />
      {SECTIONS.map(({ id, phase }, i) => {
        const Real = SECTION_COMPONENTS[/** @type {keyof typeof SECTION_COMPONENTS} */ (id)];
        if (Real) {
          return (
            <Suspense key={id} fallback={null}>
              <Real />
            </Suspense>
          );
        }
        return <PlaceholderSection key={id} id={id} index={i + 1} phase={phase} />;
      })}
    </>
  );
}
