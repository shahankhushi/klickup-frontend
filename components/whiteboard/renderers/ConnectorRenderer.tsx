"use client";

import { CanvasObject, ConnectorObject } from "../types";
import { computeConnectorPath, getAnchorPoint } from "../math";

interface ConnectorRendererProps {
  connector: ConnectorObject;
  objects: CanvasObject[];
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

export function ConnectorRenderer({ connector, objects, isSelected, onSelect }: ConnectorRendererProps) {
  const fromObj = objects.find((o) => o.id === connector.fromId);
  const toObj = objects.find((o) => o.id === connector.toId);

  const start = fromObj
    ? getAnchorPoint(fromObj, connector.fromAnchor || "right")
    : { x: connector.x, y: connector.y };

  const end = toObj
    ? getAnchorPoint(toObj, connector.toAnchor || "left")
    : { x: connector.x + (connector.width || 140), y: connector.y + (connector.height || 40) };

  const { pathString, labelPoint } = computeConnectorPath(
    start,
    end,
    connector.connectorType || "elbow",
    connector.fromAnchor || "right",
    connector.toAnchor || "left"
  );

  let strokeDasharray: string | undefined;
  if (connector.strokeStyle === "dashed") {
    strokeDasharray = "6 4";
  } else if (connector.strokeStyle === "dotted") {
    strokeDasharray = "2 4";
  }

  const markerId = `arrowhead-${connector.id}`;
  const strokeColor = isSelected ? "#7c3aed" : connector.stroke || "#0f172a";

  return (
    <g className="select-none">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Wide Invisible Hitbox for effortless clicking / selection */}
      <path
        d={pathString}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(e);
        }}
      />

      {/* Main Visible Connector Path */}
      <path
        d={pathString}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? (connector.strokeWidth || 2) + 1.5 : (connector.strokeWidth || 2)}
        strokeDasharray={strokeDasharray}
        markerEnd={connector.endArrow !== "none" ? `url(#${markerId})` : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-auto cursor-pointer transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(e);
        }}
      />

      {/* Selection endpoints indicators */}
      {isSelected && (
        <>
          <circle cx={start.x} cy={start.y} r={5} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} />
          <circle cx={end.x} cy={end.y} r={5} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} />
        </>
      )}

      {/* Connector Label */}
      {connector.label && (
        <text
          x={labelPoint.x}
          y={labelPoint.y - 8}
          textAnchor="middle"
          fill="#475569"
          className="text-[11px] font-semibold bg-white"
        >
          {connector.label}
        </text>
      )}
    </g>
  );
}
