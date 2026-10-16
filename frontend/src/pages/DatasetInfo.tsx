import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, Layers, ArrowRight, ExternalLink, ShieldCheck, Microscope } from 'lucide-react';
import { api } from '../services/api';
import { DatasetSummary } from '../types';

export const DatasetInfo: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);

  useEffect(() => {
    api.getDatasetSummary().then(setSummary).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dataset Information & Citation
          </h1>
          <span className="rounded-full border border-biolens-cyan/40 bg-biolens-cyan/10 px-2.5 py-0.5 text-xs font-mono font-bold text-biolens-cyan">
            Zenodo 53169
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed metadata, citation standards, and tissue class distributions for the colorectal histology benchmark.
        </p>
      </div>

      {/* Dataset Overview Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Database className="h-5 w-5 text-biolens-cyan" />
          <span>Kather Colorectal Histology Benchmark (CRC-5000)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-2">
          <div className="rounded-xl border border-slate-800 bg-biolens-950 p-4">
            <span className="text-slate-500 text-[10px] block">TOTAL SPECIMEN TILES</span>
            <span className="text-2xl font-bold text-white">{summary?.total_images || 5000}</span>
            <span className="text-slate-400 text-[10px] block mt-1">625 images / class</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-biolens-950 p-4">
            <span className="text-slate-500 text-[10px] block">PATCH RESOLUTION</span>
            <span className="text-2xl font-bold text-biolens-cyan">150 &times; 150 px</span>
            <span className="text-slate-400 text-[10px] block mt-1">0.5 &mu;m per pixel (20x)</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-biolens-950 p-4">
            <span className="text-slate-500 text-[10px] block">STAINING PROTOCOL</span>
            <span className="text-2xl font-bold text-biolens-violet-bright">H&E</span>
            <span className="text-slate-400 text-[10px] block mt-1">Hematoxylin & Eosin</span>
          </div>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed pt-2 space-y-2">
          <p>
            The dataset consists of 5,000 histological image tiles of human colorectal cancer (CRC) and normal colorectal tissue. 
            All images are 150&times;150 pixels, extracted from whole-slide images (WSI) digitized at 20&times; magnification (0.5 &mu;m/pixel) 
            at the University Medical Center Mannheim (Heidelberg University) and the Medical Faculty Mannheim.
          </p>
          <p className="text-slate-400 text-[11px]">
            <strong>Scientific Reference:</strong> Kather JN, Weis CA, Bianconi F, et al. Multi-class texture analysis in colorectal cancer histology. 
            <em>Scientific Reports</em> 6, 27988 (2016). DOI: 10.1038/srep27988. Zenodo Record 53169.
          </p>
        </div>
      </div>

      {/* Stratified Partition Scheme */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          <span>Stratified Data Partition Scheme</span>
        </h2>
        <p className="text-xs text-slate-400">
          Evaluated according to rectal cancer.py train/val/test splitting pipeline:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <span className="text-emerald-400 font-bold block mb-1">Training Split (70%)</span>
            <span className="text-xl font-bold text-white">3,500 Images</span>
            <span className="text-slate-400 text-[10px] block mt-1">Used for backpropagation & weight updates</span>
          </div>
          <div className="rounded-xl border border-biolens-cyan/20 bg-biolens-cyan/10 p-4">
            <span className="text-biolens-cyan font-bold block mb-1">Validation Split (15%)</span>
            <span className="text-xl font-bold text-white">750 Images</span>
            <span className="text-slate-400 text-[10px] block mt-1">Early stopping & learning rate scheduling</span>
          </div>
          <div className="rounded-xl border border-biolens-violet/20 bg-biolens-violet/10 p-4">
            <span className="text-biolens-violet-bright font-bold block mb-1">Test Split (15%)</span>
            <span className="text-xl font-bold text-white">750 Images</span>
            <span className="text-slate-400 text-[10px] block mt-1">Held-out final evaluation (91.73% accuracy)</span>
          </div>
        </div>
      </div>

      {/* Class List Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Verified 8-Class Histological Categories</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {summary?.classes?.map((cls) => (
            <Link
              key={cls.id}
              to={`/explore?class=${cls.id}`}
              className="glass-panel-hover rounded-xl border border-slate-800 bg-biolens-950 p-4 block space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cls.color }}
                />
                <span className="text-[10px] font-mono text-slate-500">
                  {cls.count || 0} tiles
                </span>
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-white group-hover:text-biolens-cyan transition-colors">
                  {cls.id}
                </span>
                <p className="text-[11px] text-slate-400 truncate">{cls.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
