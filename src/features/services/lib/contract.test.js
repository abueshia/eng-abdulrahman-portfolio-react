import { describe, expect, it } from 'vitest';

import { endpointPath, groupServices, responseFields } from './contract';

const backend = { slug: 'backend', name: 'Backend' };
const growth = { slug: 'growth', name: 'Growth' };

/**
 * @param {number} id
 * @param {{ slug: string, name: string } | null} group
 * @param {object} [extra]
 */
const service = (id, group, extra = {}) => ({
  id,
  slug: `s-${id}`,
  method: 'POST',
  title: `S${id}`,
  description: '',
  deliverables: ['one', 'two'],
  group,
  ...extra,
});

describe('service contracts', () => {
  it('builds the endpoint path from the slug', () => {
    expect(endpointPath({ slug: 'payment-integration' })).toBe('/services/payment-integration');
  });

  it('groups services in API order, ungrouped ones last', () => {
    const groups = groupServices([
      service(1, backend),
      service(2, growth),
      service(3, backend),
      service(4, null),
    ]);
    expect(groups.map((g) => g.group.slug)).toEqual(['backend', 'growth', 'other']);
    expect(groups[0].services.map((s) => s.id)).toEqual([1, 3]);
  });

  it('describes the 200 response body as ordered fields', () => {
    expect(responseFields(service(1, backend))).toEqual([
      ['service', 's-1'],
      ['deliverables', ['one', 'two']],
    ]);
    expect(responseFields(service(1, backend, { stack: ['Paymob'] })).at(-1)).toEqual([
      'stack',
      ['Paymob'],
    ]);
  });
});
