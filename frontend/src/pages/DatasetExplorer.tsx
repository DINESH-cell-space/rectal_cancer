import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Microscope, 
  Sparkles, 
  Layers, 
  Eye,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetImage, DatasetSummary, TissueClassMeta } from '../types';

export const DatasetExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [images, setImages] = useState<DatasetImage[]>([]);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states from URL or defaults
  const classFilter = searchParams.get('class') || 'ALL';
  const searchQuery = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 24;

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sumRes, imgRes] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getImages(page, pageSize, classFilter, searchQuery)
        ]);
        setSummary(sumRes);
        setImages(imgRes.items);
        setTotalPages(imgRes.total_pages);
        setTotalCount(imgRes.total);
      } catch (err) {
        console.error('Failed to load dataset images:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page, classFilter, searchQuery]);

  const handleClassSelect = (cId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('class', cId);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set('search', val.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const openInAnalyze = (image: DatasetImage) => {
    navigate(`/analyze?id=${image.id}`);
  };

  const openInExplain = (image: DatasetImage) => {
    navigate(`/explain?id=${image.id}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dataset Explorer
            </h1>
            <span className="rounded-full border border-biolens-cyan/40 bg-biolens-cyan/10 px-2.5 py-0.5 text-xs font-mono font-bold text-biolens-cyan">
              {totalCount} Tiles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zenodo 53169 &bull; Kather Colorectal Histopathology Micrograph Gallery (150&times;150 px)
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search filename or label..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 w-60 rounded-xl border border-slate-700/80 bg-biolens-900/90 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-biolens-cyan focus:outline-none focus:ring-1 focus:ring-biolens-cyan"
            />
          </div>

          {/* Reset Filters */}
          {(classFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Pills Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => handleClassSelect('ALL')}
          className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            classFilter === 'ALL'
              ? 'bg-biolens-cyan text-slate-950 font-bold shadow-glow-cyan'
              : 'border border-slate-800 bg-biolens-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          All Classes ({summary?.total_images || 0})
        </button>

        {summary?.classes?.map((c) => {
          const isSelected = classFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleClassSelect(c.id)}
              className={`flex-shrink-0 flex items-center space-x-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'border border-biolens-cyan bg-biolens-cyan/20 text-biolens-cyan font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'border border-slate-800 bg-biolens-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="font-mono">{c.id}</span>
              <span className="text-[10px] text-slate-500 font-mono">({c.count || 0})</span>
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-biolens-900/40 p-12 text-center">
          <Filter className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No matching histology tiles found</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or class filter.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 rounded-xl bg-biolens-cyan/20 border border-biolens-cyan/40 px-4 py-1.5 text-xs font-semibold text-biolens-cyan hover:bg-biolens-cyan/30"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="glass-panel glass-panel-hover group relative flex flex-col rounded-2xl overflow-hidden border border-slate-800/80 transition-all duration-200 hover:border-biolens-cyan/40"
            >
              {/* Image Preview */}
              <div 
                onClick={() => openInAnalyze(img)}
                className="relative aspect-square w-full cursor-pointer overflow-hidden bg-biolens-950"
              >
                <img
                  src={`/api/images/${img.id}/raw`}
                  alt={img.filename}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-108"
                />

                {/* Ground Truth Pill */}
                <div className="absolute top-2 left-2 z-10">
                  <span
                    className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase shadow-sm"
                    style={{
                      backgroundColor: `${img.class_meta?.color || '#06B6D4'}25`,
                      color: img.class_meta?.color || '#06B6D4',
                      border: `1px solid ${img.class_meta?.color || '#06B6D4'}50`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {img.ground_truth.split('_')[1] || img.ground_truth}
                  </span>
                </div>

                {/* Hover Quick Action Overlay */}
                <div className="absolute inset-0 z-20 flex items-center justify-center space-x-2 bg-biolens-950/70 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInAnalyze(img);
                    }}
                    title="Analyze Histology Tile"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-biolens-cyan text-slate-950 shadow-glow-cyan hover:scale-110 transition-transform"
                  >
                    <Microscope className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInExplain(img);
                    }}
                    title="Explain with Grad-CAM"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-biolens-violet text-white shadow-glow-violet hover:scale-110 transition-transform"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="p-2.5 bg-biolens-900/90 border-t border-slate-800/80">
                <p 
                  title={img.filename}
                  className="text-[10px] font-mono font-medium text-slate-300 truncate"
                >
                  {img.filename}
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>150&times;150</span>
                  <span className="text-slate-400">GT: {img.ground_truth.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-400 font-mono">
            Page <span className="font-bold text-white">{page}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span> ({totalCount} total items)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-biolens-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-biolens-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 hover:text-white"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
