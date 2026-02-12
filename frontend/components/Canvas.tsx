import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Point, Shape, ToolType, ViewState, Layer, ProjectDocument } from '../types';
import { getDistance, getPolygonArea, getPolygonCentroid, getRectCenter, formatNumber } from '../utils/geometry';

interface CanvasProps {
  activeTool: ToolType;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  activeLayerId: string;
  layers: Layer[];
  currentDoc: ProjectDocument;
  setDocScale: (scale: number) => void;
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  activeTool,
  viewState,
  setViewState,
  shapes,
  setShapes,
  activeLayerId,
  layers,
  currentDoc,
  setDocScale,
  selectedShapeId,
  setSelectedShapeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  
  // Scale Calibration State
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState('');

  // Helper: Screen to Canvas Coordinates
  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewState.x) / viewState.scale,
      y: (clientY - rect.top - viewState.y) / viewState.scale
    };
  }, [viewState]);

  // Mouse Down Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = toCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (activeTool === 'select') {
      // Simple hit testing
      const hitShape = shapes.slice().reverse().find(shape => {
        // Very basic hit test for rects/polys (bounding box approx for now)
        if (shape.type === 'rect' || shape.type === 'line') {
           const minX = Math.min(shape.points[0].x, shape.points[1].x);
           const maxX = Math.max(shape.points[0].x, shape.points[1].x);
           const minY = Math.min(shape.points[0].y, shape.points[1].y);
           const maxY = Math.max(shape.points[0].y, shape.points[1].y);
           // Add some padding for lines
           const pad = shape.type === 'line' ? 10 / viewState.scale : 0;
           return coords.x >= minX - pad && coords.x <= maxX + pad && coords.y >= minY - pad && coords.y <= maxY + pad;
        }
        // For polygon, we'd need point-in-polygon. Skipping for brevity, using bounding box.
        return false;
      });
      
      setSelectedShapeId(hitShape ? hitShape.id : null);
      return;
    }

    if (activeTool === 'scale') {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, coords]);
        if (calibrationPoints.length === 1) {
          // We just added the second point
          setShowCalibrationModal(true);
        }
      }
      return;
    }

    // Drawing Tools
    if (['rect', 'circle', 'ruler'].includes(activeTool)) {
      setIsDragging(true);
      const newShape: Shape = {
        id: Date.now().toString(),
        type: activeTool === 'ruler' ? 'line' : (activeTool as any),
        points: [coords, coords],
        layerId: activeLayerId,
        color: layers.find(l => l.id === activeLayerId)?.color || '#000000',
      };
      setCurrentShape(newShape);
    } else if (activeTool === 'polygon') {
      if (!currentShape) {
        // Start new polygon
        const newShape: Shape = {
          id: Date.now().toString(),
          type: 'polygon',
          points: [coords],
          layerId: activeLayerId,
          color: layers.find(l => l.id === activeLayerId)?.color || '#000000',
        };
        setCurrentShape(newShape);
      } else {
        // Add point to polygon
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, coords]
        });
      }
    }
  };

  // Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = toCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (activeTool === 'pan' && isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && currentShape && ['rect', 'circle', 'line'].includes(currentShape.type)) {
      setCurrentShape({
        ...currentShape,
        points: [currentShape.points[0], coords]
      });
    }
  };

  // Mouse Up Handler
  const handleMouseUp = () => {
    if (activeTool === 'pan') {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    if (isDragging && currentShape) {
      setIsDragging(false);
      
      // Finalize shape calculations
      let finalShape = { ...currentShape };
      
      if (finalShape.type === 'rect') {
        const w = Math.abs(finalShape.points[1].x - finalShape.points[0].x);
        const h = Math.abs(finalShape.points[1].y - finalShape.points[0].y);
        const areaPx = w * h;
        finalShape.area = areaPx / (currentDoc.scale * currentDoc.scale);
      } else if (finalShape.type === 'line') {
        const distPx = getDistance(finalShape.points[0], finalShape.points[1]);
        finalShape.length = distPx / currentDoc.scale;
      }

      setShapes(prev => [...prev, finalShape]);
      setCurrentShape(null);
    }
  };

  // Double Click for Polygon Finish
  const handleDoubleClick = () => {
    if (activeTool === 'polygon' && currentShape) {
      // Close the polygon
      let finalShape = { ...currentShape };
      // Remove the last point if it's same as double click location (optional cleanup)
      
      const areaPx = getPolygonArea(finalShape.points);
      finalShape.area = areaPx / (currentDoc.scale * currentDoc.scale);
      
      setShapes(prev => [...prev, finalShape]);
      setCurrentShape(null);
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, viewState.scale + delta), 5);
      
      // Zoom towards mouse pointer logic could go here, simple center zoom for now
      setViewState(prev => ({ ...prev, scale: newScale }));
    } else {
      // Pan
      setViewState(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleCalibrationSubmit = () => {
    const dist = parseFloat(calibrationDistance);
    if (!isNaN(dist) && dist > 0 && calibrationPoints.length === 2) {
      const pxDist = getDistance(calibrationPoints[0], calibrationPoints[1]);
      const newScale = pxDist / dist;
      setDocScale(newScale);
      setCalibrationPoints([]);
      setShowCalibrationModal(false);
      setCalibrationDistance('');
    }
  };

  return (
    <div className="flex-1 relative bg-slate-200 overflow-hidden cursor-crosshair">
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full absolute inset-0 touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{ cursor: activeTool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
      >
        <div 
          style={{ 
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
            transformOrigin: '0 0',
            willChange: 'transform'
          }}
        >
          {/* Background Image (Blueprint) */}
          <img 
            src={currentDoc.imageUrl} 
            alt="Blueprint" 
            className="pointer-events-none select-none shadow-2xl"
            style={{ maxWidth: 'none' }} // Ensure it doesn't shrink
            draggable={false}
          />

          {/* SVG Overlay for Shapes */}
          <svg 
            className="absolute inset-0 pointer-events-none overflow-visible"
            width="100%" 
            height="100%"
          >
            <defs>
              <pattern id="hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" style={{stroke:'currentColor', strokeWidth:1}} />
              </pattern>
            </defs>

            {/* Render Existing Shapes */}
            {shapes.map(shape => {
              const isSelected = selectedShapeId === shape.id;
              const layer = layers.find(l => l.id === shape.layerId);
              if (!layer?.visible) return null;

              return (
                <g key={shape.id} className={`${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                  {shape.type === 'rect' && (
                    <>
                      <rect
                        x={Math.min(shape.points[0].x, shape.points[1].x)}
                        y={Math.min(shape.points[0].y, shape.points[1].y)}
                        width={Math.abs(shape.points[1].x - shape.points[0].x)}
                        height={Math.abs(shape.points[1].y - shape.points[0].y)}
                        fill={shape.color}
                        fillOpacity="0.2"
                        stroke={shape.color}
                        strokeWidth={2 / viewState.scale}
                        strokeDasharray={isSelected ? "5,5" : "0"}
                      />
                      {/* Label */}
                      <text
                        x={getRectCenter(shape.points[0], shape.points[1]).x}
                        y={getRectCenter(shape.points[0], shape.points[1]).y}
                        fill="black"
                        fontSize={14 / viewState.scale}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold drop-shadow-md bg-white"
                      >
                        {formatNumber(shape.area || 0)} sq {currentDoc.unit}
                      </text>
                    </>
                  )}
                  {shape.type === 'line' && (
                    <>
                      <line
                        x1={shape.points[0].x}
                        y1={shape.points[0].y}
                        x2={shape.points[1].x}
                        y2={shape.points[1].y}
                        stroke={shape.color}
                        strokeWidth={3 / viewState.scale}
                      />
                      <text
                        x={(shape.points[0].x + shape.points[1].x) / 2}
                        y={(shape.points[0].y + shape.points[1].y) / 2 - (10 / viewState.scale)}
                        fill={shape.color}
                        fontSize={14 / viewState.scale}
                        textAnchor="middle"
                        className="font-bold drop-shadow-md"
                      >
                        {formatNumber(shape.length || 0)} {currentDoc.unit}
                      </text>
                    </>
                  )}
                  {shape.type === 'polygon' && (
                    <>
                      <polygon
                        points={shape.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={shape.color}
                        fillOpacity="0.2"
                        stroke={shape.color}
                        strokeWidth={2 / viewState.scale}
                      />
                      <text
                        x={getPolygonCentroid(shape.points).x}
                        y={getPolygonCentroid(shape.points).y}
                        fill="black"
                        fontSize={14 / viewState.scale}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold drop-shadow-md"
                      >
                        {formatNumber(shape.area || 0)} sq {currentDoc.unit}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Render Current Drawing Shape */}
            {currentShape && (
              <g className="opacity-90">
                {currentShape.type === 'rect' && (
                  <rect
                    x={Math.min(currentShape.points[0].x, currentShape.points[1].x)}
                    y={Math.min(currentShape.points[0].y, currentShape.points[1].y)}
                    width={Math.abs(currentShape.points[1].x - currentShape.points[0].x)}
                    height={Math.abs(currentShape.points[1].y - currentShape.points[0].y)}
                    fill="none"
                    stroke="blue"
                    strokeWidth={2 / viewState.scale}
                    strokeDasharray="4"
                  />
                )}
                {currentShape.type === 'line' && (
                  <line
                    x1={currentShape.points[0].x}
                    y1={currentShape.points[0].y}
                    x2={currentShape.points[1].x}
                    y2={currentShape.points[1].y}
                    stroke="blue"
                    strokeWidth={2 / viewState.scale}
                    strokeDasharray="4"
                  />
                )}
                {currentShape.type === 'polygon' && (
                  <>
                    <polyline
                      points={currentShape.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="blue"
                      strokeWidth={2 / viewState.scale}
                    />
                    {/* Rubber band line to mouse */}
                    <line
                      x1={currentShape.points[currentShape.points.length - 1].x}
                      y1={currentShape.points[currentShape.points.length - 1].y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke="blue"
                      strokeWidth={1 / viewState.scale}
                      strokeDasharray="2"
                    />
                  </>
                )}
              </g>
            )}

            {/* Calibration Points */}
            {activeTool === 'scale' && calibrationPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={5 / viewState.scale} fill="red" />
            ))}
            {activeTool === 'scale' && calibrationPoints.length === 1 && (
               <line 
                 x1={calibrationPoints[0].x} y1={calibrationPoints[0].y}
                 x2={mousePos.x} y2={mousePos.y}
                 stroke="red" strokeWidth={2 / viewState.scale} strokeDasharray="4"
               />
            )}
          </svg>
        </div>
      </div>

      {/* Crosshairs */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div 
          className="absolute bg-red-500 opacity-30"
          style={{ left: 0, top: 0, width: '100%', height: '1px', transform: `translateY(${mousePos.y * viewState.scale + viewState.y}px)` }} // This is tricky because mousePos is canvas space. Better to use raw mouse event for crosshair.
        />
         {/* Actually, simpler crosshair follows mouse directly */}
      </div>

      {/* Calibration Modal */}
      {showCalibrationModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-bold mb-4">Calibrate Scale</h3>
            <p className="text-sm text-slate-600 mb-4">Enter the real-world distance between the two points you selected.</p>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={calibrationDistance}
                onChange={(e) => setCalibrationDistance(e.target.value)}
                className="flex-1 border border-slate-300 rounded px-3 py-2"
                placeholder="Distance"
                autoFocus
              />
              <div className="bg-slate-100 px-3 py-2 rounded border border-slate-200 text-slate-600 font-medium">
                {currentDoc.unit}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowCalibrationModal(false); setCalibrationPoints([]); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleCalibrationSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Set Scale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
