import { Panel } from "@/shared/ui/panel";

const bars = [62, 48, 72, 57, 84, 69, 76];

export function UsageChart() {
  return (
    <Panel className="space-y-4">
      <h3 className="text-lg font-semibold text-app-text">7-Day Request Volume</h3>
      <div className="flex h-44 items-end gap-2">
        {bars.map((value, index) => (
          <div key={index} className="flex-1 space-y-2">
            <div
              className="w-full rounded-sm bg-accent/80 transition-all duration-300"
              style={{ height: `${value}%` }}
              aria-hidden
            />
            <p className="text-center font-mono text-[10px] text-app-muted">D{index + 1}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
