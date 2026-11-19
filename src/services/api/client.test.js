import { describe, expect, it } from 'vitest';

import { unwrap } from './client';
import { ApiError, toApiError } from './errors';

describe('API envelope unwrapping & error normalisation', () => {
  it('unwraps a standard Laravel success envelope with optional pagination', async () => {
    const pagination = { current_page: 1, per_page: 12, total: 6, last_page: 1 };
    const response = Promise.resolve({
      status: 200,
      data: {
        code: 200,
        success: true,
        message: 'Projects retrieved.',
        data: [{ slug: 'nexus' }],
        pagination,
      },
    });

    const result = await unwrap(response);

    expect(result).toEqual({
      data: [{ slug: 'nexus' }],
      message: 'Projects retrieved.',
      code: 200,
      pagination,
    });
  });

  it('throws ApiError when envelope reports success: false even on HTTP 200', async () => {
    const response = Promise.resolve({
      status: 200,
      data: {
        code: 404,
        success: false,
        message: 'Resource not found.',
        data: null,
      },
    });

    await expect(unwrap(response)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Resource not found.',
      isNotFound: true,
    });
  });

  it('throws ApiError when response body does not follow the envelope contract', async () => {
    const malformed = Promise.resolve({ status: 200, data: { hello: 'world' } });

    await expect(unwrap(malformed)).rejects.toThrow(ApiError);
    await expect(unwrap(malformed)).rejects.toMatchObject({
      message: 'Malformed API response',
    });
  });

  it('normalises 422 validation errors and network failures into ApiError', () => {
    const validationErr = toApiError({
      response: {
        status: 422,
        data: {
          message: 'The given data was invalid.',
          errors: { email: ['Invalid email'] },
        },
      },
    });
    expect(validationErr).toBeInstanceOf(ApiError);
    expect(validationErr.isValidation).toBe(true);
    expect(validationErr.errors).toEqual({ email: ['Invalid email'] });

    const networkErr = toApiError(new Error('Network Error'));
    expect(networkErr.isNetwork).toBe(true);
    expect(networkErr.status).toBe(0);
  });
});
