export type CanvasTool =
  | "select"
  | "hand"
  | "task"
  | "draw"
  | "shape"
  | "connector"
  | "sticky"
  | "text"
  | "frame"
  | "image"
  | "mindmap";

export type ShapeType =
  // Basic
  | "rectangle"
  | "rounded-rect"
  | "circle"
  | "ellipse"
  | "triangle"
  | "right-triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "parallelogram"
  | "trapezoid"
  | "star"
  | "cross"
  | "heart"
  | "speech-bubble"
  | "cloud"
  // Flowchart
  | "process"
  | "decision"
  | "start-end"
  | "input-output"
  | "document"
  | "database"
  | "delay"
  | "stored-data"
  // Arrows
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "arrow-double"
  | "block-arrow"
  // Diagram
  | "cylinder"
  | "cube"
  | "funnel"
  | "callout";

export type ConnectorType = "straight" | "elbow" | "curved";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowHead = "none" | "arrow" | "triangle" | "circle";
export type AnchorPosition = "top" | "right" | "bottom" | "left";

export interface Point {
  x: number;
  y: number;
}

export type ObjectType =
  | "shape"
  | "sticky"
  | "text"
  | "task"
  | "image"
  | "frame"
  | "connector"
  | "drawing";

export interface BaseCanvasObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
}

export type DrawingToolType = "pen" | "pencil" | "highlighter";

export interface ShapeObject extends BaseCanvasObject {
  type: "shape";
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: LineStyle;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
}

export interface StickyNoteObject extends BaseCanvasObject {
  type: "sticky";
  color: string;
  text: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
}

export interface TextObject extends BaseCanvasObject {
  type: "text";
  text: string;
  color: string;
  fontSize: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
}

export interface TaskCardObject extends BaseCanvasObject {
  type: "task";
  taskId: string;
  taskTitle: string;
  projectName: string;
  spaceName?: string;
  status: string;
  priority: string;
  assigneeName?: string;
  assigneeInitials?: string;
  assigneeColor?: string;
  dueDate?: string;
}

export interface ImageObject extends BaseCanvasObject {
  type: "image";
  src: string;
  caption?: string;
}

export interface FrameObject extends BaseCanvasObject {
  type: "frame";
  title: string;
  stroke: string;
  fill: string;
}

export interface DrawingObject extends BaseCanvasObject {
  type: "drawing";
  points: Point[];
  color: string;
  strokeWidth: number;
  opacity?: number;
  toolType?: DrawingToolType;
}

export interface ConnectorObject extends BaseCanvasObject {
  type: "connector";
  fromId?: string;
  fromAnchor?: AnchorPosition;
  toId?: string;
  toAnchor?: AnchorPosition;
  connectorType: ConnectorType;
  strokeStyle: LineStyle;
  stroke: string;
  strokeWidth: number;
  startArrow?: ArrowHead;
  endArrow?: ArrowHead;
  label?: string;
}

export type CanvasObject =
  | ShapeObject
  | StickyNoteObject
  | TextObject
  | TaskCardObject
  | ImageObject
  | FrameObject
  | DrawingObject
  | ConnectorObject;

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface WhiteboardState {
  id: string;
  title: string;
  objects: CanvasObject[];
  zoom: number;
  pan: Point;
  selectedIds: string[];
  activeTool: CanvasTool;
  selectedShapeType: ShapeType;
  selectedStickyColor: string;
  selectedConnectorType: ConnectorType;
  penColor: string;
  penWidth: number;
}
