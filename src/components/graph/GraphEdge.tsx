"use client";

import type { EdgeProps } from "reactflow";
import { BaseEdge, getBezierPath } from "reactflow";

export type GraphEdgeData = {
  highlight?: boolean;
};

export function GraphEdge(props: EdgeProps<GraphEdgeData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const baseColor = "rgba(16, 185, 129, 0.35)";
  const highlightColor = "#059669";
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: data?.highlight ? highlightColor : baseColor,
        opacity: data?.highlight ? 0.9 : 0.55,
        strokeWidth: data?.highlight ? 2.4 : 1.25,
      }}
    />
  );
}
