import { KeyList } from "@/features/keys/ui/key-list";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";

export default async function KeysPage() {
  const keys = await portalDataProvider.listApiKeys();

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader
        title="API Keys"
        subtitle="Manage sandbox and production credentials by environment."
      />

      <Panel className="text-sm text-app-muted">
        Key lifecycle actions are UI-only in this pass. Backend key issuance and revocation wiring is deferred.
      </Panel>

      <KeyList keys={keys} />
    </div>
  );
}
