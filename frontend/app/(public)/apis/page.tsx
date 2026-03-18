import { CatalogExplorer } from "@/features/catalog/ui/catalog-explorer";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { SectionHeader } from "@/shared/ui/section-header";

interface ApiCatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ApiCatalogPage({ searchParams }: ApiCatalogPageProps) {
  const params = await searchParams;
  const rawQuery = params.q;
  const initialQuery = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery ?? "";

  const endpoints = await portalDataProvider.listEndpoints();

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader
        title="API Catalog"
        subtitle="Discover capabilities by endpoint, payload shape, and credit cost."
      />
      <CatalogExplorer endpoints={endpoints} initialQuery={initialQuery} />
    </div>
  );
}
