import { QuickstartRunner } from "@/features/quickstart/ui/quickstart-runner";
import { CodeBlock } from "@/shared/ui/code-block";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";

export default function QuickstartPage() {
  return (
    <div id="main-content" className="space-y-6">
      <SectionHeader
        title="Quickstart"
        subtitle="Get from key generation to first 200 in under one minute."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Use your sandbox key</h3>
          <p className="text-sm text-app-muted">
            Copy your sandbox key from the dashboard and include it in the Authorization header.
          </p>
          <CodeBlock
            label="cURL"
            code={`curl -X GET "https://api.yourhub.com/v1/knowledge-base/search?query=offer" \\
  -H "Authorization: Bearer hub_sb_..."`}
          />
        </Panel>

        <QuickstartRunner />
      </div>
    </div>
  );
}
