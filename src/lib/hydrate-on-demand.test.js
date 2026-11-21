import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { markFresh } from '@/app/prerender-state';

/** IntersectionObserver stub that never reports an intersection. */
class SilentObserver {
  observe() {}
  disconnect() {}
}

describe('whenNeeded (hydration on demand)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('IntersectionObserver', SilentObserver);
    document.body.innerHTML = '<main><section id="stats">server html</section></main>';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('waits while the prerendered region is in the DOM and off screen', async () => {
    const { whenNeeded } = await import('./hydrate-on-demand');
    const spy = vi.fn();
    whenNeeded('#stats').then(spy);
    await new Promise((r) => setTimeout(r, 20));
    expect(spy).not.toHaveBeenCalled();
  });

  it('resolves when React removes the server markup (no deadlock)', async () => {
    const { whenNeeded } = await import('./hydrate-on-demand');
    const spy = vi.fn();
    const pending = whenNeeded('#stats').then(spy);
    // A state change above an unhydrated boundary: React deletes its HTML
    // and client-renders it, which needs the chunk this promise guards.
    document.querySelector('#stats')?.remove();
    await pending;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('resolves on the first interaction', async () => {
    const { whenNeeded } = await import('./hydrate-on-demand');
    const pending = whenNeeded('#stats');
    window.dispatchEvent(new Event('pointerdown'));
    await expect(pending).resolves.toBeUndefined();
  });
});

describe('markFresh (prerendered query state)', () => {
  it('stamps hydrated queries as fetched now, so they do not refetch on mount', () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000 } } });
    const buildTime = Date.now() - 60 * 60_000; // built an hour ago
    client.setQueryData(['settings', 'ar'], { ok: true }, { updatedAt: buildTime });
    const query = client.getQueryCache().find({ queryKey: ['settings', 'ar'] });
    expect(query?.isStaleByTime(5 * 60_000)).toBe(true);

    markFresh(client);
    expect(query?.state.dataUpdatedAt).toBeGreaterThan(buildTime);
    expect(query?.isStaleByTime(5 * 60_000)).toBe(false);
  });
});
