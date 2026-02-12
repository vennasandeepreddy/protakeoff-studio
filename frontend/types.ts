export type Point = { x: number; y: number };

export type ToolType = 'select' | 'pan' | 'rect' | 'circle' | 'polygon' | 'ruler' | 'scale';

export type ShapeType = 'rect' | 'circle' | 'polygon' | 'line';

export interface Shape {
  id: string;
  type: ShapeType;
  points: Point[];
  layerId: string;
  color: string;
  label?: string;
  // Calculated properties
  area?: number;
  length?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'area' | 'linear' | 'count';
}

export interface ProjectDocument {
  id: string;
  name: string;
  imageUrl: string;
  scale: number; // pixels per unit
  unit: string;
}

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}
