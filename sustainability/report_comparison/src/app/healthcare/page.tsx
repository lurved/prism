import { CategoryPage } from "@/components/spine/CategoryPage";
import { getCategory } from "@/data/spine/categories";
import { mohContextBanner } from "@/data/healthcareData";

const base = getCategory("healthcare")!;

/**
 * Sector-context callout — a third-party academic study estimate. It is NEVER
 * a comparison row and never enters rankings or entity exports, so it lives in
 * the template's banner slot rather than in the spine.
 */
const contextBanner = (
  <div className="border border-hairline rounded-[14px] bg-card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
    <div className="shrink-0">
      <div className="font-serif font-medium text-[34px] leading-[1] text-ink tracking-[-0.01em]">{mohContextBanner.value}</div>
      <span className="inline-block mt-2 font-mono text-[10px] tracking-[0.04em] rounded-full px-2 py-[3px] text-sc bg-[rgba(227,154,77,0.12)]">
        ⚠️ {mohContextBanner.flagLabel}
      </span>
    </div>
    <div className="sm:border-l sm:border-hairline sm:pl-5">
      <div className="font-sans font-semibold text-[13px] text-ink2">{mohContextBanner.title}</div>
      <p className="font-sans text-[12px] leading-[1.55] text-muted mt-1 m-0 max-w-[68ch]">{mohContextBanner.body}</p>
      <a href={mohContextBanner.source.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 font-mono text-[10px] text-good">
        {mohContextBanner.source.title} →
      </a>
    </div>
  </div>
);

const config = { ...base, slots: { contextBanner } };

export const metadata = { title: base.metaTitle, description: base.metaDescription };

export default function HealthcarePage() {
  return <CategoryPage config={config} />;
}
