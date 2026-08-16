// ============================================================================
// Testes dos helpers de vinculação de dispositivo (funções puras — sem I/O).
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  DEVICE_CODE_MAX_ATTEMPTS,
  DEVICE_CODE_TTL_SECONDS,
  generateDeviceCode,
  hashDeviceCode,
  normalizeDeviceCode,
  timingSafeEqual,
} from './deviceLink.ts';

describe('generateDeviceCode', () => {
  it('gera sempre 6 dígitos numéricos', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateDeviceCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('gera valores distintos (espaço de 10^6)', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateDeviceCode()));
    expect(codes.size).toBeGreaterThan(150);
  });
});

describe('normalizeDeviceCode', () => {
  it('aceita exatamente 6 dígitos', () => {
    expect(normalizeDeviceCode('123456')).toBe('123456');
    expect(normalizeDeviceCode(' 12-3456 ')).toBe('123456');
  });

  it('rejeita entradas inválidas', () => {
    expect(normalizeDeviceCode('12345')).toBeNull();
    expect(normalizeDeviceCode('1234567')).toBeNull();
    expect(normalizeDeviceCode('abcdef')).toBeNull();
    expect(normalizeDeviceCode('')).toBeNull();
  });
});

describe('hashDeviceCode', () => {
  it('é determinístico e tem 64 hex', async () => {
    const a = await hashDeviceCode('583921', 'pepper');
    const b = await hashDeviceCode('583921', 'pepper');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('muda com o código ou com o pepper', async () => {
    const c1 = await hashDeviceCode('583921', 'pepper');
    const c2 = await hashDeviceCode('583922', 'pepper');
    const c3 = await hashDeviceCode('583921', 'outro-pepper');
    expect(c1).not.toBe(c2);
    expect(c1).not.toBe(c3);
  });

  it('não vaza o código em texto puro', async () => {
    const hash = await hashDeviceCode('583921', 'pepper');
    expect(hash).not.toContain('583921');
  });
});

describe('timingSafeEqual', () => {
  it('compara iguais/diferentes', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('constantes de segurança', () => {
  it('validade de 5 minutos e limite de 5 tentativas', () => {
    expect(DEVICE_CODE_TTL_SECONDS).toBe(300);
    expect(DEVICE_CODE_MAX_ATTEMPTS).toBe(5);
  });
});
