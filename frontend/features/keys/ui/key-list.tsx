"use client";

import { useState } from "react";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import type { ApiKeyRecord } from "@/shared/types/portal";

function maskKey(prefix: string): string {
  return `${prefix}••••••••••••`;
}

export function KeyList({ keys }: { keys: ApiKeyRecord[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [revoked, setRevoked] = useState<Record<string, boolean>>({});

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function revokeKey(id: string) {
    setRevoked((prev) => ({ ...prev, [id]: true }));
  }

  return (
    <div className="grid gap-3">
      {keys.map((key) => {
        const isRevoked = revoked[key.id] || key.revoked;
        return (
          <Panel key={key.id} className="space-y-3" data-testid="key-row">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-app-text">{key.name}</h3>
                <p className="text-xs uppercase tracking-wide text-app-muted">
                  {key.environment}
                </p>
              </div>
              <span
                className={
                  isRevoked
                    ? "rounded-full border border-red-500/40 px-2 py-1 text-xs text-red-300"
                    : "rounded-full border border-green-500/40 px-2 py-1 text-xs text-green-300"
                }
              >
                {isRevoked ? "Revoked" : "Active"}
              </span>
            </div>

            <div className="rounded-md border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text">
              {revealed[key.id] ? `${key.prefix}_example_full_key` : maskKey(key.prefix)}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-app-muted">
              <span>Created {formatDate(key.createdAtIso)}</span>
              <span>•</span>
              <span>Last used {formatDate(key.lastUsedAtIso)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => toggleReveal(key.id)}
                data-testid={`toggle-${key.id}`}
              >
                {revealed[key.id] ? "Hide" : "Reveal"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => revokeKey(key.id)}
                disabled={isRevoked}
                data-testid={`revoke-${key.id}`}
              >
                Revoke
              </Button>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
