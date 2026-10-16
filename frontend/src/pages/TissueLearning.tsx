import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Layers, 
  Eye, 
  Microscope, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { TissueClassMeta } from '../types';

export const TissueLearning: React.FC = () => {
  const [classes, setClasses] = useState<TissueClassMeta[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('01_TUMOR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const showcase = await api.getClassShowcase();
        setClasses(showcase);
        if (showcase.length > 0) {
          setSelectedClassId(showcase[0].id);
        }
      } catch (err) {
        console.error('Failed to load showcase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Colorectal Histopathology Atlas
          </h1>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
            8 Tissue Classes
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Interactive morphological reference for Kather et al. Zenodo 53169 histological tissue phenotypes.
        </p>
      </div>

      {/* Class Selector Tab Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        {classes.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex-shrink-0 flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'border border-biolens-cyan bg-biolens-cyan/20 text-biolens-cyan font-bold shadow-glow-cyan'
                  : 'border border-slate-800 bg-biolens-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cls.color }}
              />
              <span className="font-mono">{cls.id}</span>
            </button>
          );
        })}
      </div>

      {activeClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Educational Content & Clinical Significance (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: activeClass.color }}
                    />
                    <h2 className="text-xl font-bold text-white">
                      {activeClass.name} ({activeClass.code})
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Class ID: {activeClass.id} &bull; Total Tiles: {activeClass.total_in_dataset || 'Multiple'}
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold font-mono"
                  style={{
                    backgroundColor: `${activeClass.color}20`,
                    color: activeClass.color,
                    border: `1px solid ${activeClass.color}40`,
                  }}
                >
                  {activeClass.badge}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-biolens-cyan">
                  Overview & Definition
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeClass.description}
                </p>
              </div>

              {/* Morphology */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-biolens-950/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-biolens-violet-bright">
                  Cytological & Morphological Characteristics
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeClass.morphology}
                </p>
              </div>

              {/* Clinical Significance */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Clinical & Pathological Significance
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeClass.clinical_significance}
                </p>
              </div>

              {/* Differential Diagnosis */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Differential Diagnosis & Distinctions
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeClass.differential}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  to={`/explore?class=${activeClass.id}`}
                  className="inline-flex items-center space-x-2 rounded-xl bg-biolens-cyan/15 border border-biolens-cyan/40 px-4 py-2 text-xs font-bold text-biolens-cyan hover:bg-biolens-cyan/25 transition-all shadow-glow-cyan"
                >
                  <Eye className="h-4 w-4" />
                  <span>Browse All {activeClass.id} Images in Explorer</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Representative Dataset Micrographs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Representative Dataset Biopsies
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">150&times;150 px H&E Tiles</span>
              </div>

              {/* 2x2 Image Grid of sample images */}
              <div className="grid grid-cols-2 gap-3">
                {activeClass.sample_image_ids?.map((imgId, idx) => (
                  <Link
                    key={imgId}
                    to={`/analyze?id=${imgId}`}
                    className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-biolens-cyan/60 transition-all bg-biolens-950 aspect-square"
                  >
                    <img
                      src={`/api/images/${imgId}/raw`}
                      alt={`Sample ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-biolens-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-biolens-cyan text-[11px] font-bold">
                      <Microscope className="h-4 w-4" />
                      <span>Analyze</span>
                    </div>
                  </Link>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 italic text-center">
                Click any specimen to open it in the high-magnification analysis workspace.
              </p>
            </div>

            {/* Research Disclaimer */}
            <div className="rounded-xl border border-slate-800 bg-biolens-900/40 p-4 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>Reference Standard</span>
              </div>
              <p>
                Descriptions follow standard gastrointestinal pathology guidelines (AJCC / WHO Colorectal Tumor Classification).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
