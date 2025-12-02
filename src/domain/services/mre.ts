import type { ArtifactKind } from "@/domain/model/modernization";

export type ArchitectureBox = {
  label: string;
  kind: ArtifactKind;
};

export async function extractArchitectureBoxes(buffer: Buffer): Promise<ArchitectureBox[]> {
  // Placeholder implementation; parsing the diagram for boxes is future work.
  return [
    {
      label: "Placeholder App",
      kind: "architecture_current",
    },
  ];
}
