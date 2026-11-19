import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RootLayout } from '@/components/layout/RootLayout';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config/routes';
import { LocaleProvider } from '@/context/LocaleContext';
import { RouteError } from './RouteError';

// Route-level code splitting: each page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProjectDetailsPage = lazy(() => import('@/pages/ProjectDetailsPage'));
const BlogListPage = lazy(() => import('@/pages/BlogListPage'));
const BlogDetailsPage = lazy(() => import('@/pages/BlogDetailsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Page routes, shared by every locale tree. */
const pageRoutes = () => [
  { index: true, element: <HomePage /> },
  { path: 'projects/:slug', element: <ProjectDetailsPage /> },
  { path: 'blog', element: <BlogListPage /> },
  { path: 'blog/:slug', element: <BlogDetailsPage /> },
  { path: '*', element: <NotFoundPage /> },
];

/**
 * Route table. The default locale (Arabic) is served from the root, every
 * other locale under its prefix (`/en/...`). Same pages, distinct URLs.
 */
export const routes = [
  {
    path: '/',
    element: (
      <LocaleProvider>
        <RootLayout />
      </LocaleProvider>
    ),
    errorElement: <RouteError />,
    children: [
      ...SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
        path: locale,
        children: pageRoutes(),
      })),
      ...pageRoutes(),
    ],
  },
];

/**
 * Creates the browser router. A factory (not a module-level instance) so it
 * reads `window.location` only after `main.jsx` has applied the saved-locale
 * rewrite, and so the route table stays importable during prerendering.
 */
export const createAppRouter = () => createBrowserRouter(routes);
