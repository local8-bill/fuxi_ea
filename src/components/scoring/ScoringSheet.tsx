"use client";

import { useCapabilities } from "@/features/capabilities/CapabilityProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Info } from "lucide-react";
import { ScoreSlider } from "./ScoreSlider";

export function ScoringSheet() {
  const {
    openId, setOpenId, byId, children, updateScore, compositeFor, setDomain,
  } = useCapabilities();

  const active = openId ? byId[openId] : null;

  return (
    <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
      {/* Full-screen on mobile, panel on sm+ */}
      <SheetContent side="right" className="inset-0 h-full w-full max-w-none sm:inset-y-0 sm:right-0 sm:w-[460px] sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {active?.name ?? "Capability Scoring"}
            {active?.domain && (
              <Badge
                variant="secondary"
                className="ml-1 cursor-pointer"
                onClick={() => active?.domain && setDomain(active.domain)}
              >
                {active.domain}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>Adjust sliders; changes save instantly.</SheetDescription>
        </SheetHeader>

        {active && (
          <div className="mt-4 space-y-6">
            {/* Selected capability sliders */}
            {active.scores && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Selected Capability</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["opportunity","maturity","techFit","strategicAlignment","peopleReadiness"] as const).map((k) => (
                    <ScoreSlider
                      key={k}
                      label={labelFor(k)}
                      value={active.scores![k]}
                      onChange={(val) => updateScore(active.id, k, val)}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Info className="h-3.5 w-3.5" />
                  <span>Composite: {(compositeFor(active) * 100).toFixed(0)}/100</span>
                </div>
              </div>
            )}

            {/* Children sliders if any */}
            {children[active.id]?.length ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">Children</div>
                {children[active.id].map((childId) => {
                  const c = byId[childId];
                  return (
                    <div key={c.id} className="rounded-xl border p-3">
                      <div className="mb-2 text-sm font-medium">{c.name}</div>
                      {c.scores && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {Object.entries(c.scores).map(([k, v]) => (
                            <ScoreSlider
                              key={k}
                              label={labelFor(k)}
                              value={v as number}
                              onChange={(val) => updateScore(c.id, k as any, val)}
                              min={0}
                              max={5}
                              step={0.5}
                            />
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <Info className="h-3.5 w-3.5" />
                        <span>Composite: {(compositeFor(c) * 100).toFixed(0)}/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpenId(null)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function labelFor(k: string) {
  switch (k) {
    case "maturity": return "Maturity";
    case "techFit": return "Tech Fit";
    case "strategicAlignment": return "Strategic Alignment";
    case "peopleReadiness": return "People Readiness";
    case "opportunity": return "Opportunity";
    default: return k;
  }
}

export default ScoringSheet;