import { describe, expect, it } from 'vitest';

import { initials, isApproved, plainText, safeAvatarUrl } from './avatar';
import { AVATAR_MAX_BYTES, checkImageFile } from './avatar-image';

/** @param {string} type @param {number} size */
const fakeFile = (type, size) => {
  const file = new File(['x'], 'photo', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('reviewer identity helpers', () => {
  it('takes two letters from a name, in any script', () => {
    expect(initials('sample reviewer')).toBe('SR');
    expect(initials('Madonna')).toBe('MA');
    expect(initials('عميل نموذجي')).toBe('عن');
    expect(initials('  ')).toBe('');
    expect(initials(null)).toBe('');
    expect(initials('<b> x')).toBe('BX');
  });

  it('strips markup for display and only allows https or root-relative avatars', () => {
    expect(plainText('Nice <script>alert(1)</script>work')).toBe('Nice alert(1)work');
    expect(safeAvatarUrl('https://cdn.example.com/a.webp')).toBe('https://cdn.example.com/a.webp');
    expect(safeAvatarUrl('/storage/avatars/1.webp')).toBe('/storage/avatars/1.webp');
    expect(safeAvatarUrl('javascript:alert(1)')).toBeNull();
    expect(safeAvatarUrl('//evil.example/a.png')).toBeNull();
    expect(safeAvatarUrl('http://insecure.example/a.png')).toBeNull();
    expect(safeAvatarUrl(null)).toBeNull();
  });

  it('shows approved records only', () => {
    expect(isApproved({ status: 'approved' })).toBe(true);
    expect(isApproved({})).toBe(true);
    expect(isApproved({ status: 'pending' })).toBe(false);
    expect(isApproved({ status: 'rejected' })).toBe(false);
  });

  it('accepts JPG/PNG/WebP under 5 MB only', () => {
    expect(checkImageFile(fakeFile('image/jpeg', 1000))).toBeNull();
    expect(checkImageFile(fakeFile('image/png', AVATAR_MAX_BYTES - 1))).toBeNull();
    expect(checkImageFile(fakeFile('image/webp', 10))).toBeNull();
    expect(checkImageFile(fakeFile('image/png', AVATAR_MAX_BYTES))).toBe('photoSize');
    expect(checkImageFile(fakeFile('image/gif', 10))).toBe('photoType');
    expect(checkImageFile(fakeFile('image/svg+xml', 10))).toBe('photoType');
    expect(checkImageFile(fakeFile('application/pdf', 10))).toBe('photoType');
    expect(checkImageFile(null)).toBe('photoType');
  });
});
