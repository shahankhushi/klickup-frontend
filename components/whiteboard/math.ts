import { AnchorPosition, BaseCanvasObject, ConnectorType, Point, ShapeType } from "./types";

export const PASTEL_COLORS = [
  { name: "Yellow", value: "#fef08a", border: "#fde047" },
  { name: "Blue", value: "#bae6fd", border: "#7dd3fc" },
  { name: "Pink", value: "#fbcfe8", border: "#f472b6" },
  { name: "Purple", value: "#e9d5ff", border: "#c084fc" },
  { name: "Green", value: "#bbf7d0", border: "#86efac" },
  { name: "Orange", value: "#fed7aa", border: "#fdba74" },
  { name: "White", value: "#ffffff", border: "#e2e8f0" },
];

export const PALETTE_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function screenToCanvas(screenPoint: Point, pan: Point, zoom: number): Point {
  return {
    x: (screenPoint.x - pan.x) / zoom,
    y: (screenPoint.y - pan.y) / zoom,
  };
}

export function canvasToScreen(canvasPoint: Point, pan: Point, zoom: number): Point {
  return {
    x: canvasPoint.x * zoom + pan.x,
    y: canvasPoint.y * zoom + pan.y,
  };
}

export function getAnchorPoint(obj: BaseCanvasObject, anchor: AnchorPosition): Point {
  switch (anchor) {
    case "top":
      return { x: obj.x + obj.width / 2, y: obj.y };
    case "right":
      return { x: obj.x + obj.width, y: obj.y + obj.height / 2 };
    case "bottom":
      return { x: obj.x + obj.width / 2, y: obj.y + obj.height };
    case "left":
      return { x: obj.x, y: obj.y + obj.height / 2 };
  }
}

export function getClosestAnchor(
  obj: BaseCanvasObject,
  targetPoint: Point
): { anchor: AnchorPosition; point: Point; distance: number } {
  const anchors: AnchorPosition[] = ["top", "right", "bottom", "left"];
  let closestAnchor: AnchorPosition = "top";
  let minDistance = Infinity;
  let closestPoint: Point = { x: 0, y: 0 };

  for (const anchor of anchors) {
    const pt = getAnchorPoint(obj, anchor);
    const dist = Math.hypot(pt.x - targetPoint.x, pt.y - targetPoint.y);
    if (dist < minDistance) {
      minDistance = dist;
      closestAnchor = anchor;
      closestPoint = pt;
    }
  }

  return { anchor: closestAnchor, point: closestPoint, distance: minDistance };
}

