/**
 * Public surface of the data-access layer. Features import services from here
 * and never talk to axios or mock data directly.
 */
export { ApiError } from './errors';
export { settingsService } from './settings.service';
export { homeService } from './home.service';
export { projectsService } from './projects.service';
export { technologiesService } from './technologies.service';
export { experiencesService } from './experiences.service';
export { credentialsService } from './credentials.service';
export { servicesService } from './services.service';
export { testimonialsService } from './testimonials.service';
export { blogsService } from './blogs.service';
export { faqsService } from './faqs.service';
export { statsService } from './stats.service';
export { contactService } from './contact.service';
