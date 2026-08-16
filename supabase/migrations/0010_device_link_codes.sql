-- ============================================================================
-- RepFit — Migration 0010: códigos de vinculação de dispositivo (browser ↔ PWA)
-- ----------------------------------------------------------------------------
-- Fluxo: usuário logado no Chrome gera um código de 6 dígitos (validade 5 min,
-- uso único) e digita no PWA para conectar a MESMA conta Supabase, sem refazer
-- o OAuth do Google no novo dispositivo.
--
-- Segurança:
--  * o código NUNCA é armazenado em texto puro — apenas SHA-256(código + pepper)
--    (DEVICE_LINK_PEPPER fica em secret da edge function);
--  * expiração lógica por expires_at (5 minutos);
--  * uso único (used_at) + invalidação de códigos anteriores ao gerar um novo;
--  * proteção contra força bruta: contador de tentativas (max 5 por código),
--    incrementado atomicamente pela função claim_device_link_code;
--  * RLS: sem política para anon/authenticated — só a edge function
--    (service_role) lê/escreve. O app NUNCA consulta esta tabela direto.
-- ============================================================================

create table if not exists public.device_link_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  code_hash   text not null,                 -- SHA-256(código + pepper) — nunca o código em si
  expires_at  timestamptz not null,          -- validade de 5 minutos
  used_at     timestamptz,                   -- preenchido quando consumido (uso único)
  revoked_at  timestamptz,                   -- invalidado ao gerar um código novo
  attempts    integer not null default 0,    -- tentativas de uso (max 5 → força bruta)
  created_at  timestamptz not null default now(),
  constraint device_link_codes_hash_unique unique (code_hash)
);

comment on table public.device_link_codes is
  'Códigos temporários de vinculação de dispositivo (browser → PWA). Só a edge function device-link acessa (service_role).';
comment on column public.device_link_codes.code_hash is
  'SHA-256 do código + pepper (DEVICE_LINK_PEPPER). O código em si não é armazenado.';
comment on column public.device_link_codes.attempts is
  'Tentativas inválidas — após 5 o código é bloqueado (anti força bruta).';

-- RLS habilitado SEM políticas: nem anon nem usuários autenticados acessam
-- direto; apenas service_role (edge function) lê/escreve.
alter table public.device_link_codes enable row level security;

-- Índices: busca por hash (uso), limpeza de expirados e invalidação por usuário.
create index if not exists device_link_codes_hash_idx
  on public.device_link_codes (code_hash);
create index if not exists device_link_codes_user_idx
  on public.device_link_codes (user_id, created_at desc);
create index if not exists device_link_codes_expires_idx
  on public.device_link_codes (expires_at);

-- ============================================================================
-- Reivindicação ATÔMICA do código (uso único + tentativas) — RPC
-- ----------------------------------------------------------------------------
-- Um único UPDATE consome o código se (e somente se) ele for válido — impede
-- corrida entre duas requisições simultâneas e uso duplicado. Tentativas
-- erradas incrementam `attempts` e, ao chegar em 5, o código deixa de casar
-- (WHERE attempts < p_max_attempts) → bloqueado.
--
-- Retorna o user_id do dono do código (ou NULL se inválido/expirado/usado).
-- Executada apenas pela edge function (service_role); negada a todos os outros.
-- ============================================================================
create or replace function public.claim_device_link_code(p_code_hash text, p_max_attempts integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  update public.device_link_codes
     set used_at = now(),
         attempts = attempts + 1
   where code_hash = p_code_hash
     and used_at is null
     and revoked_at is null
     and expires_at > now()
     and attempts < p_max_attempts
  returning user_id into v_user_id;

  if v_user_id is null then
    -- código não consumível (inexistente, expirado, usado ou bloqueado):
    -- registra a tentativa (se ele ainda existir e estiver ativo) para o
    -- limite anti força bruta.
    update public.device_link_codes
       set attempts = attempts + 1
     where code_hash = p_code_hash
       and used_at is null
       and revoked_at is null
       and expires_at > now();
  end if;

  return v_user_id;
end;
$$;

revoke all on function public.claim_device_link_code(text, integer) from public, anon, authenticated;
grant execute on function public.claim_device_link_code(text, integer) to service_role;
