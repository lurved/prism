export function SectionHead({ index, title, descriptor }: { index: string; title: string; descriptor: string }) {
  return (
    <div className="section-rule mb-8">
      <h2 className="font-mono font-semibold text-xs tracking-[0.2em] uppercase text-ink m-0">
        {index} — {title}
      </h2>
      <span className="font-sans text-[13px] text-muted2">{descriptor}</span>
    </div>
  );
}
