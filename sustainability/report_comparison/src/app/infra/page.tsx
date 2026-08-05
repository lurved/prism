import { CategoryPage } from "@/components/spine/CategoryPage";
import { getCategory } from "@/data/spine/categories";

const config = getCategory("utility")!;

export const metadata = { title: config.metaTitle, description: config.metaDescription };

export default function InfraPage() {
  return <CategoryPage config={config} />;
}
