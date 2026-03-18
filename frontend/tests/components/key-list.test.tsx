import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyList } from "@/features/keys/ui/key-list";
import type { ApiKeyRecord } from "@/shared/types/portal";

const keys: ApiKeyRecord[] = [
  {
    id: "key_1",
    name: "Sandbox Main",
    prefix: "hub_sb_1234",
    environment: "sandbox",
    createdAtIso: "2026-01-11T00:00:00.000Z",
    lastUsedAtIso: "2026-03-11T17:19:00.000Z",
    revoked: false,
  },
];

describe("KeyList", () => {
  it("reveals and revokes keys in UI state", () => {
    render(<KeyList keys={keys} />);

    fireEvent.click(screen.getByTestId("toggle-key_1"));
    expect(screen.getByText("hub_sb_1234_example_full_key")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("revoke-key_1"));
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });
});
