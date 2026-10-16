import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  Cpu, 
  Sparkles, 
  Layers, 
  FileText, 
  Microscope, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { api } from '../services/api';
import { DatasetSummary, ModelInfo } from '../types';

const CLASS_COLORS: Record<string, string> = {
  '01_TUMOR': '#EF4444',
  '02_STROMA': '#F59E0B',
  '03_COMPLEX': '#8B5CF6',
  '04_LYMPHO': '#3B82F6',
  '05_DEBRIS': '#6B7280',
  '06_MUCOSA': '#10B981',
  '07_ADIPOSE': '#06B6D4',
  '08_EMPTY': '#94A3B8'
};

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, modelRes] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getModelInfo().catch(() => null)
        ]);
        setSummary(sumRes);
        setModelInfo(modelRes);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = summary?.classes?.map((c) => ({
    name: c.id.replace(/^\d+_/, ''),
    fullName: c.name,
    count: c.count || 0,
    color: CLASS_COLORS[c.id] || '#06B6D4',
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero 2030 Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-biolens-cyan/25 bg-gradient-to-br from-biolens-900 via-biolens-850 to-biolens-950 p-8 shadow-panel-glass">
        {/* Glow orb decorations */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-biolens-violet/20 blur-3xl" />
        <div className="absolute -bottom-20 right-48 h-64 w-64 rounded-full bg-biolens-cyan/15 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-biolens-cyan/40 bg-biolens-cyan/10 px-3 py-1 text-xs font-semibold text-biolens-cyan">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Futuristic Colorectal Histopathology Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            BioLens AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-biolens-cyan via-cyan-200 to-biolens-violet">Platform</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            High-precision deep learning analysis for colorectal tissue classification coupled with 
            gradient-weighted class activation mapping (Grad-CAM) to deliver transparent, 
            explainable cellular feature insights.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/explore"
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-biolens-cyan to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-glow-cyan hover:opacity-95 transition-all"
            >
              <Eye className="h-4 w-4" />
              <span>Explore Dataset</span>
            </Link>

            <Link
              to="/analyze"
              className="inline-flex items-center space-x-2 rounded-xl border border-biolens-violet/40 bg-biolens-violet/20 px-5 py-2.5 text-xs font-bold text-biolens-violet-bright shadow-glow-violet hover:bg-biolens-violet/30 transition-all"
            >
              <Microscope className="h-4 w-4" />
              <span>Analyze Histology Tile</span>
            </Link>

            <Link
              to="/explain"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
            >
              <BrainCircuit className="h-4 w-4 text-biolens-cyan" />
              <span>Explain Predictions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Indexed Images */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-biolens-cyan/20">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Histology Tiles</span>
            <div className="rounded-xl bg-biolens-cyan/10 p-2 text-biolens-cyan">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {summary?.total_images || 0}
            </span>
            <span className="text-xs text-slate-400">Zenodo tiles</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Kather 2016 CRC Benchmark
          </p>
        </div>

        {/* Metric 2: Tissue Classes */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-biolens-violet/20">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tissue Classes</span>
            <div className="rounded-xl bg-biolens-violet/10 p-2 text-biolens-violet-bright">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">8</span>
            <span className="text-xs text-slate-400">phenotypes</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Tumor, Stroma, Lympho, etc.
          </p>
        </div>

        {/* Metric 3: Model Accuracy */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Test Accuracy</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {modelInfo?.test_metrics?.test_accuracy 
                ? `${(modelInfo.test_metrics.test_accuracy * 100).toFixed(2)}%`
                : '91.73%'}
            </span>
            <span className="text-xs text-slate-400">macro eval</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Colab Test Set (750 tiles)
          </p>
        </div>

        {/* Metric 4: Model Status */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-biolens-cyan/20">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">CNN Inference</span>
            <div className="rounded-xl bg-biolens-cyan/10 p-2 text-biolens-cyan">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-lg font-bold font-mono text-white truncate">
              {modelInfo?.is_loaded ? 'Active (Keras)' : 'Weights Pending'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">
            {modelInfo?.last_conv_layer ? `Grad-CAM: ${modelInfo.last_conv_layer}` : 'Conv2D Available'}
          </p>
        </div>
      </div>

      {/* Main Grid: Distribution Chart & Architecture Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Chart (2 cols) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Dataset Tissue Class Distribution</h2>
              <p className="text-xs text-slate-400">Verified tile distribution across all 8 colorectal classes</p>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold text-biolens-cyan hover:underline flex items-center space-x-1"
            >
              <span>Explore Gallery</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-700 bg-biolens-900/95 p-3 shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-bold text-white">{data.fullName}</p>
                          <p className="text-[11px] font-mono text-biolens-cyan mt-1">
                            Count: {data.count} tiles
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deep Learning Specifications (1 col) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Model & Pipeline State</h2>
            <p className="text-xs text-slate-400 mb-4">Architecture properties extracted from rectal cancer.py</p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Architecture</span>
                <span className="font-semibold text-biolens-cyan">Colorectal_Histology_CNN</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Input Tile Dimensions</span>
                <span className="font-semibold text-white">150 &times; 150 &times; 3</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Normalization</span>
                <span className="font-semibold text-white">1.0 / 255.0 (Float32)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Target Conv Layer</span>
                <span className="font-semibold text-biolens-violet-bright">
                  {modelInfo?.last_conv_layer || 'conv2d_3'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">XAI Method</span>
                <span className="font-semibold text-emerald-400">Grad-CAM (GradientTape)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Parameters</span>
                <span className="font-semibold text-white">
                  {modelInfo?.parameters_count ? modelInfo.parameters_count.toLocaleString() : '~400,000'}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/model-info"
            className="w-full flex items-center justify-center space-x-2 rounded-xl border border-biolens-cyan/30 bg-biolens-cyan/10 py-2.5 text-xs font-bold text-biolens-cyan hover:bg-biolens-cyan/20 transition-all"
          >
            <span>View Full Architecture & Metrics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Launchpad to all 5 Core Sections */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Core Workstation Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/explore"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-biolens-cyan/10 p-2 text-biolens-cyan">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-biolens-cyan transition-colors">
                Dataset Explorer
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browse, filter by class, search histological tiles, and inspect specimen ground-truth annotations.
            </p>
          </Link>

          <Link
            to="/analyze"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-biolens-violet/10 p-2 text-biolens-violet-bright">
                <Microscope className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-biolens-violet-bright transition-colors">
                Image Analysis
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-resolution pan/zoom viewport with deep learning inference, confidence scores, and probability breakdown.
            </p>
          </Link>

          <Link
            to="/explain"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-pink-500/10 p-2 text-pink-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">
                Explain the Prediction
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real Grad-CAM attention heatmaps overlaid on biopsy histology tiles to reveal key discriminative cellular features.
            </p>
          </Link>

          <Link
            to="/learn"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                Tissue Class Learning
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive histopathology educational atlas covering morphology, clinical significance, and differential diagnosis.
            </p>
          </Link>

          <Link
            to="/reports"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                Image Report
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate publication-grade PDF research reports with original micrographs, Grad-CAM overlays, and scientific summaries.
            </p>
          </Link>

          <Link
            to="/model-info"
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                Model Architecture & Metrics
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect layers, loss/accuracy curves, confusion matrix, classification report, and known limitations.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
