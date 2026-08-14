// ============================================================================
// Donos do RepFit: acesso total sem assinatura + acesso ao painel admin.
// Fonte: variável de ambiente OWNER_EMAILS (edge function secret) unida com
// app_config.owner_emails no banco.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import type { DbClient } from './processor.ts';

export async function getOwnerEmails(client?: DbClient): Promise<string[]> {
  const owners = new Set<string>();

  const fromEnv = Deno.env.get('OWNER_EMAILS');
  if (fromEnv) {
    for (const e of fromEnv.split(',')) {
      const t = e.trim().toLowerCase();
      if (t) owners.add(t);
    }
  }

  // O banco é a fonte dinâmica (migration 0009 atualiza app_config).
  const supabase = client ?? createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
  try {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'owner_emails')
      .maybeSingle();
    const arr = data?.value as unknown;
    if (Array.isArray(arr)) {
      for (const e of arr) {
        const t = String(e).trim().toLowerCase();
        if (t) owners.add(t);
      }
    }
  } catch (err) {
    console.warn('[repfit-owners] falha ao ler app_config:', err);
  }

  return [...owners];
}
