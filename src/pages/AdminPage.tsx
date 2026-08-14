import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Gift,
  History,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { adminApi, getOwnerEmails } from '../services/supabase/adminService';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Field';
import { EmptyState } from '../components/ui/Feedback';

type Gateway = 'kirvano' | 'ggcheckout';

interface SimEvent {
  value: string;
  label: string;
}
const SIM_EVENTS: Record<Gateway, SimEvent[]> = {
  kirvano: [
    { value: 'SALE_APPROVED', label: 'Aprovado / Renovado (SALE_APPROVED)' },
    { value: 'SUBSCRIPTION_CANCELED', label: 'Cancelado (SUBSCRIPTION_CANCELED)' },
    { value: 'SALE_REFUSED', label: 'Atrasado / Inadimplente (SALE_REFUSED)' },
    { value: 'SALE_CHARGEBACK', label: 'Chargeback (SALE_CHARGEBACK)' },
  ],
  ggcheckout: [
    { value: 'card.paid', label: 'Aprovado / Renovado (card.paid)' },
    { value: 'card.failed', label: 'Atrasado / Inadimplente (card.failed)' },
    { value: 'card.refunded', label: 'Cancelado / Reembolsado (card.refunded)' },
  ],
};

const PLANS = ['RepFit (mensal)', 'RepFit Pro (anual)'];

const DURATIONS: { label: string; minutes: number }[] = [
  { label: '5 minutos', minutes: 5 },
  { label: '7 dias', minutes: 7 * 24 * 60 },
  { label: '30 dias', minutes: 30 * 24 * 60 },
  { label: '90 dias', minutes: 90 * 24 * 60 },
  { label: '180 dias', minutes: 180 * 24 * 60 },
  { label: '365 dias', minutes: 365 * 24 * 60 },
];

interface EventRow {
  id: string;
  provider: string | null;
  event_type: string | null;
  normalized_event_type: string | null;
  email: string | null;
  product: string | null;
  plan: string | null;
  processing_status: string | null;
  error: string | null;
  payload: unknown;
  created_at: string | null;
}

interface GrantRow {
  id: string;
  email: string | null;
  plan_name: string | null;
  origin: string | null;
  access_until: string | null;
  status: string | null;
  granted_by: string | null;
  granted_at: string | null;
}

const fmt = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('pt-BR') : '—';

