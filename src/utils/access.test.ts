import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessArgs } from './access';
import type { SubscriptionLike } from './subscription';

const OWNER = ['juliocesa219853@gmail.com'];
const END = '2026-09-15T00:00:00.000Z';

function args(overrides: Partial<AccessArgs> = {}): AccessArgs {
  return {
    configured: true,
    user: { id: 'u1', email: 'alguem@exemplo.com', fullName: null, avatarUrl: null },
    subscription: null,
    ownerEmails: OWNER,
    fetchFailed: false,
    ...overrides,
  };
}

function sub(overrides: Partial<SubscriptionLike> = {}): SubscriptionLike {
  return { status: 'active', current_period_end: END, cancel_at_period_end: false, ...overrides };
}

function grant(overrides: Partial<{ access_until: string | null; status: string | null; revoked_at: string | null }> = {}) {
  return {
    access_until: END,
    status: 'active',
    revoked_at: null,
    ...overrides,
  };
}

describe('decideAccess — gating por assinatura', () => {
  it('sem Supabase configurado → liberado (offline/local)', () => {
    expect(decideAccess(args({ configured: false }))).toBe('allow');
  });

  it('sem login → bloqueado (cadastro obrigatório)', () => {
    expect(decideAccess(args({ user: null }))).toBe('block');
  });

  it('sem login e sem Supabase configurado → liberado (não há como cadastrar)', () => {
    expect(decideAccess(args({ configured: false, user: null }))).toBe('allow');
  });

  it('falha ao buscar a assinatura → liberado (não prende pagante por erro/offline)', () => {
    expect(decideAccess(args({ fetchFailed: true }))).toBe('allow');
  });

  it('dono tem acesso total mesmo sem assinatura', () => {
    expect(decideAccess(args({ user: { id: 'u1', email: 'JULIOCESA219853@Gmail.com', fullName: null, avatarUrl: null } }))).toBe('allow');
  });

  it('assinatura ativa → liberado', () => {
    expect(decideAccess(args({ subscription: sub() }))).toBe('allow');
  });

  it('cancelada mas com período válido → liberado (regra crítica)', () => {
    expect(decideAccess(args({ subscription: sub({ status: 'canceled' }) }))).toBe('allow');
  });

  it('cancelada com período vencido → bloqueado', () => {
    const expired = sub({ status: 'canceled', current_period_end: '2026-08-01T00:00:00.000Z' });
    expect(decideAccess(args({ subscription: expired }))).toBe('block');
  });

  it('sem assinatura → bloqueado', () => {
    expect(decideAccess(args())).toBe('block');
  });

  it('expirada → bloqueado', () => {
    expect(decideAccess(args({ subscription: sub({ status: 'expired' }) }))).toBe('block');
  });

  it('lifetime → liberado', () => {
    expect(decideAccess(args({ subscription: sub({ status: 'lifetime', current_period_end: null }) }))).toBe('allow');
  });

  it('acesso gratuito/manual ativo → liberado mesmo sem assinatura', () => {
    expect(decideAccess(args({ grants: [grant()] }))).toBe('allow');
  });

  it('acesso gratuito expirado → bloqueado (sem assinatura)', () => {
    expect(decideAccess(args({ grants: [grant({ access_until: '2026-08-01T00:00:00.000Z' })] }))).toBe('block');
  });

  it('acesso gratuito revogado → bloqueado', () => {
    expect(decideAccess(args({ grants: [grant({ revoked_at: '2026-08-10T00:00:00.000Z' })] }))).toBe('block');
  });

  it('usuário com assinatura paga + acesso gratuito → liberado (preserva a paga)', () => {
    expect(decideAccess(args({ subscription: sub(), grants: [grant()] }))).toBe('allow');
  });
});
