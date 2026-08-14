import { describe, expect, it } from 'vitest';
import { buildGoogleRedirectUrl } from './client';

describe('buildGoogleRedirectUrl', () => {
  it('monta o callback na raiz (desenvolvimento)', () => {
    expect(buildGoogleRedirectUrl('http://localhost:5173/')).toBe(
      'http://localhost:5173/auth/callback'
    );
  });

  it('monta o callback dentro da base do GitHub Pages (/repfit/)', () => {
    expect(buildGoogleRedirectUrl('https://concurseiroia0-cmyk.github.io/repfit/')).toBe(
      'https://concurseiroia0-cmyk.github.io/repfit/auth/callback'
    );
  });
});