export function AdminPage() {
  const auth = useSupabaseAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [owners, setOwners] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

  const [urls, setUrls] = useState<{ kirvano: string; ggcheckout: string } | null>(null);

  // Simulador
  const [simGateway, setSimGateway] = useState<Gateway>('kirvano');
  const [simEvent, setSimEvent] = useState<string>(SIM_EVENTS.kirvano[0].value);
  const [simEmail, setSimEmail] = useState('');
  const [simPlan, setSimPlan] = useState(PLANS[0]);
  const [simBusy, setSimBusy] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Concessão
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState(PLANS[0]);
  const [grantDuration, setGrantDuration] = useState(DURATIONS[2].minutes);
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantResult, setGrantResult] = useState<string | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Logs
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsBusy, setEventsBusy] = useState(false);
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  useEffect(() => {
    void getOwnerEmails()
      .then(setOwners)
      .finally(() => setChecking(false));
    void adminApi.config().then((r) => {
      if (r.ok && r.data?.webhooks) setUrls(r.data.webhooks);
    });
    void refreshGrants();
    void refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwner = auth.user != null && owners.includes((auth.user.email ?? '').toLowerCase());

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      push(`${label} copiada!`, 'success');
    } catch {
      push('Não foi possível copiar.', 'error');
    }
  }

  async function refreshGrants() {
    const r = await adminApi.grants();
    if (r.ok && r.data) setGrants((r.data.grants as GrantRow[]) ?? []);
  }

  async function refreshEvents() {
    setEventsBusy(true);
    const r = await adminApi.events(10);
    setEventsBusy(false);
    if (r.ok && r.data) setEvents((r.data.events as EventRow[]) ?? []);
  }

  async function simulate() {
    if (!simEmail.trim()) return push('Informe um e-mail de teste.', 'error');
    setSimBusy(true);
    setSimResult(null);
    const r = await adminApi.simulate(simGateway, simEvent, simEmail.trim(), simPlan);
    setSimBusy(false);
    if (!r.ok) return setSimResult(`❌ ${r.error ?? 'erro'}`);
    const res = (r.data as { result?: Record<string, unknown> }).result ?? {};
    setSimResult(
      `✅ Processado — status: ${String(res.status)} · evento: ${String(res.eventType ?? '')} · e-mail: ${String(res.email ?? '')}${res.error ? ` · erro: ${res.error}` : ''}`
    );
    void refreshEvents();
  }

  async function grant() {
    if (!grantEmail.trim()) return push('Informe o e-mail.', 'error');
    setGrantBusy(true);
    setGrantResult(null);
    const r = await adminApi.grant(grantEmail.trim(), grantPlan, grantDuration);
    setGrantBusy(false);
    if (!r.ok) return setGrantResult(`❌ ${r.error ?? 'erro'}`);
    const res = (r.data as { result?: Record<string, unknown> }).result ?? {};
    setGrantResult(
      `✅ Acesso concedido até ${fmt(String(res.accessUntil ?? ''))}${res.error ? ` · ${res.error}` : ''}`
    );
    setGrantEmail('');
    void refreshGrants();
  }

  async function revoke(id: string) {
    setRevokingId(id);
    const r = await adminApi.revoke(id);
    setRevokingId(null);
    if (!r.ok) return push(`Erro ao revogar: ${r.error}`, 'error');
    push('Acesso revogado — o usuário perdeu o acesso à plataforma.', 'success');
    void refreshGrants();
  }

  if (checking || auth.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!auth.user) return <Navigate to="/login" replace />;

  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Lock className="h-10 w-10 text-rose-500" />
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">Acesso restrito</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Apenas o dono do RepFit pode acessar o painel administrativo.
        </p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">Painel administrativo</h1>

      <div className="space-y-4">
        {/* URLs dos webhooks */}
        <Card>
          <CardHeader title="URLs dos webhooks" subtitle="Cole estas URLs na configuração de cada plataforma" />
          <div className="space-y-3 px-5 pb-5">
            {(['kirvano', 'ggcheckout'] as const).map((g) => (
              <div key={g} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{g}</p>
                  <p className="break-all text-xs text-slate-600 dark:text-slate-300">
                    {urls?.[g] ?? 'Função ainda não implantada (rode supabase functions deploy).'}
                  </p>
                </div>
                {urls?.[g] && (
                  <Button variant="secondary" size="sm" onClick={() => void copy(urls[g], `URL do ${g}`)}>
                    <ClipboardCopy className="h-4 w-4" /> Copiar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Simulador de webhooks */}
        <Card>
          <CardHeader title="Simulador de webhooks" subtitle="Testa a MESMA lógica dos endpoints reais" />
          <div className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Gateway">
                <Select value={simGateway} onChange={(e) => {
                  const g = e.target.value as Gateway;
                  setSimGateway(g);
                  setSimEvent(SIM_EVENTS[g][0].value);
                }} aria-label="Gateway">
                  <option value="kirvano">Kirvano</option>
                  <option value="ggcheckout">GGCheckout</option>
                </Select>
              </Field>
              <Field label="Evento">
                <Select value={simEvent} onChange={(e) => setSimEvent(e.target.value)} aria-label="Evento">
                  {SIM_EVENTS[simGateway].map((ev) => (
                    <option key={ev.value} value={ev.value}>{ev.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="E-mail de teste">
                <Input type="email" value={simEmail} onChange={(e) => setSimEmail(e.target.value)} placeholder="aluno@exemplo.com" />
              </Field>
              <Field label="Produto / plano">
                <Select value={simPlan} onChange={(e) => setSimPlan(e.target.value)} aria-label="Plano">
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => void simulate()} disabled={simBusy}>
                {simBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {simBusy ? 'Simulando…' : 'Simular Webhook'}
              </Button>
            </div>
            {simResult && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                {simResult}
              </p>
            )}
          </div>
        </Card>

        {/* Concessão de acesso manual */}
        <Card>
          <CardHeader title="Concessão de acesso manual" subtitle="Cortesia / acesso temporário (separado da assinatura paga)" />
          <div className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="E-mail do usuário">
                <Input type="email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="aluno@exemplo.com" />
              </Field>
              <Field label="Produto / plano">
                <Select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value)} aria-label="Plano">
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Duração do acesso">
                <Select value={String(grantDuration)} onChange={(e) => setGrantDuration(Number(e.target.value))} aria-label="Duração">
                  {DURATIONS.map((d) => (
                    <option key={d.label} value={d.minutes}>{d.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => void grant()} disabled={grantBusy}>
                {grantBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                {grantBusy ? 'Concedendo…' : 'Conceder acesso gratuitamente'}
              </Button>
              <Button variant="secondary" onClick={() => void refreshGrants()}>
                <RefreshCw className="h-4 w-4" /> Atualizar
              </Button>
            </div>
            {grantResult && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                {grantResult}
              </p>
            )}

            {grants.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/15">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                      <th className="px-3 py-2.5">E-mail</th>
                      <th className="px-3 py-2.5">Plano</th>
                      <th className="px-3 py-2.5">Origem</th>
                      <th className="px-3 py-2.5">Expira em</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {grants.map((g) => (
                      <tr key={g.id}>
                        <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{g.email}</td>
                        <td className="px-3 py-2.5 text-slate-500">{g.plan_name}</td>
                        <td className="px-3 py-2.5 text-slate-500">{g.origin}</td>
                        <td className="px-3 py-2.5 text-slate-500">{fmt(g.access_until)}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
                            {g.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => void revoke(g.id)} disabled={revokingId === g.id}>
                            {revokingId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Revogar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Últimos webhooks */}
        <Card>
          <CardHeader
            title="Últimos webhooks processados"
            subtitle="Os 10 eventos mais recentes (auditoria)"
            action={
              <Button variant="secondary" size="sm" onClick={() => void refreshEvents()} disabled={eventsBusy}>
                <RefreshCw className={eventsBusy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              </Button>
            }
          />
          <div className="px-5 pb-5">
            {events.length === 0 ? (
              <EmptyState icon={<History className="h-6 w-6" />} title="Nenhum webhook recebido ainda" className="py-8" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/15">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                      <th className="px-3 py-2.5">Data/Hora</th>
                      <th className="px-3 py-2.5">Gateway</th>
                      <th className="px-3 py-2.5">E-mail</th>
                      <th className="px-3 py-2.5">Evento</th>
                      <th className="px-3 py-2.5">Normalizado</th>
                      <th className="px-3 py-2.5">Plano</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {events.map((ev) => (
                      <EventRowView key={ev.id} ev={ev} open={openEventId === ev.id} onToggle={() => setOpenEventId(openEventId === ev.id ? null : ev.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function statusPill(status: string | null) {
  const map: Record<string, string> = {
    processed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400',
    duplicate: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-400',
    'no-user': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
    received: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    invalid: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-400',
    failed: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-400',
    unknown: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return map[status ?? ''] ?? map.unknown;
}

function EventRowView({ ev, open, onToggle }: { ev: EventRow; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" onClick={onToggle}>
        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{fmt(ev.created_at)}</td>
        <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{ev.provider ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-500">{ev.email ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-500">{ev.event_type ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-500">{ev.normalized_event_type ?? '—'}</td>
        <td className="px-3 py-2.5 text-slate-500">{ev.plan ?? ev.product ?? '—'}</td>
        <td className="px-3 py-2.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusPill(ev.processing_status)}`}>
            {ev.processing_status ?? '—'}
          </span>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-slate-50 px-4 py-3 dark:bg-slate-800/40">
            <div className="space-y-2">
              {ev.error && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                  <XCircle className="h-3.5 w-3.5" /> {ev.error}
                </p>
              )}
              <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100 dark:bg-black/40">
                {JSON.stringify(ev.payload, null, 2)}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
