import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Eye, EyeOff, FolderOpen, Layers } from 'lucide-react';
import { Layer, Shape, ProjectDocument } from '../types';
import { formatNumber } from '../utils/geometry';

interface SidebarProps {
  layers: Layer[];
  shapes: Shape[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  currentDoc: ProjectDocument;
}

export const Sidebar: React.FC<SidebarProps> = ({
  layers,
  shapes,
  activeLayerId,
  setActiveLayerId,
  toggleLayerVisibility,
  currentDoc
}) => {
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [docExpanded, setDocExpanded] = useState(true);

  // Calculate totals per layer
  const getLayerTotal = (layerId: string) => {
    const layerShapes = shapes.filter(s => s.layerId === layerId);
    const layer = layers.find(l => l.id === layerId);
    
    if (!layer) return '0';

    let total = 0;
    layerShapes.forEach(s => {
      if (layer.type === 'area') total += s.area || 0;
      if (layer.type === 'linear') total += s.length || 0;
      if (layer.type === 'count') total += 1;
    });

    return `${formatNumber(total)} ${layer.type === 'count' ? 'qty' : (layer.type === 'area' ? 'sq ' + currentDoc.unit : currentDoc.unit)}`;
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-10">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Explorer</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {/* Project Level */}
        <div className="mb-2">
          <div 
            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-slate-700 font-medium"
            onClick={() => setProjectExpanded(!projectExpanded)}
          >
            {projectExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <FolderOpen className="w-4 h-4 text-blue-500" />
            <span>Project 01</span>
          </div>

          {projectExpanded && (
            <div className="ml-4 border-l border-slate-200 pl-2 mt-1">
              {/* Document Level */}
              <div 
                className="flex items-center gap-2 p-2 bg-blue-50 rounded text-blue-700 font-medium text-sm mb-2"
                onClick={() => setDocExpanded(!docExpanded)}
              >
                {docExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <File className="w-3 h-3" />
                <span>{currentDoc.name}</span>
                <div className="ml-auto flex gap-2">
                   <Eye className="w-3 h-3 text-blue-400" />
                </div>
              </div>

              {/* Layers Level */}
              {docExpanded && (
                <div className="ml-4 space-y-1">
                  {layers.map(layer => (
                    <div 
                      key={layer.id}
                      className={`group flex items-center gap-2 p-2 rounded text-sm cursor-pointer border ${
                        activeLayerId === layer.id 
                          ? 'bg-slate-100 border-slate-200' 
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                      onClick={() => setActiveLayerId(layer.id)}
                    >
                      <div 
                        className="p-1 hover:bg-slate-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                      >
                        {layer.visible ? (
                          <Eye className="w-3 h-3 text-slate-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                      
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: layer.color }}></div>
                      
                      <div className="flex-1 truncate">
                        <span className={activeLayerId === layer.id ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                          {layer.name}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                        {getLayerTotal(layer.id)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mini Status / Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex justify-between mb-1">
          <span>Scale:</span>
          <span className="font-mono font-medium text-slate-700">1 {currentDoc.unit} = {formatNumber(currentDoc.scale)} px</span>
        </div>
        <div className="flex justify-between">
          <span>Shapes:</span>
          <span className="font-mono font-medium text-slate-700">{shapes.length}</span>
        </div>
      </div>
    </aside>
  );
};
