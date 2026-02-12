import React from 'react';
import { Layout, FileText, Settings, ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 relative">
      {/* Branding */}
      <div className="flex items-center gap-2 w-64">
        <div className="bg-blue-600 p-1.5 rounded-md">
          <Layout className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">ProTakeoff</span>
      </div>

      {/* Workflow Tabs */}
      <div className="flex-1 flex justify-center">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['Take-off', 'Estimate', 'Plan'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* User / Settings */}
      <div className="w-64 flex justify-end items-center gap-4">
        <button className="text-slate-500 hover:text-slate-800">
          <Settings className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
            JD
          </div>
        </div>
      </div>
    </header>
  );
};
