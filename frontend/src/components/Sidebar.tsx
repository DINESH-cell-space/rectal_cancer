import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Grid, 
  Microscope, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Database, 
  Cpu, 
  Settings,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { DatasetSummary, ModelInfo } from '../types';

interface SidebarProps {
  datasetSummary?: DatasetSummary | null;
  modelInfo?: ModelInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ datasetSummary, modelInfo }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/explore', label: 'Dataset Explorer', icon: Grid },
    { to: '/analyze', label: 'Image Analysis', icon: Microscope },
    { to: '/explain', label: 'Explain the Prediction', icon: Sparkles },
    { to: '/learn', label: 'Tissue Class Learning', icon: BookOpen },
    { to: '/reports', label: 'Image Report', icon: FileText },
    { to: '/dataset-info', label: 'Dataset Information', icon: Database },
    { to: '/model-info', label: 'Model Information', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-40 w-64 border-r border-biolens-cyan/15 bg-biolens-950/90 backdrop-blur-2xl flex flex-col justify-between p-4">
      {/* Navigation Menu */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Intelligence Suite
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex items-center space-x-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-biolens-violet/20 to-biolens-cyan/10 text-white font-semibold border border-biolens-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive
                            ? 'text-biolens-cyan'
                            : 'text-slate-400 group-hover:text-biolens-cyan-bright'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-biolens-cyan shadow-glow-cyan" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Specimen Class Chips */}
        <div className="px-3 pt-2 border-t border-slate-800/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
            <span>Tissue Classes</span>
            <span className="text-[9px] text-biolens-cyan">8 Classes</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'TUM', label: 'TUMOR', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
              { id: 'STR', label: 'STROMA', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
              { id: 'CPX', label: 'COMPLEX', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
              { id: 'LYM', label: 'LYMPHO', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
              { id: 'DEB', label: 'DEBRIS', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
              { id: 'MUC', label: 'MUCOSA', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
              { id: 'ADI', label: 'ADIPOSE', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
              { id: 'EMP', label: 'EMPTY', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
            ].map((cls) => (
              <span
                key={cls.id}
                className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium ${cls.color}`}
              >
                {cls.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status & Research Disclaimer */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {/* Dataset status card */}
        <div className="rounded-xl border border-biolens-cyan/20 bg-slate-900/60 p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Indexed Tiles</span>
            <span className="font-mono font-bold text-biolens-cyan">
              {datasetSummary?.total_images || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Architecture</span>
            <span className="font-mono text-[10px] text-biolens-violet-bright">
              Colorectal CNN
            </span>
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-950/20 p-2">
          <ShieldAlert className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[9.5px] leading-tight text-red-300/80">
            <strong>Research Use Only.</strong> Not for clinical diagnostic use.
          </p>
        </div>
      </div>
    </aside>
  );
};
