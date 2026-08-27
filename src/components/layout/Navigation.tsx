import { NavLink, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-white/10 dark:bg-[#161616] sidebar-desktop-only">
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

/**
 * BottomNav com interatividade iOS 26 — pill deslizante animado que segue
 * a aba ativa com spring easing, squish no ícone e glow sutil.
 */
export function BottomNav() {
  const keyboardOpen = useKeyboardOpen();
  if (keyboardOpen) return null;

  return <AnimatedBottomNav />;
}

/* ── Componente animado (iOS 26 style) ──────────────────────────────── */

interface PillStyle {
  left: number;
  width: number;
  ready: boolean;
}

function AnimatedBottomNav() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [pill, setPill] = useState<PillStyle>({ left: 0, width: 0, ready: false });
  const [squish, setSquish] = useState(false);

  // Determina qual aba está ativa baseado na URL
  const getActiveIndex = useCallback(() => {
    const idx = NAV_ITEMS.findIndex((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    );
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  const activeIndex = getActiveIndex();
  const activeItem = NAV_ITEMS[activeIndex];

  // Mede posição da aba ativa e move o pill
  const measure = useCallback(() => {
    const el = tabRefs.current.get(activeItem?.to ?? '');
    if (!el) return;

    const { offsetLeft, offsetWidth } = el;
    setPill((prev) => {
      // Se mudou de aba, dispara squish
      if (prev.ready && prev.left !== offsetLeft) {
        setSquish(true);
        setTimeout(() => setSquish(false), 300);
      }
      return { left: offsetLeft, width: offsetWidth, ready: true };
    });
  }, [activeItem]);

  useEffect(() => {
    measure();
  }, [measure]);

  // Re-medir no resize (orientação, zoom etc.)
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  // Re-medir quando as tabs terminam de renderizar (fonte carregada etc.)
  useEffect(() => {
    const timer = setTimeout(measure, 150);
    return () => clearTimeout(timer);
  }, [measure]);

  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-3 bottom-3 z-40 nav-touch-only"
    >
      <div
        ref={containerRef}
        className="relative mx-auto flex max-w-lg items-stretch overflow-x-auto rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur dark:border-white/10 dark:bg-[#161616]/95 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* ── Pill deslizante (iOS 26) ── */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1 bottom-1 z-0 rounded-full',
            'bg-amber-400 shadow-[0_2px_12px_rgba(245,197,24,0.35)]',
            'transition-[left,width,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            pill.ready ? 'opacity-100' : 'opacity-0',
            squish && 'scale-x-[1.15]'
          )}
          style={{
            left: pill.left,
            width: pill.width,
          }}
        />

        {/* ── Itens da navegação ── */}
        {NAV_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              ref={(el) => {
                if (el) tabRefs.current.set(item.to, el);
              }}
              className={cn(
                'relative z-10 flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-semibold',
                'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                isActive
                  ? 'text-black dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                  isActive && squish && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
