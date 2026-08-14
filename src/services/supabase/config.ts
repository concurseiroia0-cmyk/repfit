// ============================================================================
// Configuração do Supabase (variáveis de ambiente do Vite).
// ----------------------------------------------------------------------------
// Copie .env.example para .env e preencha:
//   VITE_SUPABASE_URL      = https://ybhiyiobmcoszmvrwkef.supabase.co
//   VITE_SUPABASE_ANON_KEY = <chave anônima (pública) do projeto>
//   VITE_OWNER_EMAILS      = e-mails com acesso total (dono), separados por vírgula
//
// IMPORTANTE: a chave anônima é pública por design (vai para o bundle). Toda a
// segurança dos dados é garantida pelo RLS no banco, NUNCA pela chave.
// ============================================================================

export const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined;

export const SUPABASE_ANON_KEY: string | undefined = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string | undefined;

/** E-mails com acesso total (dono), sem precisar pagar. */
export const OWNER_EMAILS: readonly string[] = (
  (import.meta.env.VITE_OWNER_EMAILS as string | undefined) ?? ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** True quando as credenciais existem → o app pode se conectar à nuvem. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
