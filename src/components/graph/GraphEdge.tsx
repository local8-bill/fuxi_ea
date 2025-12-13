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
        stroke: data?.highlight ? "#4338CA" : "#D4D4D8",
        opacity: data?.highlight ? 0.85 : 0.5,
        strokeWidth: data?.highlight ? 2.4 : 1.25,
      }}
    />
  );
}
