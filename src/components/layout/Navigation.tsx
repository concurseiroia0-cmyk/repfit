import { NavLink } from 'react-router-dom';
import {
  Calendar,
  History,
  Home,
  PlusCircle,
  Ruler,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { ACTIVE_PILL, cn } from '../../utils/misc';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import { Logo } from '../Logo';
import { InstallAppButton } from '../PwaInstall';

export const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/novo', label: 'Novo treino', icon: PlusCircle },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/medidas', label: 'Medidas', icon: Ruler },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-10 w-10 rounded-xl shadow-[0_0_16px_rgba(251,191,36,0.35)]" />
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">RepFit</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">seus dados, só seus</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pwa = usePwaInstall();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-white/10 dark:bg-[#161616] lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? ACTIVE_PILL
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3">
        {pwa.canInstall && <InstallAppButton size="sm" full />}
        <p className="px-3 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Funciona 100% offline. Seus dados ficam salvos apenas neste navegador.
        </p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  // Esconde a barra enquanto o teclado está aberto no celular: com o teclado
  // aberto ela sobe para cima do conteúdo (interactive-widget=resizes-content)
  // e cobre o que está sendo digitado.
  const keyboardOpen = useKeyboardOpen();
  if (keyboardOpen) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-3 bottom-3 z-40 lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch overflow-x-auto rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur dark:border-white/10 dark:bg-[#161616]/95 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-semibold transition-all duration-150',
                isActive
                  ? ACTIVE_PILL
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
