import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Layers, 
  Download, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  BrainCircuit,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetImage, PredictionResult, GradcamResult } from '../types';

const COLORMAPS = [
  { id: 'jet', label: 'Jet (Standard Medical)' },
  { id: 'turbo', label: 'Turbo (High Contrast)' },
  { id: 'plasma', label: 'Plasma (Perceptually Uniform)' },
  { id: 'magma', label: 'Magma (Deep Tissue)' },
  { id: 'viridis', label: 'Viridis (Colorblind Safe)' },
];

export const ExplainWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const imageId = searchParams.get('id');

  const [currentImage, setCurrentImage] = useState<DatasetImage | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [filename, setFilename] = useState<string>('Histology_Tile.tif');

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [gradcam, setGradcam] = useState<GradcamResult | null>(null);

  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const [selectedColormap, setSelectedColormap] = useState<string>('jet');
  const [opacity, setOpacity] = useState<number>(0.5);
  const [viewMode, setViewMode] = useState<'blended' | 'side-by-side' | 'heatmap-only'>('blended');

  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecimen() {
      setError(null);
      try {
        let activeId = imageId;
        if (!activeId) {
          const list = await api.getImages(1, 1);
          if (list.items.length > 0) {
            activeId = list.items[0].id;
            setSearchParams({ id: activeId });
            return;
          }
        }

        if (activeId) {
          const details = await api.getImageDetails(activeId);
          setCurrentImage(details);
          setImageSrc(api.getImageRawUrl(activeId));
          setFilename(details.filename);

          // Get prediction first
          setLoading(true);
          const pred = await api.predict(activeId);
          setPrediction(pred);
          setSelectedClassIndex(pred.predicted_index);

          // Generate Grad-CAM
          const cam = await api.explainGradcam(activeId, pred.predicted_index, selectedColormap);
          setGradcam(cam);
        }
      } catch (err: any) {
        console.error('Explain load error:', err);
        setError(err.message || 'Failed to generate explainability data');
      } finally {
        setLoading(false);
      }
    }
    loadSpecimen();
  }, [imageId]);

  const handleRegenerate = async (classIdx?: number, cmap?: string) => {
    if (!imageId) return;
    setLoading(true);
    setError(null);
    try {
      const targetIdx = classIdx !== undefined ? classIdx : selectedClassIndex;
      const targetCmap = cmap || selectedColormap;
      const cam = await api.explainGradcam(imageId, targetIdx ?? undefined, targetCmap);
      setGradcam(cam);
    } catch (err: any) {
      setError(err.message || 'Failed to compute Grad-CAM');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedClassIndex(idx);
    handleRegenerate(idx, selectedColormap);
  };

  const handleColormapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cmap = e.target.value;
    setSelectedColormap(cmap);
    handleRegenerate(selectedClassIndex ?? undefined, cmap);
  };

  const handleDownload = () => {
    if (!gradcam) return;
    const a = document.createElement('a');
    a.href = gradcam.overlay_base64;
    a.download = `BioLens_GradCAM_${filename}_${gradcam.target_class}.png`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explain the Prediction
            </h1>
            <span className="rounded-full border border-pink-500/40 bg-pink-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-pink-400">
              Grad-CAM XAI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gradient-weighted class activation mapping reveals spatial cellular regions driving the CNN classification.
          </p>
        </div>

        {/* Download & Regenerate Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleRegenerate()}
            disabled={loading}
            className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-biolens-cyan' : ''}`} />
            <span>Regenerate Map</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!gradcam}
            className="flex items-center space-x-2 rounded-xl border border-biolens-cyan/40 bg-biolens-cyan/20 px-4 py-2 text-xs font-bold text-biolens-cyan hover:bg-biolens-cyan/30 transition-all shadow-glow-cyan disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export Grad-CAM Image</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 text-xs flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Dual-Panel Viewer & Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
            {/* Top Bar Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-biolens-900/80 px-4 py-2.5 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-slate-300 font-semibold truncate max-w-xs">
                  {filename}
                </span>
                {gradcam && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-biolens-cyan">
                    Layer: {gradcam.last_conv_layer}
                  </span>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                  <button
                    onClick={() => setViewMode('blended')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      viewMode === 'blended' ? 'bg-biolens-cyan/20 text-biolens-cyan font-bold' : 'text-slate-400'
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      viewMode === 'side-by-side' ? 'bg-biolens-violet/20 text-biolens-violet-bright font-bold' : 'text-slate-400'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode('heatmap-only')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                      viewMode === 'heatmap-only' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Heatmap Only
                  </button>
                </div>

                {/* Zoom tools */}
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
                  <button
                    onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setScale((s) => Math.max(s - 0.25, 0.75))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setScale(1)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewport Render Area */}
            <div className="relative flex-1 bg-biolens-950 flex items-center justify-center p-6 overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-biolens-950/80 backdrop-blur-xs">
                  <RefreshCw className="h-8 w-8 animate-spin text-biolens-cyan mb-2" />
                  <p className="text-xs font-mono text-slate-300">Computing GradientTape Backpropagation...</p>
                </div>
              )}

              {viewMode === 'side-by-side' ? (
                <div className="flex h-full w-full items-center justify-center space-x-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-mono text-slate-400 mb-2">Original Histology</span>
                    <img
                      src={imageSrc}
                      alt="Original"
                      className="max-h-[380px] max-w-[380px] rounded-xl border border-slate-800 object-contain shadow-2xl"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-mono text-pink-400 mb-2">Grad-CAM Activation Map</span>
                    {gradcam ? (
                      <img
                        src={gradcam.overlay_base64}
                        alt="Grad-CAM"
                        className="max-h-[380px] max-w-[380px] rounded-xl border border-pink-500/40 object-contain shadow-glow-violet"
                      />
                    ) : (
                      <div className="h-[380px] w-[380px] rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-500 text-xs">
                        Map not generated
                      </div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'heatmap-only' && gradcam ? (
                <div 
                  style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={gradcam.heatmap_base64}
                    alt="Heatmap"
                    className="max-h-[440px] max-w-[440px] rounded-xl border border-slate-800 object-contain shadow-2xl"
                  />
                </div>
              ) : (
                <div
                  style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
                  className="relative flex items-center justify-center"
                >
                  <img
                    src={imageSrc}
                    alt="Original"
                    className="max-h-[440px] max-w-[440px] rounded-xl border border-slate-800 object-contain shadow-2xl"
                  />
                  {gradcam && (
                    <img
                      src={gradcam.overlay_base64}
                      alt="Grad-CAM Overlay"
                      style={{ opacity }}
                      className="absolute inset-0 h-full w-full rounded-xl object-contain pointer-events-none mix-blend-screen"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Heatmap Spectrum Legend & Opacity Slider Bar */}
            <div className="border-t border-slate-800 bg-biolens-900/90 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Opacity slider */}
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Overlay Blend:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-32 accent-biolens-cyan cursor-pointer"
                />
                <span className="font-mono text-slate-300 font-bold">{Math.round(opacity * 100)}%</span>
              </div>

              {/* Spectrum legend */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[10px] font-mono text-slate-400">Low Focus (0.0)</span>
                <div className="h-3 w-36 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-red-600 border border-slate-700 shadow-inner" />
                <span className="text-[10px] font-mono text-red-400 font-bold">Peak Focus (1.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: XAI Controls & Scientific Findings (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Controls Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              Explainability Parameters
            </h3>

            {/* Target Class Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Target Output Class for Backprop
              </label>
              <select
                value={selectedClassIndex ?? ''}
                onChange={handleClassChange}
                className="w-full rounded-xl border border-slate-700 bg-biolens-900 px-3 py-2 text-xs text-slate-200 focus:border-biolens-cyan focus:outline-none font-mono"
              >
                {prediction?.probabilities?.map((p, idx) => (
                  <option key={p.class_id} value={idx}>
                    {p.class_name} ({p.percentage.toFixed(1)}%)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Gradients will be computed with respect to this class score.
              </p>
            </div>

            {/* Colormap Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Attention Colormap
              </label>
              <select
                value={selectedColormap}
                onChange={handleColormapChange}
                className="w-full rounded-xl border border-slate-700 bg-biolens-900 px-3 py-2 text-xs text-slate-200 focus:border-biolens-cyan focus:outline-none"
              >
                {COLORMAPS.map((cm) => (
                  <option key={cm.id} value={cm.id}>
                    {cm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantitative Attention Metrics */}
            {gradcam && (
              <div className="rounded-xl border border-slate-800 bg-biolens-950 p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Coordinate</span>
                  <span className="text-biolens-cyan font-bold">
                    ({gradcam.peak_focus_coordinates[0]}, {gradcam.peak_focus_coordinates[1]})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High Saliency Area (&gt;65%)</span>
                  <span className="text-pink-400 font-bold">
                    {gradcam.high_activation_area_pct}% of tile
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Layer</span>
                  <span className="text-slate-300 font-bold">{gradcam.last_conv_layer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Scientific Findings & Morphological Summary */}
          {gradcam?.explanation_summary && (
            <div className="glass-panel rounded-2xl p-5 border border-biolens-violet/30 space-y-3 shadow-glow-violet">
              <div className="flex items-center space-x-2 text-biolens-violet-bright">
                <BrainCircuit className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Scientific Feature Findings
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <div>
                  <span className="font-semibold text-white block mb-0.5">Histomorphological Focus:</span>
                  <p className="text-slate-300 text-[11.5px]">
                    {gradcam.explanation_summary.clinical_morphology}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="font-semibold text-white block mb-0.5">Spatial Concentration:</span>
                  <p className="text-slate-400 text-[11px]">
                    {gradcam.explanation_summary.saliency_metrics}
                  </p>
                </div>
              </div>

              {/* Caveat */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 text-[10px] text-amber-300/90 leading-tight">
                <strong>XAI Caveat:</strong> {gradcam.explanation_summary.xai_caveat}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
