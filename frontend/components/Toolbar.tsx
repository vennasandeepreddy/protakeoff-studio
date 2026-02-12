import React from 'react';
import { 
  MousePointer2, 
  Hand, 
  Square, 
  Circle, 
  PenTool, 
  Ruler, 
  Scaling,
  Trash2
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setTool: (tool: ToolType) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setTool, onDeleteSelected, hasSelection }) => {
  
  const tools: { id: ToolType; icon: React.ElementType; label: string; group: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)', group: 'nav' },
    { id: 'pan', icon: Hand, label: 'Pan (H)', group: 'nav' },
    { id: 'rect', icon: Square, label: 'Rectangle (R)', group: 'draw' },
    { id: 'circle', icon: Circle, label: 'Circle (C)', group: 'draw' },
    { id: 'polygon', icon: PenTool, label: 'Polygon (P)', group: 'draw' },
    { id: 'ruler', icon: Ruler, label: 'Measure (M)', group: 'measure' },
    { id: 'scale', icon: Scaling, label: 'Calibrate Scale', group: 'measure' },
  ];

  return (
    <aside className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-6 shrink-0 z-20 shadow-sm">
      
      <div className="flex flex-col gap-2 w-full px-2">
        {tools.filter(t => t.group === 'nav').map(tool => (
          <ToolButton 
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => setTool(tool.id)}
          />
        ))}
      </div>

      <div className="w-8 h-px bg-slate-200" />

      <div className="flex flex-col gap-2 w-full px-2">
        {tools.filter(t => t.group === 'draw').map(tool => (
          <ToolButton 
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => setTool(tool.id)}
          />
        ))}
      </div>

      <div className="w-8 h-px bg-slate-200" />

      <div className="flex flex-col gap-2 w-full px-2">
        {tools.filter(t => t.group === 'measure').map(tool => (
          <ToolButton 
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => setTool(tool.id)}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 w-full px-2">
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`p-2 rounded-lg flex justify-center items-center transition-colors group relative ${
            hasSelection 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-5 h-5" />
          <span className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
            Delete Selected
          </span>
        </button>
      </div>
    </aside>
  );
};

const ToolButton = ({ tool, isActive, onClick }: { tool: any, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg flex justify-center items-center transition-all group relative ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <tool.icon className="w-5 h-5" />
    {/* Tooltip */}
    <span className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
      {tool.label}
    </span>
  </button>
);
