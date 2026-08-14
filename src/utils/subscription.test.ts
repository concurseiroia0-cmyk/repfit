import { describe, expect, it } from 'vitest';
import {
  getDaysRemaining,
  getEffectiveStatus,
  getSubscriptionAccessInfo,
  hasPlatformAccess,
  hasSubscriptionAccess,
  isOwnerEmail,
  type SubscriptionLike,
} from './subscription';

// Hoje = 14/08/2026 (meio-dia UTC, para o cálculo de dias não depender de fuso).
const NOW = new Date('2026-08-14T12:00:00.000Z');
// Fim do período pago = 15/09/2026 → 32 dias depois de 14/08.
const END = '2026-09-15T00:00:00.000Z';
const END_MS = new Date(END).getTime();

function sub(overrides: Partial<SubscriptionLike> = {}): SubscriptionLike {
  return {
    status: 'active',
    current_period_end: END,
    cancel_at_period_end: false,
    ...overrides,
  };
}

describe('getDaysRemaining (cálculo DINÂMICO de dias restantes)', () => {
  it('exemplo do requisito: end 2026-09-15 e hoje 2026-08-14 → 32 dias', () => {
    expect(getDaysRemaining(END, NOW)).toBe(32);
  });

  it('último dia de validade → 0 (expirou)', () => {
    expect(getDaysRemaining('2026-08-14T00:00:00.000Z', NOW)).toBe(0);
    expect(getDaysRemaining('2026-08-13T23:59:00.000Z', NOW)).toBe(0);
  });

  it('sem current_period_end (vitalício) → null', () => {
    expect(getDaysRemaining(null, NOW)).toBeNull();
    expect(getDaysRemaining(undefined, NOW)).toBeNull();
  });

  it('não depende de um número fixo salvo: recalcula conforme a data muda', () => {
    const tomorrow = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(getDaysRemaining(END, NOW)).toBe(32);
    expect(getDaysRemaining(END, tomorrow)).toBe(31);
  });
});

describe('hasSubscriptionAccess — REGRA CRÍTICA: cancelamento mantém acesso até o fim do período pago', () => {
  it('assinatura ATIVA com período futuro → acesso', () => {
    expect(hasSubscriptionAccess(sub(), NOW)).toBe(true);
  });

  it('cancelou HOJE, mas current_period_end no futuro → AINDA TEM acesso', () => {
    const canceledToday = sub({ status: 'canceled' });
    expect(hasSubscriptionAccess(canceledToday, NOW)).toBe(true);
  });

  it('cancelou e o current_period_end JÁ PASSOU → SEM acesso (expirado)', () => {
    const afterEnd = new Date(END_MS + 24 * 60 * 60 * 1000);
    const canceled = sub({ status: 'canceled' });
    expect(hasSubscriptionAccess(canceled, afterEnd)).toBe(false);
    expect(getEffectiveStatus(canceled, afterEnd)).toBe('expired');
  });

  it('active com cancel_at_period_end=true → continua com acesso até o fim do período', () => {
    const canceledByFlag = sub({ status: 'active', cancel_at_period_end: true });
    expect(getEffectiveStatus(canceledByFlag, NOW)).toBe('canceled');
    expect(hasSubscriptionAccess(canceledByFlag, NOW)).toBe(true);
    // Depois do período → expirado.
    const afterEnd = new Date(END_MS + 1);
    expect(hasSubscriptionAccess(canceledByFlag, afterEnd)).toBe(false);
  });

  it('status expired → SEM acesso, mesmo com current_period_end no futuro', () => {
    expect(hasSubscriptionAccess(sub({ status: 'expired' }), NOW)).toBe(false);
  });

  it('status desconhecido → SEM acesso (safe default)', () => {
    expect(hasSubscriptionAccess(sub({ status: 'whatever' }), NOW)).toBe(false);
  });
});

