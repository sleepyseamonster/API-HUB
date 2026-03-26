import { StudioGenerationConsole } from "@/features/studio/ui/studio-generation-console";

interface PromptStudioProps {
  pollIntervalMs?: number;
}

export function PromptStudio({ pollIntervalMs = 3000 }: PromptStudioProps) {
  return <StudioGenerationConsole pollIntervalMs={pollIntervalMs} showHeader />;
}
