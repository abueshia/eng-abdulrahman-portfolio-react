import { RouterProvider } from 'react-router-dom';

import { AppProviders } from './providers/AppProviders';

/**
 * Application root: global providers around the router.
 * @param {{
 *   router: import('react-router-dom').DataRouter,
 *   queryClient?: import('@tanstack/react-query').QueryClient,
 * }} props
 */
export default function App({ router, queryClient }) {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
