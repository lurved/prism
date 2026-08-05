import { CategoryPage } from "@/components/spine/CategoryPage";
import { getCategory } from "@/data/spine/categories";
import { EmissionsPanel } from "@/components/EmissionsPanel";

const base = getCategory("temasek")!;

// The multi-year emissions panel (bar/trend views, excl.-Cat-15 toggle) predates
// the template and has no equivalent in the spine, which holds latest-year
// figures. It is passed through as a slot rather than lost.
const config = { ...base, slots: { emissions: <EmissionsPanel /> } };

export const metadata = { title: base.metaTitle, description: base.metaDescription };

export default function TemasekPage() {
  return <CategoryPage config={config} />;
}
