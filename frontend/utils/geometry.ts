import { Point } from '../types';

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Shoelace formula for polygon area
export const getPolygonArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export const getPolygonCentroid = (points: Point[]): Point => {
  let x = 0, y = 0, area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const f = points[i].x * points[j].y - points[j].x * points[i].y;
    area += f;
    x += (points[i].x + points[j].x) * f;
    y += (points[i].y + points[j].y) * f;
  }
  area *= 3;
  return { x: x / area, y: y / area };
};

export const getRectCenter = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