export function computeConnectorPath(
  start: Point,
  end: Point,
  type: ConnectorType,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): { pathString: string; labelPoint: Point } {
  if (type === "straight") {
    return {
      pathString: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  }

  if (type === "curved") {
    const dx = end.x - start.x;
    const cx1 = start.x + dx * 0.5;
    const cy1 = start.y;
    const cx2 = start.x + dx * 0.5;
    const cy2 = end.y;

    return {
      pathString: `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`,
      labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  }

  // "elbow" / Orthogonal Connector routing (matches ClickUp screenshot)
  const isHorizontalStart = fromAnchor === "left" || fromAnchor === "right";
  const isHorizontalEnd = toAnchor === "left" || toAnchor === "right";

  let pathString = `M ${start.x} ${start.y}`;
  let midX = (start.x + end.x) / 2;
  let midY = (start.y + end.y) / 2;

  if (isHorizontalStart && isHorizontalEnd) {
    pathString = `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`;
  } else if (!isHorizontalStart && !isHorizontalEnd) {
    pathString = `M ${start.x} ${start.y} V ${midY} H ${end.x} V ${end.y}`;
  } else if (isHorizontalStart && !isHorizontalEnd) {
    pathString = `M ${start.x} ${start.y} H ${end.x} V ${end.y}`;
    midX = end.x;
    midY = start.y;
  } else {
    pathString = `M ${start.x} ${start.y} V ${end.y} H ${end.x}`;
    midX = start.x;
    midY = end.y;
  }

  return {
    pathString,
    labelPoint: { x: midX, y: midY },
  };
}

export function getShapeSvgPath(shapeType: ShapeType, w: number, h: number): string {
  switch (shapeType) {
    case "rectangle":
    case "process":
      return `M 0 0 H ${w} V ${h} H 0 Z`;

    case "rounded-rect":
    case "start-end": {
      const r = Math.min(w, h) * 0.25;
      return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    case "circle":
    case "ellipse": {
      const rx = w / 2;
      const ry = h / 2;
      return `M ${rx} 0 A ${rx} ${ry} 0 1 0 ${rx} ${h} A ${rx} ${ry} 0 1 0 ${rx} 0 Z`;
    }

    case "triangle":
      return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;

    case "right-triangle":
      return `M 0 0 L ${w} ${h} L 0 ${h} Z`;

    case "diamond":
    case "decision":
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;

    case "pentagon": {
      const p1 = `${w * 0.5} 0`;
      const p2 = `${w} ${h * 0.38}`;
      const p3 = `${w * 0.82} ${h}`;
      const p4 = `${w * 0.18} ${h}`;
      const p5 = `0 ${h * 0.38}`;
      return `M ${p1} L ${p2} L ${p3} L ${p4} L ${p5} Z`;
    }

    case "hexagon": {
      const offset = w * 0.25;
      return `M ${offset} 0 H ${w - offset} L ${w} ${h / 2} L ${w - offset} ${h} H ${offset} L 0 ${h / 2} Z`;
    }

    case "octagon": {
      const oX = w * 0.3;
      const oY = h * 0.3;
      return `M ${oX} 0 H ${w - oX} L ${w} ${oY} V ${h - oY} L ${w - oX} ${h} H ${oX} L 0 ${h - oY} V ${oY} Z`;
    }

    case "parallelogram":
    case "input-output": {
      const skew = w * 0.2;
      return `M ${skew} 0 H ${w} L ${w - skew} ${h} H 0 Z`;
    }

    case "trapezoid": {
      const offset = w * 0.2;
      return `M ${offset} 0 H ${w - offset} L ${w} ${h} H 0 Z`;
    }

    case "star": {
      // 5-point star
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.45;
      let path = "";
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        path += (i === 0 ? "M " : "L ") + `${x} ${y} `;
      }
      return path + "Z";
    }

    case "heart": {
      return `M ${w * 0.5} ${h * 0.8} C ${w * 0.1} ${h * 0.5}, 0 ${h * 0.25}, ${w * 0.25} ${h * 0.08} C ${w * 0.4} ${h * -0.02}, ${w * 0.5} ${h * 0.15}, ${w * 0.5} ${h * 0.2} C ${w * 0.5} ${h * 0.15}, ${w * 0.6} ${h * -0.02}, ${w * 0.75} ${h * 0.08} C ${w} ${h * 0.25}, ${w * 0.9} ${h * 0.5}, ${w * 0.5} ${h * 0.8} Z`;
    }

    case "cloud": {
      return `M ${w * 0.2} ${h * 0.7} A ${w * 0.15} ${h * 0.25} 0 0 1 ${w * 0.3} ${h * 0.3} A ${w * 0.22} ${h * 0.32} 0 0 1 ${w * 0.7} ${h * 0.3} A ${w * 0.15} ${h * 0.25} 0 0 1 ${w * 0.8} ${h * 0.7} A ${w * 0.15} ${h * 0.18} 0 0 1 ${w * 0.2} ${h * 0.7} Z`;
    }

    case "cylinder":
    case "database": {
      const rx = w / 2;
      const ry = h * 0.15;
      return `M 0 ${ry} A ${rx} ${ry} 0 0 0 ${w} ${ry} V ${h - ry} A ${rx} ${ry} 0 0 1 0 ${h - ry} Z M 0 ${ry} A ${rx} ${ry} 0 1 1 ${w} ${ry} A ${rx} ${ry} 0 0 1 0 ${ry} Z`;
    }

    case "document": {
      const wave = h * 0.1;
      return `M 0 0 H ${w} V ${h - wave} Q ${w * 0.75} ${h} ${w * 0.5} ${h - wave} Q ${w * 0.25} ${h - wave * 2} 0 ${h - wave} Z`;
    }

    case "arrow-right": {
      const head = w * 0.4;
      const stemH = h * 0.3;
      return `M 0 ${(h - stemH) / 2} H ${w - head} V 0 L ${w} ${h / 2} L ${w - head} ${h} V ${(h + stemH) / 2} H 0 Z`;
    }

    case "arrow-left": {
      const head = w * 0.4;
      const stemH = h * 0.3;
      return `M ${w} ${(h - stemH) / 2} H ${head} V 0 L 0 ${h / 2} L ${head} ${h} V ${(h + stemH) / 2} H ${w} Z`;
    }

    case "arrow-up": {
      const head = h * 0.4;
      const stemW = w * 0.3;
      return `M ${(w - stemW) / 2} ${h} V ${head} H 0 L ${w / 2} 0 L ${w} ${head} H ${(w + stemW) / 2} V ${h} Z`;
    }

    case "arrow-down": {
      const head = h * 0.4;
      const stemW = w * 0.3;
      return `M ${(w - stemW) / 2} 0 V ${h - head} H 0 L ${w / 2} ${h} L ${w} ${h - head} H ${(w + stemW) / 2} V 0 Z`;
    }

    case "speech-bubble":
    case "callout": {
      const tailW = w * 0.15;
      const tailH = h * 0.25;
      const boxH = h - tailH;
      const r = 8;
      return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${boxH - r} A ${r} ${r} 0 0 1 ${w - r} ${boxH} H ${w * 0.3 + tailW} L ${w * 0.2} ${h} L ${w * 0.3} ${boxH} H ${r} A ${r} ${r} 0 0 1 0 ${boxH - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    default:
      return `M 0 0 H ${w} V ${h} H 0 Z`;
  }
}
