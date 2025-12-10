"use client";

import type { EdgeProps } from "reactflow";
import { BaseEdge, getBezierPath } from "reactflow";

export type GraphEdgeData = {
  highlight?: boolean;
};

export function GraphEdge(props: EdgeProps<GraphEdgeData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: data?.highlight ? "#059669" : "#cbd5f5",
        opacity: data?.highlight ? 0.9 : 0.45,
        strokeWidth: data?.highlight ? 2.4 : 1.2,
      }}
    />
  );
}
