"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/input";

const links = [
  { href: "/", label: "Overview" },
  { href: "/quickstart", label: "Quickstart" },
  { href: "/apis", label: "API Catalog" },
  { href: "/dashboard", label: "Console" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [jumpTarget, setJumpTarget] = useState("");

  function handleJump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleaned = jumpTarget.trim().toLowerCase();
    const endpoint = endpointRegistry.find(
      (item) => item.slug === cleaned || item.path.toLowerCase() === cleaned,
    );

    if (endpoint) {
      router.push(`/apis/${endpoint.slug}`);
      return;
    }

    if (cleaned) {
      router.push(`/apis?q=${encodeURIComponent(cleaned)}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-app-border bg-app-bg/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-mono text-sm uppercase tracking-[0.18em] text-accent">
            API HUB
          </Link>
          <nav className="flex items-center gap-1 rounded-md border border-app-border bg-panel p-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-app-bg text-app-text"
                      : "text-app-muted hover:text-app-text",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <form className="w-full sm:max-w-sm" onSubmit={handleJump}>
          <label htmlFor="jump-endpoint" className="sr-only">
            Jump to endpoint
          </label>
          <Input
            id="jump-endpoint"
            value={jumpTarget}
            list="endpoint-jump-list"
            onChange={(event) => setJumpTarget(event.target.value)}
            placeholder="Jump to endpoint (slug or path)"
            aria-label="Jump to endpoint"
          />
          <datalist id="endpoint-jump-list">
            {endpointRegistry.map((endpoint) => (
              <option key={endpoint.slug} value={endpoint.slug}>
                {endpoint.path}
              </option>
            ))}
          </datalist>
        </form>
      </div>
    </header>
  );
}
