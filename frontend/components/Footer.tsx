import React from 'react';
import { Minus, Plus, Undo, Redo } from 'lucide-react';
import { ViewState } from '../types';

interface FooterProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  viewState, 
  setViewState, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo
}) => {
  const handleZoom = (delta: number) => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + delta))
    }));
  };

  return (
    <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-4 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className={`p-1 rounded hover:bg-slate-100 ${!canUndo ? 'text-slate-300' : 'text-slate-600'}`}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button 
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded hover:bg-slate-100 ${!canRedo ? 'text-slate-300' : 'text-slate-600'}`}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
        <div className="h-4 w-px bg-slate-300" />
        <span className="text-xs text-slate-500">Ready</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => handleZoom(-0.1)}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="w-32 px-2">
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={viewState.scale}
            onChange={(e) => setViewState(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <button 
          onClick={() => handleZoom(0.1)}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <span className="text-xs font-mono w-12 text-right">
          {Math.round(viewState.scale * 100)}%
        </span>
      </div>
    </footer>
  );
};
