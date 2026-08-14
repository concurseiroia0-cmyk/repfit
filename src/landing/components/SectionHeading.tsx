/** Cabeçalho padrão das seções da landing (título + subtítulo centralizados). */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}
