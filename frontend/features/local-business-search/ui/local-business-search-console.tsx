"use client";

import { useMemo, useState } from "react";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Button } from "@/shared/ui/button";
import { CodeBlock } from "@/shared/ui/code-block";
import { Input } from "@/shared/ui/input";
import { Panel } from "@/shared/ui/panel";
import { StatusBadge } from "@/shared/ui/status-badge";
import { TableShell } from "@/shared/ui/table-shell";
import type { EndpointSpec, PlaygroundRunResult, RequestState } from "@/shared/types/portal";

interface LocalBusinessSearchConsoleProps {
  endpoint: EndpointSpec;
}

interface LocalBusinessSearchResultRow {
  place_id: string;
  name: string;
  primary_type: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  phone: string | null;
  website: string | null;
}

function normalizeState(value: string): string {
  return value.trim().toUpperCase();
}

function getLocation(city: string, state: string): string {
  return `${city.trim()}, ${normalizeState(state)}`;
}

function getPayload(args: {
  businessType: string;
  city: string;
  state: string;
  maxResults: number;
}): Record<string, unknown> {
  return {
    query: args.businessType.trim(),
    location: getLocation(args.city, args.state),
    limit: args.maxResults,
    include_contact_fields: true,
  };
}

function extractResults(body: Record<string, unknown> | null): LocalBusinessSearchResultRow[] {
  const data =
    body && typeof body.data === "object" && body.data !== null && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : null;
  const results = data && Array.isArray(data.results) ? (data.results as unknown[]) : null;

  if (!results) {
    return [];
  }

  return results
    .map((item: unknown) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;

      return {
        place_id: typeof record.place_id === "string" ? record.place_id : "",
        name: typeof record.name === "string" ? record.name : "Unknown business",
        primary_type: typeof record.primary_type === "string" ? record.primary_type : null,
        address: typeof record.address === "string" ? record.address : null,
        rating: typeof record.rating === "number" ? record.rating : null,
        review_count: typeof record.review_count === "number" ? record.review_count : null,
        phone: typeof record.phone === "string" ? record.phone : null,
        website: typeof record.website === "string" ? record.website : null,
      } satisfies LocalBusinessSearchResultRow;
    })
    .filter((item: LocalBusinessSearchResultRow | null): item is LocalBusinessSearchResultRow => item !== null);
}

export function LocalBusinessSearchConsole({ endpoint }: LocalBusinessSearchConsoleProps) {
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [maxResults, setMaxResults] = useState("10");
  const [state, setState] = useState<RequestState>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [result, setResult] = useState<PlaygroundRunResult | null>(null);

  const parsedMaxResults = Number.parseInt(maxResults, 10);

  const payload = useMemo(() => {
    if (!businessType.trim() || !city.trim() || !normalizeState(stateCode)) {
      return null;
    }

    if (!Number.isInteger(parsedMaxResults) || parsedMaxResults < 1 || parsedMaxResults > 20) {
      return null;
    }

    return getPayload({
      businessType,
      city,
      state: stateCode,
      maxResults: parsedMaxResults,
    });
  }, [businessType, city, parsedMaxResults, stateCode]);

  const rows = useMemo(() => extractResults(result?.body ?? null), [result]);

  async function runSearch() {
    setErrorText(null);

    if (!payload) {
      setState("error");
      setResult(null);
      setErrorText("Enter a business type, city, state, and a max result count between 1 and 20.");
      return;
    }

    setState("running");

    try {
      const nextResult = await portalDataProvider.runPlayground({
        slug: endpoint.slug,
        payload,
      });

      setResult(nextResult);
      setState(nextResult.status === "success" ? "success" : "error");
    } catch (error) {
      setResult(null);
      setState("error");
      setErrorText(error instanceof Error ? error.message : "Unable to run search");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Search Builder</h3>
              <p className="mt-1 text-sm text-app-muted">
                Enter a business type, city, and state. The form builds the request payload for you.
              </p>
            </div>
            <StatusBadge status={state} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="business-type" className="block text-sm text-app-muted">
                Business type
              </label>
              <Input
                id="business-type"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                placeholder="e.g. med spa, roofer, coffee shop"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="search-city" className="block text-sm text-app-muted">
                City
              </label>
              <Input
                id="search-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Scottsdale"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="search-state" className="block text-sm text-app-muted">
                State
              </label>
              <Input
                id="search-state"
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
                placeholder="AZ"
                maxLength={2}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="max-results" className="block text-sm text-app-muted">
                Max results
              </label>
              <Input
                id="max-results"
                type="number"
                min={1}
                max={20}
                value={maxResults}
                onChange={(event) => setMaxResults(event.target.value)}
              />
            </div>
          </div>

          {errorText ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorText}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runSearch()} data-testid="run-local-business-search">
              Run Search
            </Button>
            <p className="text-xs text-app-muted">
              Contact enrichment is enabled for this guided form.
            </p>
          </div>
        </Panel>

        <Panel className="space-y-3" data-testid="local-business-search-results">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Results</h3>
            {result ? (
              <p className="font-mono text-xs text-app-muted">
                {result.statusCode} • {result.latencyMs}ms
              </p>
            ) : null}
          </div>

          {rows.length > 0 ? (
            <TableShell
              caption="Local business search results"
              header={
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                </tr>
              }
              body={
                <>
                  {rows.map((row) => (
                    <tr key={row.place_id} className="border-t border-app-border align-top">
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium text-app-text">{row.name}</p>
                          <p className="text-xs text-app-muted">
                            {row.primary_type ?? "Unknown type"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-app-muted">
                        {row.address ?? "No address"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-muted">
                        {row.phone ?? "No phone"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-muted">
                        {row.website ? (
                          <a
                            href={row.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            Website
                          </a>
                        ) : (
                          "No website"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-muted">
                        {row.rating !== null
                          ? `${row.rating.toFixed(1)}${row.review_count !== null ? ` (${row.review_count})` : ""}`
                          : "No rating"}
                      </td>
                    </tr>
                  ))}
                </>
              }
            />
          ) : (
            <div className="rounded-lg border border-dashed border-app-border bg-app-bg px-4 py-10 text-center text-sm text-app-muted">
              Run a search to view structured business results here.
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">Computed Payload</h3>
          <CodeBlock
            label="JSON"
            code={
              payload
                ? JSON.stringify(payload, null, 2)
                : "Complete the form to see the generated request payload."
            }
          />
        </Panel>

        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">Raw Response</h3>
          <CodeBlock
            label="JSON"
            code={
              result
                ? JSON.stringify(result.body, null, 2)
                : "Run the search to inspect the raw response."
            }
          />
        </Panel>
      </div>
    </div>
  );
}
