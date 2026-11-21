import { media, t } from './helpers';

/**
 * GET /settings
 * Profile facts (contact, location, socials, CV) are the owner's real data.
 * Copy will be managed from the Laravel admin once the API is live.
 */
export const settings = {
  general: {
    site_name: t('م. عبدالرحمن أبو عيشة', 'Eng. Abdulrahman Abu Eisha'),
    owner_name: t('عبدالرحمن أبو عيشة', 'Abdulrahman Abu Eisha'),
    first_name: t('عبدالرحمن', 'Abdulrahman'),
    last_name: t('أبو عيشة', 'Abu Eisha'),
    job_title: t('مهندس برمجيات Full-Stack', 'Full-Stack Software Engineer'),
    // Secondary title (owner-provided): the company the owner runs.
    company: {
      name: 'iCode Tech',
      role: t('الرئيس التنفيذي', 'CEO'),
    },
    years_of_experience: 4,
    // Transparent cutout: lets the head break out of the hero frame.
    avatar: media('profile-cutout.png'),
    // One CV for both languages (owner decision).
    cv_url: '/cv/Abdulrahman_abu_eisha_CV.pdf',
    email: 'rm01062293490@gmail.com',
    phone: '+201028292449',
    location: t('القاهرة، حدائق الأهرام', 'Hadayek El Ahram, Cairo, Egypt'),
    timezone: 'Africa/Cairo',
    available_for_work: true,
    socials: [
      { platform: 'github', label: 'GitHub', url: 'https://github.com/abueshia' },
      {
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/eng-abdulrahman-abu-eisha/',
      },
      {
        platform: 'facebook',
        label: 'Facebook',
        url: 'https://www.facebook.com/abdo.saad.35762241',
      },
      { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/201028292449' },
    ],
  },
  seo: {
    meta_title: t(
      'م. عبدالرحمن أبو عيشة | مهندس برمجيات Full-Stack',
      'Eng. Abdulrahman Abu Eisha | Full-Stack Software Engineer',
    ),
    meta_description: t(
      'مهندس برمجيات Full-Stack بخبرة +4 سنوات في PHP 8.3 وLaravel وReact وبناء أنظمة نظيفة قابلة للتوسع.',
      'Full-Stack Software Engineer with 4+ years building clean, scalable systems with PHP 8.3, Laravel and React.',
    ),
    keywords: t(
      'مهندس برمجيات, Laravel, React, PHP, Full-Stack, REST API',
      'Software Engineer, Laravel, React, PHP, Full-Stack, REST API',
    ),
    og_image: media('og-cover.jpg'),
  },
  sections_visibility: {
    hero: true,
    stats: true,
    about: true,
    skills: true,
    experience: true,
    projects: true,
    services: true,
    // Hidden until they hold real content (also excluded from nav + prerender).
    credentials: false,
    testimonials: false,
    blog: false,
    faq: true,
    contact: true,
  },
  hero: {
    eyebrow: t('متاح لمشاريع جديدة', 'Available for new projects'),
    roles: t(
      ['مهندس برمجيات Full-Stack', 'مهندس Laravel', 'مطوّر React'],
      ['Full-Stack Software Engineer', 'Laravel Architect', 'React Craftsman'],
    ),
    summary: t(
      'أبني أنظمة خلفية متينة وواجهات دقيقة التفاصيل: من تصميم الـ API ومعمارية الخدمات حتى آخر micro-interaction يراها المستخدم.',
      'I build robust back-end systems and meticulously crafted interfaces: from API design and service architecture down to the last micro-interaction a user feels.',
    ),
    terminal_stack_command: 'php artisan engineer:profile --stack',
    terminal_stack: [
      { key: 'backend', value: 'PHP 8.3 · Laravel 12 · REST' },
      { key: 'frontend', value: 'React 19 · JavaScript ES2024 · Tailwind' },
      { key: 'data', value: 'MySQL · PostgreSQL · Redis' },
      { key: 'craft', value: 'Clean Architecture · SOLID · TDD' },
    ],
    badges: ['PHP 8.3', 'Laravel', 'React', 'REST API', 'SOLID', 'MySQL'],
  },
  about: {
    title: t('أكتب كوداً يعيش أطول من المشروع.', 'I write code that outlives the project.'),
    story: t(
      [
        'بدأت رحلتي بفضول تجاه كيف تتحدث الأنظمة مع بعضها، وتحوّل هذا الفضول إلى أكثر من أربع سنوات في بناء تطبيقات ويب كاملة، من قواعد البيانات حتى الواجهة.',
        'أؤمن أن المعمارية الجيدة ليست رفاهية: الفصل الواضح بين الطبقات، ومبادئ SOLID، والاختبارات، هي ما يجعل الفريق يتحرك بسرعة بعد سنة وليس فقط في الأسبوع الأول.',
        'أعمل اليوم على أنظمة Laravel قابلة للتوسع وواجهات React سريعة، وأهتم بالتفاصيل التي لا يراها أحد حتى تختفي.',
      ],
      [
        'My journey started with curiosity about how systems talk to each other, and that curiosity turned into 4+ years of building complete web applications, from the database to the pixel.',
        'I believe good architecture is not a luxury: clear layer boundaries, SOLID principles and tests are what let a team move fast a year later, not just in week one.',
        'Today I build scalable Laravel systems and fast React interfaces, and I care about the details nobody notices until they are missing.',
      ],
    ),
    principles: [
      {
        key: 'architecture',
        title: t('معمارية نظيفة', 'Clean Architecture'),
        description: t(
          'حدود واضحة بين الـ domain والبنية التحتية، فيبقى منطق العمل قابلاً للاختبار والتغيير.',
          'Clear boundaries between domain and infrastructure keep business logic testable and changeable.',
        ),
      },
      {
        key: 'solid',
        title: t('مبادئ SOLID', 'SOLID by default'),
        description: t(
          'كلاسات صغيرة بمسؤولية واحدة، واعتماد على الواجهات لا على التفاصيل.',
          'Small classes with a single responsibility, depending on abstractions rather than details.',
        ),
      },
      {
        key: 'tests',
        title: t('الاختبارات أولاً', 'Tests as a safety net'),
        description: t(
          'Feature وUnit tests تجعل إعادة الهيكلة قراراً آمناً وليس مخاطرة.',
          'Feature and unit tests turn refactoring into a safe decision instead of a gamble.',
        ),
      },
    ],
  },
  contact: {
    title: t('لنبنِ شيئاً متيناً معاً.', "Let's build something robust."),
    subtitle: t(
      'أخبرني عن فكرتك أو التحدي التقني الذي تواجهه، وسأرد خلال 24 ساعة.',
      "Tell me about your idea or the technical challenge you're facing. I reply within 24 hours.",
    ),
    email: 'rm01062293490@gmail.com',
    phone: '+201028292449',
    project_types: [
      { value: 'web_app', label: t('تطبيق ويب متكامل', 'Full web application') },
      { value: 'api', label: t('تصميم وبناء API', 'API design & development') },
      { value: 'frontend', label: t('واجهة React', 'React front-end') },
      { value: 'consulting', label: t('استشارة تقنية', 'Technical consulting') },
      { value: 'other', label: t('أخرى', 'Other') },
    ],
  },
  cta: {
    title: t('لديك مشروع يستحق أن يُبنى بإتقان؟', 'Have a project that deserves to be built right?'),
    subtitle: t(
      'من الفكرة إلى الإنتاج، بمعمارية تصمد أمام النمو.',
      'From idea to production, with architecture that survives growth.',
    ),
    button_text: t('ابدأ مشروعك', 'Start a project'),
  },
};
