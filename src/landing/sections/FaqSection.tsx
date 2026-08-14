import { FaqItem } from '../components/FaqItem';
import { SectionHeading } from '../components/SectionHeading';
import { FAQS } from '../data';

/** Seção 8 — FAQ em acordeão. */
export function FaqSection() {
  return (
    <section className="mt-12">
      <SectionHeading title="Perguntas Frequentes" />
      <div className="mt-5 space-y-3">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}
