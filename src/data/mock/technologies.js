import { t } from './helpers';

/**
 * Technology catalogue. `GET /technologies` returns it grouped by category.
 * `proficiency` is 0-100; `icon` is a Simple Icons key resolved by the UI.
 */
export const technologyCategories = [
  { slug: 'backend', name: t('الباك إند', 'Backend'), sort: 1 },
  { slug: 'frontend', name: t('الفرونت إند', 'Frontend'), sort: 2 },
  { slug: 'database', name: t('قواعد البيانات', 'Database'), sort: 3 },
  { slug: 'devops', name: t('DevOps والأدوات', 'DevOps & Tooling'), sort: 4 },
  { slug: 'architecture', name: t('المعمارية والممارسات', 'Architecture & Practices'), sort: 5 },
];

export const technologies = [
  { slug: 'php', name: 'PHP 8.3', category: 'backend', icon: 'php', proficiency: 95, years: 4 },
  {
    slug: 'laravel',
    name: 'Laravel',
    category: 'backend',
    icon: 'laravel',
    proficiency: 95,
    years: 4,
  },
  {
    slug: 'rest-api',
    name: 'REST APIs',
    category: 'backend',
    icon: 'openapi',
    proficiency: 92,
    years: 4,
  },
  {
    slug: 'sanctum',
    name: 'Sanctum / Passport',
    category: 'backend',
    icon: 'laravel',
    proficiency: 85,
    years: 3,
  },
  {
    slug: 'queues',
    name: 'Queues & Jobs',
    category: 'backend',
    icon: 'laravel',
    proficiency: 82,
    years: 3,
  },
  {
    slug: 'pest',
    name: 'PHPUnit / Pest',
    category: 'backend',
    icon: 'php',
    proficiency: 80,
    years: 3,
  },

  { slug: 'react', name: 'React', category: 'frontend', icon: 'react', proficiency: 90, years: 3 },
  {
    slug: 'javascript',
    name: 'JavaScript ES6+',
    category: 'frontend',
    icon: 'javascript',
    proficiency: 92,
    years: 4,
  },
  {
    slug: 'typescript',
    name: 'TypeScript',
    category: 'frontend',
    icon: 'typescript',
    proficiency: 72,
    years: 2,
  },
  {
    slug: 'tailwind',
    name: 'Tailwind CSS',
    category: 'frontend',
    icon: 'tailwindcss',
    proficiency: 90,
    years: 3,
  },
  { slug: 'vite', name: 'Vite', category: 'frontend', icon: 'vite', proficiency: 85, years: 2 },
  {
    slug: 'livewire',
    name: 'Livewire / Blade',
    category: 'frontend',
    icon: 'livewire',
    proficiency: 82,
    years: 3,
  },

  { slug: 'mysql', name: 'MySQL', category: 'database', icon: 'mysql', proficiency: 90, years: 4 },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    icon: 'postgresql',
    proficiency: 75,
    years: 2,
  },
  { slug: 'redis', name: 'Redis', category: 'database', icon: 'redis', proficiency: 78, years: 3 },
  {
    slug: 'eloquent',
    name: 'Eloquent ORM',
    category: 'database',
    icon: 'laravel',
    proficiency: 94,
    years: 4,
  },

  { slug: 'git', name: 'Git & GitHub', category: 'devops', icon: 'git', proficiency: 90, years: 4 },
  { slug: 'docker', name: 'Docker', category: 'devops', icon: 'docker', proficiency: 72, years: 2 },
  {
    slug: 'linux',
    name: 'Linux / Nginx',
    category: 'devops',
    icon: 'linux',
    proficiency: 75,
    years: 3,
  },
  {
    slug: 'ci-cd',
    name: 'CI/CD (GitHub Actions)',
    category: 'devops',
    icon: 'githubactions',
    proficiency: 70,
    years: 2,
  },

  {
    slug: 'clean-architecture',
    name: 'Clean Architecture',
    category: 'architecture',
    icon: 'architecture',
    proficiency: 88,
    years: 3,
  },
  {
    slug: 'solid',
    name: 'SOLID',
    category: 'architecture',
    icon: 'solid',
    proficiency: 92,
    years: 4,
  },
  {
    slug: 'design-patterns',
    name: 'Design Patterns',
    category: 'architecture',
    icon: 'patterns',
    proficiency: 85,
    years: 3,
  },
  { slug: 'tdd', name: 'TDD', category: 'architecture', icon: 'tests', proficiency: 78, years: 2 },
];
