import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Cpu, 
  Database, 
  FileText, 
  BookOpen, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { ModelInfo, DatasetSummary } from '../types';

interface NavbarProps {
  modelInfo?: ModelInfo | null;
  datasetSummary?: DatasetSummary | null;
}

export const Navbar: React.FC<NavbarProps> = ({ modelInfo, datasetSummary }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/explore', label: 'Explore' },
    { path: '/analyze', label: 'Analyze' },
    { path: '/explain', label: 'Explain' },
    { path: '/learn', label: 'Learn' },
    { path: '/reports', label: 'Reports' },
    { path: '/model-info', label: 'Model' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isModelReady = modelInfo?.is_loaded;

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-biolens-cyan/20 bg-biolens-950/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-biolens-violet via-indigo-600 to-biolens-cyan p-0.5 shadow-glow-cyan transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-biolens-950">
                <Activity className="h-5 w-5 text-biolens-cyan transition-transform group-hover:rotate-12" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white via-cyan-200 to-biolens-cyan bg-clip-text text-transparent">
                  BioLens AI
                </span>
                <span className="rounded-full border border-biolens-violet/40 bg-biolens-violet/10 px-2 py-0.5 text-[10px] font-semibold text-biolens-violet-bright">
                  2030 XAI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 tracking-wide">
                Colorectal Tissue Intelligence Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'text-biolens-cyan bg-biolens-cyan/10 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)] border border-biolens-cyan/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-6 -translate-x-1/2 bg-gradient-to-r from-biolens-violet to-biolens-cyan rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Search & Model Status Pill */}
        <div className="flex items-center space-x-4">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search images, classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-52 rounded-full border border-slate-700/60 bg-biolens-900/80 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 transition-all focus:w-64 focus:border-biolens-cyan focus:outline-none focus:ring-1 focus:ring-biolens-cyan"
            />
          </form>

          {/* Model Status Indicator */}
          <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs">
            {isModelReady ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-medium">
                  CNN Active (Keras)
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono text-[11px] text-amber-300 font-medium">
                  Model Weights Pending
                </span>
              </>
            )}
          </div>

          {/* Dataset Pill */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-400 border border-slate-800/80 bg-slate-900/40 rounded-full px-2.5 py-1 font-mono text-[11px]">
            <Database className="h-3 w-3 text-biolens-cyan" />
            <span>{datasetSummary?.total_images || 0} tiles</span>
          </div>
        </div>
      </div>
    </header>
  );
};
