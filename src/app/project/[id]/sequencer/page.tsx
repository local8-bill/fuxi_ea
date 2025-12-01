import type { ReactElement } from "react";
import { generateTransformationSequence, readTransformationSequence, type SequencerResult } from "@/domain/services/sequencer";
import SequencerClient from "./SequencerClient";

// Next 16: params is a Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SequencerPage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const projectId = typeof resolved?.id === "string" ? resolved.id : "";

  let data: SequencerResult | null = await readTransformationSequence();
  if (!data) {
    data = await generateTransformationSequence();
  }

  return (
    <SequencerClient projectId={projectId} data={data} />
  );
}
