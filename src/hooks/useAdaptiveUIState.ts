"use client";

import { useMemo, useState } from "react";

type AdaptiveUIStateOptions = {
  initialContext?: string;
  initialCTA?: string;
  initialProgress?: number;
};

export function useAdaptiveUIState(
  workspace: string,
  opts?: AdaptiveUIStateOptions,
) {
  const [showContextBar, setShowContextBar] = useState(true);
  const [contextMessage, setContextMessage] = useState(
    opts?.initialContext ?? "",
  );
  const [assistVisible, setAssistVisible] = useState(false);
  const [assistMessage, setAssistMessage] = useState<string | null>(null);
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel] = useState(opts?.initialCTA ?? "Next step");
  const [progress, setProgress] = useState(opts?.initialProgress ?? 0);

  const progressLabel = useMemo(
    () => `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
    [progress],
  );

  return {
    workspace,
    showContextBar,
    setShowContextBar,
    contextMessage,
    setContextMessage,
    assistVisible,
    setAssistVisible,
    assistMessage,
    setAssistMessage,
    ctaEnabled,
    setCtaEnabled,
    ctaLabel,
    setCtaLabel,
    progress,
    setProgress,
    progressLabel,
  };
}
