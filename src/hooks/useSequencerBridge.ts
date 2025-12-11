"use client";

import { useCallback, useState } from "react";
import type { GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { applyIntentToSequence } from "@/lib/sequencer/mutations";
import type { IntentEventOMS, SequencerMutation } from "@/lib/sequencer/types";

type SequencerBridgeOptions = {
  sequence: GraphSequencerItem[];
  setSequence: (next: GraphSequencerItem[]) => void;
  onConfirmation?: (message: string, context: IntentConfirmationContext) => void;
};

export type IntentConfirmationContext = {
  event: IntentEventOMS;
  mutation: SequencerMutation;
  command: string;
};

export function useSequencerBridge({ sequence, setSequence, onConfirmation }: SequencerBridgeOptions) {
  const [status, setStatus] = useState<"idle" | "working" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ message: string; context: IntentConfirmationContext } | null>(null);

  const submitIntent = useCallback(
    async (command: string) => {
      const trimmed = command.trim();
      if (!trimmed) return false;
      setStatus("working");
      setError(null);
      try {
        const response = await fetch("/api/intent/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: trimmed }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? `Intent parsing failed (${response.status})`;
          throw new Error(message);
        }
        const data = (await response.json()) as { event: IntentEventOMS };
        const { confirmation, nextSequence, mutation } = applyIntentToSequence(data.event, sequence);
        setSequence(nextSequence);
        setStatus("success");
        const context: IntentConfirmationContext = { event: data.event, mutation, command: trimmed };
        setLastResult({ message: confirmation, context });
        onConfirmation?.(confirmation, context);
        return true;
      } catch (err: any) {
        setStatus("error");
        setError(err?.message ?? "Intent sequence update failed");
        return false;
      }
    },
    [sequence, setSequence, onConfirmation],
  );

  return { submitIntent, status, error, confirmation: lastResult };
}
