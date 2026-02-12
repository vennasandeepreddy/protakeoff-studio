import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { Footer } from './components/Footer';
import { Layer, Shape, ToolType, ViewState, ProjectDocument } from './types';
import { X } from 'lucide-react';

// Mock Data
const INITIAL_DOC: ProjectDocument = {
  id: 'doc_01',
  name: 'A101 - Ground Floor Plan.pdf',
  // Using a placeholder blueprint image
  imageUrl: 'https://images.unsplash.com/photo-1580894908361-967195033215?q=80&w=2070&auto=format&fit=crop', 
  scale: 50, // 50 pixels = 1 unit (default)
  unit: 'ft'
};

const INITIAL_LAYERS: Layer[] = [
  { id: 'l_walls', name: 'Walls', visible: true, color: '#ef4444', type: 'linear' },
  { id: 'l_flooring', name: 'Flooring', visible: true, color: '#22c55e', type: 'area' },
  { id: 'l_electrical', name: 'Electrical', visible: true, color: '#eab308', type: 'count' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Take-off');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeLayerId, setActiveLayerId] = useState(INITIAL_LAYERS[1].id);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [currentDoc, setCurrentDoc] = useState<ProjectDocument>(INITIAL_DOC);

  // Document Tabs State
  const [openDocs, setOpenDocs] = useState([INITIAL_DOC]);
  const [activeDocId, setActiveDocId] = useState(INITIAL_DOC.id);

  // History (Basic implementation)
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when shapes change (debounced or on mouse up ideally, but here on effect for simplicity)
  // Note: Real app needs more robust history management to avoid saving every drag frame
  // We'll rely on the Canvas component to only call setShapes on "commit" (MouseUp)

  const handleSetShapes = (newShapesOrUpdater: React.SetStateAction<Shape[]>) => {
    setShapes(prev => {
      const next = typeof newShapesOrUpdater === 'function' ? newShapesOrUpdater(prev) : newShapesOrUpdater;
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return next;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const deleteSelected = () => {
    if (selectedShapeId) {
      handleSetShapes(prev => prev.filter(s => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  const setDocScale = (newScale: number) => {
    setCurrentDoc(prev => ({ ...prev, scale: newScale }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Document Tabs Bar */}
      <div className="h-9 bg-slate-200 flex items-end px-2 gap-1 border-b border-slate-300 shrink-0">
        {openDocs.map(doc => (
          <div 
            key={doc.id}
            onClick={() => setActiveDocId(doc.id)}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium cursor-pointer select-none max-w-[200px]
              ${activeDocId === doc.id 
                ? 'bg-white text-slate-800 shadow-sm border-t border-x border-slate-300 relative top-[1px]' 
                : 'bg-slate-300 text-slate-600 hover:bg-slate-200'}
            `}
          >
            <span className="truncate">{doc.name}</span>
            <button className="opacity-0 group-hover:opacity-100 hover:bg-slate-400 rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button className="px-2 py-1 text-slate-500 hover:text-slate-800 text-lg leading-none">+</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          layers={layers}
          shapes={shapes}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          toggleLayerVisibility={toggleLayerVisibility}
          currentDoc={currentDoc}
        />
        
        <main className="flex-1 flex flex-col relative min-w-0">
          <Canvas 
            activeTool={activeTool}
            viewState={viewState}
            setViewState={setViewState}
            shapes={shapes}
            setShapes={handleSetShapes}
            activeLayerId={activeLayerId}
            layers={layers}
            currentDoc={currentDoc}
            setDocScale={setDocScale}
            selectedShapeId={selectedShapeId}
            setSelectedShapeId={setSelectedShapeId}
          />
        </main>

        <Toolbar 
          activeTool={activeTool} 
          setTool={setActiveTool} 
          onDeleteSelected={deleteSelected}
          hasSelection={!!selectedShapeId}
        />
      </div>

      <Footer 
        viewState={viewState} 
        setViewState={setViewState}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
    </div>
  );
};

export default App;
