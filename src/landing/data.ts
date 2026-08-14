// ============================================================================
// Dados e textos da página de vendas (landing) — centralizados aqui para
// facilitar futuras atualizações de copy/preço sem mexer nos componentes.
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  ClipboardList,
  Cloud,
  GraduationCap,
  MousePointerClick,
  Puzzle,
  Ruler,
  Smartphone,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

export const PRODUCT = 'RepFit';
export const PRICE_ORIGINAL = 'R$ 39,90';
export const PRICE_PROMO = 'R$ 27,90';
export const SAVINGS = 'R$ 12,00';
export const WARRANTY = '7 dias';

export interface Testimonial {
  name: string;
  initials: string;
  color: string;
  text: string;
}

export interface IconCard {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Depoimentos — placeholders até o dono enviar fotos reais. */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Lucas M.',
    initials: 'LM',
    color: 'bg-blue-600',
    text: 'Nunca mais esqueci o peso da última série. Saí de 40 kg para 52 kg no supino em 3 meses acompanhando o gráfico.',
  },
  {
    name: 'Mariana S.',
    initials: 'MS',
    color: 'bg-rose-500',
    text: 'Abro o celular e anoto tudo em segundos. Ver minha evolução nos gráficos me motiva a treinar todo dia.',
  },
  {
    name: 'Pedro R.',
    initials: 'PR',
    color: 'bg-emerald-600',
    text: 'Antes anotava no papel e perdia tudo. Agora o histórico fica salvo e vejo minha progressão de carga e repetições.',
  },
  {
    name: 'Ana C.',
    initials: 'AC',
    color: 'bg-amber-500',
    text: 'A praticidade é incrível. Registro cada treino na hora e acompanho as medidas junto com a evolução.',
  },
  {
    name: 'Rafael T.',
    initials: 'RT',
    color: 'bg-violet-600',
    text: 'Voltei pra academia depois de anos. O app me deu a constância que faltava para evoluir de novo.',
  },
];

/** Quebra de objeções — ícones azuis em círculos. */
export const OBJECTIONS: IconCard[] = [
  {
    icon: MousePointerClick,
    title: 'Método simples',
    text: 'Você não precisa ser especialista para começar.',
  },
  {
    icon: Smartphone,
    title: 'Só precisa do celular',
    text: 'Acesse e aplique mesmo sem equipamentos caros.',
  },
  {
    icon: GraduationCap,
    title: 'Sem conhecimento avançado',
    text: 'Passo a passo direto, pensado para qualquer pessoa.',
  },
  {
    icon: Zap,
    title: 'Resultado rápido',
    text: 'Criado para facilitar o processo e economizar tempo.',
  },
];

/** Recursos/bônus inclusos na oferta. */
export const BONUS: IconCard[] = [
  {
    icon: TrendingUp,
    title: 'Gráficos de progressão',
    text: 'Acompanhe carga e repetições de cada exercício ao longo do tempo.',
  },
  {
    icon: ClipboardList,
    title: 'Anotação em segundos',
    text: 'Registre séries, peso e repetições sem atrapalhar o treino.',
  },
  {
    icon: Cloud,
    title: 'Backup na nuvem',
    text: 'Treinos salvos e sincronizados — troque de celular sem perder nada.',
  },
  {
    icon: Trophy,
    title: 'Recordes pessoais',
    text: 'Veja quando bateu seu melhor e supere a cada semana.',
  },
  {
    icon: Ruler,
    title: 'Medidas corporais',
    text: 'Acompanhe peso, medidas e evolução do corpo.',
  },
  {
    icon: CalendarCheck,
    title: 'Calendário de treinos',
    text: 'Organize os dias de treino e mantenha a constância.',
  },
];

/** Dores frequentes — cards com fundo rosa. */
export const PAINS: IconCard[] = [
  {
    icon: Wallet,
    title: 'Gasto alto',
    text: 'Você precisava pagar caro para conseguir acompanhar sua evolução.',
  },
  {
    icon: Timer,
    title: 'Demora',
    text: 'Antes, anotar cada série tomava minutos e quebrava o ritmo do treino.',
  },
  {
    icon: Puzzle,
    title: 'Complexo',
    text: 'Planilhas e apps complicados pareciam feitos só para especialistas.',
  },
  {
    icon: Users,
    title: 'Depende de outros',
    text: 'Você ficava preso esperando alguém anotar por você.',
  },
];

/** Benefícios do bloco azul "A Solução Simples". */
export const SOLUTIONS: string[] = [`${PRICE_PROMO} apenas`, 'Rápido e prático', 'Fácil de aplicar', 'Mais independência'];

export const STEPS = [
  { title: 'Acesse pelo celular', text: 'Você recebe o acesso e pode começar direto do seu celular.' },
  { title: 'Siga o passo a passo', text: 'Veja exatamente o que fazer, sem complicação.' },
  { title: 'Aplique o método', text: 'Registre seus treinos e use os gráficos para evoluir a carga.' },
  { title: 'Pronto', text: 'Agora você tem uma forma mais simples de alcançar cargas maiores.' },
];

export const FAQS = [
  { q: 'O acesso é imediato?', a: 'Sim. Após a confirmação do pagamento, você recebe as instruções de acesso.' },
  { q: 'Preciso ter experiência?', a: 'Não. O material foi criado para ser simples e direto.' },
  { q: 'Funciona pelo celular?', a: 'Sim. Você pode acessar pelo celular, computador ou tablet.' },
  { q: 'Tem garantia?', a: `Sim. Você tem ${WARRANTY} de garantia, conforme as condições da oferta.` },
];
