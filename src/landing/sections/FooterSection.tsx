import { Logo } from '../../components/Logo';
import { PRODUCT } from '../data';

/** Seção 10 — rodapé simples com aviso de resultados variáveis. */
export function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-center">
      <div className="mx-auto flex w-fit items-center gap-2">
        <Logo className="h-6 w-6 rounded-lg" />
        <span className="text-sm font-extrabold text-slate-900">{PRODUCT}</span>
      </div>
      <p className="mx-auto mt-3 max-w-xs px-4 text-xs leading-relaxed text-slate-500">
        Resultados podem variar de acordo com a aplicação individual.
      </p>
      <div className="mt-4 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500">
        <span>Política de privacidade</span>
        <span className="text-slate-300">·</span>
        <span>Termos de uso</span>
        <span className="text-slate-300">·</span>
        <span>Suporte</span>
      </div>
      <p className="mt-4 text-xs font-bold text-slate-400">{PRODUCT} © Todos os direitos reservados.</p>
    </footer>
  );
}
