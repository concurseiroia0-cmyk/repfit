import { ACCENT, GLASS_PANEL, PILL_YELLOW, SUB, TEXT, TABULAR } from '../glassStyles';
import { dateLabel, digitCount, fmtNum, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat } from '../types';
import { Avatar, CardShell } from './CardShell';

/**
 * TEMPLATE 2 — NOVO RECORDE
 * Centro: exercício, valor recorde ENORME em amarelo, delta e a comparação
 * com o recorde anterior. Sem lista de exercícios.
 */
export function NewRecordCard({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const compact = format.height <= 1200;
  const tall = format.height >= 1700;
  const rec = data.record;
  const hasUser = Boolean(data.username.trim());

  if (!rec) {
    // Não deve acontecer (o modal desabilita o template), mas nunca quebra.
    return (
      <CardShell format={format}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 30, color: SUB }}>Nenhum recorde neste treino.</div>
          </div>
        </div>
      </CardShell>
    );
  }

  const valueText =
    rec.unit === 'kg' ? `${fmtNum(rec.value)} ${data.unit}` : `${fmtNum(rec.value)} ${rec.unit || ''}`;
  const digits = digitCount(rec.value);
  const huge = digits > 6 ? 96 : tall ? 150 : compact ? 118 : 136;
  const deltaText =
    rec.delta != null && rec.delta > 0
      ? `+${fmtNum(rec.delta)} ${rec.unit === 'kg' ? data.unit : rec.unit || ''}`
      : null;
  const prevText = rec.prevValue != null ? `Antes: ${fmtNum(rec.prevValue)} ${rec.unit === 'kg' ? data.unit : rec.unit || ''}` : null;

  return (
    <CardShell format={format}>
      {/* Topo discreto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {hasUser ? (
            <Avatar name={data.username} size={64} />
          ) : (
            <span style={{ ...GLASS_PANEL, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
              <svg width={30} height={30} viewBox="0 0 64 64" aria-hidden="true">
                <line x1="10" y1="32" x2="54" y2="32" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
                <rect x="3" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
                <rect x="53" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
              </svg>
            </span>
          )}
          <div>
            <span style={{ ...PILL_YELLOW, display: 'inline-block', padding: '10px 24px', fontSize: compact ? 16 : 20 }}>
              Novo recorde
            </span>
            <div style={{ fontSize: compact ? 17 : 21, color: SUB, marginTop: 8 }}>{data.dateLabel}</div>
          </div>
        </div>
      </div>

      {/* Centro */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: tall ? 40 : 24 }}>
        <div style={{ fontSize: compact ? 24 : 30, fontWeight: 700, color: SUB }}>{safe(rec.label)}</div>
        <div
          style={{
            fontSize: compact ? 42 : 54,
            fontWeight: 900,
            color: TEXT,
            marginTop: 8,
            maxWidth: '86%',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {safe(rec.sublabel || data.workoutName)}
        </div>

        <div style={{ fontSize: huge, fontWeight: 900, color: ACCENT, ...TABULAR, lineHeight: 1.05, marginTop: 34 }}>{valueText}</div>

        {deltaText && (
          <span
            style={{
              marginTop: 30,
              padding: '14px 34px',
              borderRadius: 999,
              background: ACCENT,
              color: '#0B0B0B',
              fontSize: compact ? 26 : 34,
              fontWeight: 900,
              ...TABULAR,
            }}
          >
            {deltaText}
          </span>
        )}
        {prevText && (
          <div style={{ marginTop: 18, fontSize: compact ? 19 : 24, color: SUB, fontWeight: 600 }}>{prevText}</div>
        )}
      </div>
    </CardShell>
  );
}
