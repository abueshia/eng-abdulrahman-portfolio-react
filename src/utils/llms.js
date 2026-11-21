/**
 * `/llms.txt` builder (https://llmstxt.org): a short, factual Markdown brief
 * of who the site is about, what they offer and where the pages are, so AI
 * answer engines can describe and cite the owner accurately (GEO).
 *
 * Pure: built by the prerenderer from the same API data as the pages, so it
 * never drifts from what the site says. Only facts present in that data are
 * written; nothing is invented here.
 */

/**
 * @typedef {Object} LocaleData
 * @property {any} settings  GET /settings `data`.
 * @property {any[]} services GET /services `data`.
 * @property {any[]} faqs     GET /faqs `data` (empty when the FAQ is hidden).
 * @property {any[]} projects GET /projects `data`.
 */

/**
 * @param {string} text
 * @returns {string} One line, Markdown-safe enough for list items.
 */
const line = (text) =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @param {{ siteUrl: string, en: LocaleData, ar: LocaleData }} input
 * @returns {string}
 */
export function buildLlmsTxt({ siteUrl, en, ar }) {
  const general = en.settings?.general ?? {};
  const generalAr = ar.settings?.general ?? {};
  const visible = en.settings?.sections_visibility ?? {};
  const company = general.company?.name ? general.company : null;
  const city = general.address?.locality;
  const country = general.address?.country;
  const years = general.years_of_experience;

  const facts = [
    `${general.owner_name} (${generalAr.owner_name}) is a ${general.job_title}`,
    city && country ? ` based in ${city}, ${country}` : '',
    years ? `, with ${years} years of experience` : '',
    company ? `, and ${company.role} of ${company.name}` : '',
    '.',
  ].join('');

  const out = [`# ${general.site_name} · ${generalAr.site_name}`, '', `> ${line(facts)}`, ''];
  if (en.settings?.hero?.summary) out.push(line(en.settings.hero.summary), '');
  if (ar.settings?.hero?.summary) out.push(line(ar.settings.hero.summary), '');

  out.push('## Identity', '');
  out.push(`- Name: ${general.owner_name} · ${generalAr.owner_name}`);
  if (general.alternate_names?.length) {
    out.push(`- Also written as: ${general.alternate_names.join(', ')}`);
  }
  out.push(`- Title: ${general.job_title}${company ? `; ${company.role}, ${company.name}` : ''}`);
  if (city && country) out.push(`- Location: ${city}, ${country} (time zone ${general.timezone})`);
  if (general.area_served?.length)
    out.push(`- Works with clients in: ${general.area_served.join(', ')}`);
  out.push('- Languages: Arabic, English', '');

  out.push('## Pages', '');
  out.push(
    `- [Home, English](${siteUrl}/en): profile, skills, experience, services, FAQ and contact`,
  );
  out.push(`- [الرئيسية، عربي](${siteUrl}/): the same content in Arabic (default language)`);
  const real = en.projects.filter((project) => !project.is_sample);
  for (const project of real) {
    out.push(
      `- [${line(project.title)}](${siteUrl}/en/projects/${project.slug}): ${line(project.summary)}`,
    );
  }
  out.push('');

  if (visible.services !== false && en.services.length > 0) {
    out.push('## Services', '');
    for (const service of en.services) {
      const group = service.group?.name ? `${service.group.name}: ` : '';
      out.push(`- ${group}${line(service.title)}. ${line(service.description)}`);
    }
    out.push('');
  }

  if (visible.faq !== false && en.faqs.length > 0) {
    out.push('## FAQ', '');
    for (const faq of en.faqs) out.push(`- ${line(faq.question)} ${line(faq.answer)}`);
    out.push('');
  }

  const profiles = (general.socials ?? []).filter(
    (/** @type {any} */ s) => !['whatsapp', 'email', 'phone'].includes(s.platform),
  );
  if (profiles.length > 0) {
    out.push('## Profiles', '');
    for (const social of profiles) out.push(`- [${social.label}](${social.url})`);
    out.push('');
  }

  out.push('## Contact', '');
  out.push(`- [Contact form and direct channels](${siteUrl}/en#contact)`);
  if (general.cv_url) out.push(`- [CV (PDF)](${new URL(general.cv_url, `${siteUrl}/`).href})`);
  out.push('');

  return `${out.join('\n').trimEnd()}\n`;
}