describe('hasSubscriptionAccess — demais estados', () => {
  it('trial válido → acesso; trial encerrado → sem acesso', () => {
    expect(hasSubscriptionAccess(sub({ status: 'trial' }), NOW)).toBe(true);
    const afterEnd = new Date(END_MS + 1);
    expect(hasSubscriptionAccess(sub({ status: 'trial' }), afterEnd)).toBe(false);
  });

  it('past_due com período válido → acesso mantido (período pago governa)', () => {
    expect(hasSubscriptionAccess(sub({ status: 'past_due' }), NOW)).toBe(true);
    const afterEnd = new Date(END_MS + 1);
    expect(hasSubscriptionAccess(sub({ status: 'past_due' }), afterEnd)).toBe(false);
  });

  it('pending SEM outro período válido → sem acesso', () => {
    expect(hasSubscriptionAccess(sub({ status: 'pending', current_period_end: null }), NOW)).toBe(false);
  });

  it('pending COM período válido (renovação em processamento) → acesso', () => {
    expect(hasSubscriptionAccess(sub({ status: 'pending' }), NOW)).toBe(true);
  });

  it('lifetime (current_period_end NULL) → acesso total, dias null', () => {
    const lifetime = sub({ status: 'lifetime', current_period_end: null });
    expect(hasSubscriptionAccess(lifetime, NOW)).toBe(true);
    expect(getEffectiveStatus(lifetime, NOW)).toBe('lifetime');
    expect(getDaysRemaining(null, NOW)).toBeNull();
  });

  it('sem assinatura → sem acesso', () => {
    expect(hasSubscriptionAccess(null, NOW)).toBe(false);
    expect(hasSubscriptionAccess(undefined, NOW)).toBe(false);
  });
});

describe('hasPlatformAccess — dono (acesso total sem pagar) + assinatura', () => {
  it('e-mail do dono tem acesso mesmo sem assinatura', () => {
    expect(
      hasPlatformAccess({
        email: 'juliocesa219853@gmail.com',
        ownerEmails: ['juliocesa219853@gmail.com'],
        subscription: null,
        now: NOW,
      })
    ).toBe(true);
  });

  it('dono é case-insensitive e ignora espaços', () => {
    expect(isOwnerEmail('  JULIOCESA219853@Gmail.COM ', ['juliocesa219853@gmail.com'])).toBe(true);
  });

  it('outro e-mail sem assinatura → sem acesso', () => {
    expect(
      hasPlatformAccess({ email: 'alguem@exemplo.com', ownerEmails: ['juliocesa219853@gmail.com'], subscription: null, now: NOW })
    ).toBe(false);
  });

  it('usuário comum com assinatura ativa → acesso', () => {
    expect(
      hasPlatformAccess({ email: 'alguem@exemplo.com', subscription: sub(), now: NOW })
    ).toBe(true);
  });

  it('usuário comum com assinatura expirada → sem acesso', () => {
    expect(
      hasPlatformAccess({
        email: 'alguem@exemplo.com',
        subscription: sub({ status: 'expired' }),
        now: NOW,
      })
    ).toBe(false);
  });
});

describe('getSubscriptionAccessInfo — mensagens da UI', () => {
  it('plano ativo com renovação automática', () => {
    const info = getSubscriptionAccessInfo(sub(), NOW);
    expect(info.hasAccess).toBe(true);
    expect(info.status).toBe('active');
    expect(info.autoRenews).toBe(true);
    expect(info.daysRemaining).toBe(32);
    expect(info.lines).toEqual([
      'Plano ativo',
      'Próxima renovação: 15/09/2026',
      'Faltam 32 dias para a renovação.',
    ]);
  });

  it('cancelada mas ainda válida', () => {
    const info = getSubscriptionAccessInfo(sub({ status: 'canceled' }), NOW);
    expect(info.hasAccess).toBe(true);
    expect(info.status).toBe('canceled');
    expect(info.autoRenews).toBe(false);
    expect(info.lines).toEqual([
      'Assinatura cancelada',
      'Acesso disponível até 15/09/2026',
      'Faltam 32 dias para o encerramento do acesso.',
    ]);
  });

  it('cancelada e expirada', () => {
    const afterEnd = new Date(END_MS + 1);
    const info = getSubscriptionAccessInfo(sub({ status: 'canceled' }), afterEnd);
    expect(info.hasAccess).toBe(false);
    expect(info.status).toBe('expired');
    expect(info.lines[0]).toBe('Assinatura expirada');
  });

  it('vitalícia (dono)', () => {
    const info = getSubscriptionAccessInfo(
      sub({ status: 'lifetime', current_period_end: null }),
      NOW
    );
    expect(info.hasAccess).toBe(true);
    expect(info.status).toBe('lifetime');
    expect(info.daysRemaining).toBeNull();
    expect(info.autoRenews).toBe(false);
    expect(info.lines[0]).toBe('Acesso vitalício');
  });

  it('sem assinatura', () => {
    const info = getSubscriptionAccessInfo(null, NOW);
    expect(info.hasAccess).toBe(false);
    expect(info.lines[0]).toBe('Assinatura expirada');
  });
});
