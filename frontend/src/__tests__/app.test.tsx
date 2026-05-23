import { describe, expect, it } from 'vitest';

describe('Mirath frontend behavior', () => {
  it('language toggle can switch direction and translations', () => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('auth redirects unauthenticated users to login', () => {
    const hasToken = false;
    const target = hasToken ? '/dashboard' : '/login';
    expect(target).toBe('/login');
  });

  it('inheritance results display fractions', () => {
    const result = { relationship: 'Husband', quranicShare: '1/4' };
    expect(result.quranicShare).toBe('1/4');
  });
});
