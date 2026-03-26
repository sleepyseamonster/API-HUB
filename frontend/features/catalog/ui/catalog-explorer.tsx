"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterEndpoints } from "@/entities/endpoints/model/search";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/input";
import { Panel } from "@/shared/ui/panel";
import type { EndpointCategory, EndpointSpec } from "@/shared/types/portal";

interface CatalogExplorerProps {
  endpoints: EndpointSpec[];
  initialQuery?: string;
}

const categories: Array<{ value: EndpointCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "resource", label: "Resources" },
  { value: "automation", label: "Automations" },
];

const badgeToneClasses = {
  warning: "border-amber-500/40 bg-amber-500/12 text-amber-200",
  success: "border-sky-500/40 bg-sky-500/12 text-sky-200",
} as const;

export function CatalogExplorer({ endpoints, initialQuery = "" }: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<EndpointCategory | "all">("all");

  const filtered = useMemo(
    () => filterEndpoints(endpoints, { query, category }),
    [category, endpoints, query],
  );

  return (
    <section className="space-y-4">
      <Panel className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="api-search" className="mb-1 block text-sm text-app-muted">
              Search endpoints
            </label>
            <Input
              id="api-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by path, summary, or tag"
            />
          </div>
          <div>
            <label htmlFor="api-category" className="mb-1 block text-sm text-app-muted">
              Category
            </label>
            <select
              id="api-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as EndpointCategory | "all")
              }
              className="h-10 w-full rounded-md border border-app-border bg-panel px-3 text-sm text-app-text outline-none focus-visible:border-accent"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-app-muted">
          {filtered.length} endpoint{filtered.length === 1 ? "" : "s"} available
        </p>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((endpoint) => (
          <Panel key={endpoint.slug} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-xs text-accent">{endpoint.method}</p>
              {endpoint.catalogBadge ? (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    badgeToneClasses[endpoint.catalogBadge.tone],
                  )}
                >
                  {endpoint.catalogBadge.label}
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold text-app-text">{endpoint.title}</h3>
            <p className="text-sm text-app-muted">{endpoint.summary}</p>
            <p className="font-mono text-xs text-app-muted">{endpoint.path}</p>
            <div className="flex flex-wrap gap-2">
              {endpoint.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-app-border px-2 py-1 text-xs text-app-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/apis/${endpoint.slug}`}
              className={cn(
                "inline-flex rounded-md border border-accent px-3 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-app-bg",
              )}
            >
              Open endpoint
            </Link>
          </Panel>
        ))}
      </div>
    </section>
  );
}
