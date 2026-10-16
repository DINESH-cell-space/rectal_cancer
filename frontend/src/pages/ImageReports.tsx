import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Microscope,
  FileCheck,
  RefreshCw,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetImage, PredictionResult, GradcamResult } from '../types';

export const ImageReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const imageId = searchParams.get('id');

  const [currentImage, setCurrentImage] = useState<DatasetImage | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [gradcam, setGradcam] = useState<GradcamResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
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
          setLoading(true);
          const [details, pred] = await Promise.all([
            api.getImageDetails(activeId),
            api.predict(activeId)
          ]);
          setCurrentImage(details);
          setPrediction(pred);

          // Get Grad-CAM
          const cam = await api.explainGradcam(activeId, pred.predicted_index);
          setGradcam(cam);
        }
      } catch (err: any) {
        console.error('Report preview error:', err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [imageId]);

  const handleDownloadPdf = async () => {
    if (!prediction) return;
    setGeneratingPdf(true);
    try {
      const reportPayload = {
        image_id: currentImage?.id,
        predicted_class: prediction.predicted_class,
        confidence_percentage: prediction.confidence_percentage,
        ground_truth: prediction.ground_truth,
        filename: currentImage?.filename || 'Tile.tif',
        input_dimensions: prediction.input_dimensions,
        probabilities_sorted: prediction.probabilities_sorted,
        explanation_summary: gradcam?.explanation_summary || {},
        heatmap_base64: gradcam?.overlay_base64
      };

      const blob = await api.downloadReport(reportPayload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BioLens_Report_${currentImage?.filename || 'Scan'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Report download error: ${err.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Histopathological Report Suite
            </h1>
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-400">
              PDF Generator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate publication-ready diagnostic support documentation with side-by-side micrographs and XAI Grad-CAM overlays.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={!prediction || generatingPdf}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-biolens-cyan to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-95 transition-all shadow-glow-cyan disabled:opacity-50"
        >
          {generatingPdf ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{generatingPdf ? 'Compiling PDF...' : 'Download Official PDF Report'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 text-xs flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* PDF Document Preview Canvas (styled like printed medical document) */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900/90 p-8 shadow-2xl space-y-6 text-slate-200 font-sans">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-biolens-cyan bg-clip-text text-transparent">
                BioLens AI
              </span>
              <span className="text-xs font-mono text-biolens-cyan border border-biolens-cyan/30 bg-biolens-cyan/10 px-2 py-0.5 rounded">
                COLORECTAL XAI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Colorectal Tissue Intelligence Platform &bull; Research Assessment Report
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-400 space-y-0.5">
            <p><strong>REPORT ID:</strong> BIO-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-SCAN</p>
            <p><strong>TIMESTAMP:</strong> {new Date().toUTCString()}</p>
          </div>
        </div>

        {/* Specimen Metadata Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-biolens-950/80 p-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] block">SPECIMEN FILENAME</span>
            <span className="font-semibold text-white truncate block">{currentImage?.filename || 'Histology_Tile.tif'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">PREDICTED CLASS</span>
            <span className="font-bold text-biolens-cyan">{prediction?.predicted_class || 'Computing...'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">CONFIDENCE SCORE</span>
            <span className="font-bold text-emerald-400">{prediction?.confidence_percentage.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">GROUND TRUTH</span>
            <span className="font-semibold text-biolens-violet-bright">{prediction?.ground_truth || 'Unannotated'}</span>
          </div>
        </div>

        {/* Dual Visualizations Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Histopathological Micrographs & Saliency Maps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-biolens-950 p-3">
              <span className="text-[11px] font-mono text-slate-400 mb-2">Original Biopsy Tile (H&E)</span>
              {currentImage ? (
                <img
                  src={`/api/images/${currentImage.id}/raw`}
                  alt="Original"
                  className="h-60 w-60 rounded-lg object-contain border border-slate-800 shadow"
                />
              ) : (
                <div className="h-60 w-60 rounded-lg bg-slate-900" />
              )}
            </div>

            {/* Grad-CAM */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-biolens-950 p-3">
              <span className="text-[11px] font-mono text-pink-400 mb-2">Grad-CAM Activation Overlay</span>
              {gradcam ? (
                <img
                  src={gradcam.overlay_base64}
                  alt="Grad-CAM"
                  className="h-60 w-60 rounded-lg object-contain border border-pink-500/40 shadow-glow-violet"
                />
              ) : (
                <div className="h-60 w-60 rounded-lg bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                  Generating Map...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Probabilities Distribution Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kather 8-Class Probability Spectrum
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-biolens-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Tissue Phenotype</th>
                  <th className="px-4 py-2">Softmax Probability</th>
                  <th className="px-4 py-2">Relative Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {prediction?.probabilities_sorted?.map((item, idx) => (
                  <tr key={item.class_id} className={idx === 0 ? 'bg-biolens-cyan/5 font-bold text-white' : 'text-slate-300'}>
                    <td className="px-4 py-2 text-slate-500">#{idx + 1}</td>
                    <td className="px-4 py-2">{item.class_name}</td>
                    <td className="px-4 py-2">{item.percentage.toFixed(2)}%</td>
                    <td className="px-4 py-2">
                      <div className="h-1.5 w-32 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-biolens-cyan"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scientific Findings Summary */}
        {gradcam?.explanation_summary && (
          <div className="rounded-xl border border-biolens-violet/30 bg-biolens-violet/10 p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-biolens-violet-bright font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Automated Saliency & Morphological Interpretation</span>
            </div>
            <p className="text-slate-200 leading-relaxed text-[11.5px]">
              {gradcam.explanation_summary.clinical_morphology}
            </p>
            <p className="text-slate-400 font-mono text-[10.5px]">
              {gradcam.explanation_summary.saliency_metrics}
            </p>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 leading-normal text-center">
          <p>
            <strong>FOR RESEARCH & EDUCATIONAL USE ONLY:</strong> BioLens AI results are experimental decision-support 
            features and do not constitute clinical diagnostic confirmation. Histopathological diagnosis requires certified 
            pathologists evaluating whole slide imaging (WSI) and medical records.
          </p>
        </div>
      </div>
    </div>
  );
};
