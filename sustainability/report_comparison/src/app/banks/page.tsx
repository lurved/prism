import { CategoryPage } from "@/components/spine/CategoryPage";
import { getCategory } from "@/data/spine/categories";

const config = getCategory("banks")!;

export const metadata = { title: config.metaTitle, description: config.metaDescription };

export default function BanksPage() {
  return <CategoryPage config={config} />;
}
