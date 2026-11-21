import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { paths } from '@/config/routes';
import { useBlogs } from '../hooks/useBlogs';
import { BlogIndex } from './BlogIndex';

const BlogDirector = lazy(() => import('../fx/BlogDirector'));

/** How many notes the home page shows. */
const LATEST = 3;

/**
 * Blog on the home page, the DOCS station: the latest notes as a changelog
 * (`CHANGELOG.md`), with the editorial index and a link to every note. The
 * director writes each title in as it scrolls by (outline → ink).
 */
export default function BlogSection() {
  const { t } = useTranslation();
  const { data } = useBlogs();
  const posts = (data?.data ?? []).slice(0, LATEST);
  if (posts.length === 0) return null;

  return (
    <Section id="blog" className="blog-section">
      <div className="container-fluid blog-section__layout">
        <div className="blog-section__head">
          <SectionHeading
            id="blog-title"
            index={getStation(stationForSection('blog'))?.code}
            eyebrow={<span dir="ltr">{t('blog.changelog')}</span>}
            title={t('sections.blog')}
            description={t('blog.lead')}
          />
          <LocalizedLink to={paths.blog()} className="blog-section__all">
            {t('blog.all')}
            <LineIcon name="arrow" className="blog-section__all-icon" />
          </LocalizedLink>
        </div>
        <BlogIndex posts={posts} headingLevel="h3" />
      </div>
      <SectionFx target="blog">
        <BlogDirector />
      </SectionFx>
    </Section>
  );
}
