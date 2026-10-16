import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Upload, 
  Microscope, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { ImageViewer } from '../components/ImageViewer';
import { ProbabilityBar } from '../components/ProbabilityBar';
import { DatasetImage, PredictionResult, GradcamResult } from '../types';

export const ImageAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const imageId = searchParams.get('id');

  const [currentImage, setCurrentImage] = useState<DatasetImage | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [filename, setFilename] = useState<string>('Select an image');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [gradcam, setGradcam] = useState<GradcamResult | null>(null);
  const [similarImages, setSimilarImages] = useState<DatasetImage[]>([]);
  const [nearbyImages, setNearbyImages] = useState<DatasetImage[]>([]);

  const [predicting, setPredicting] = useState(false);
  const [generatingGradcam, setGeneratingGradcam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial image from query param or fallback to first image in dataset
  useEffect(() => {
    async function loadInitial() {
      setError(null);
      try {
        if (imageId) {
          const details = await api.getImageDetails(imageId);
          setCurrentImage(details);
          setImageSrc(api.getImageRawUrl(imageId));
          setFilename(details.filename);
          // Run prediction
          runInference(imageId);
          loadSimilar(imageId);
        } else {
          // Fetch first image from dataset to load as default specimen
          const list = await api.getImages(1, 12);
          if (list.items.length > 0) {
            const first = list.items[0];
            setSearchParams({ id: first.id });
          }
        }
      } catch (err: any) {
        console.error('Initial load error:', err);
        setError(err.message || 'Failed to load image');
      }
    }
    loadInitial();
  }, [imageId]);

  // Load nearby images for thumbnail reel
  useEffect(() => {
    async function loadNearby() {
      try {
        const list = await api.getImages(1, 16);
        setNearbyImages(list.items);
      } catch (e) {
        console.error(e);
      }
    }
    loadNearby();
  }, []);

  const runInference = async (id?: string, file?: File) => {
    setPredicting(true);
    setError(null);
    try {
      const pred = await api.predict(id, file);
      setPrediction(pred);

      // Automatically generate real Grad-CAM for the top predicted class
      setGeneratingGradcam(true);
      try {
        const cam = await api.explainGradcam(id, pred.predicted_index, 'jet', file);
        setGradcam(cam);
      } catch (camErr) {
        console.warn('Grad-CAM generation notice:', camErr);
      } finally {
        setGeneratingGradcam(false);
      }
    } catch (err: any) {
      console.error('Inference error:', err);
      setError(err.message || 'Failed to run model inference');
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  };

  const loadSimilar = async (id: string) => {
    try {
      const sim = await api.getSimilarImages(id, 6);
      setSimilarImages(sim);
    } catch (e) {
      console.warn('Similar images fetch:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setCurrentImage(null);
    setFilename(file.name);
    setGradcam(null);

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);

    // Trigger inference
    runInference(undefined, file);
  };

  const handleSelectThumbnail = (thumb: DatasetImage) => {
    setSearchParams({ id: thumb.id });
  };

  const handleNavigateNext = () => {
    if (!currentImage || nearbyImages.length === 0) return;
    const currentIndex = nearbyImages.findIndex((img) => img.id === currentImage.id);
    if (currentIndex >= 0 && currentIndex < nearbyImages.length - 1) {
      setSearchParams({ id: nearbyImages[currentIndex + 1].id });
    }
  };

  const handleNavigatePrev = () => {
    if (!currentImage || nearbyImages.length === 0) return;
    const currentIndex = nearbyImages.findIndex((img) => img.id === currentImage.id);
    if (currentIndex > 0) {
      setSearchParams({ id: nearbyImages[currentIndex - 1].id });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Image Analysis Workspace
            </h1>
            <span className="rounded-full border border-biolens-violet/40 bg-biolens-violet/10 px-2.5 py-0.5 text-xs font-mono font-bold text-biolens-violet-bright">
              Keras CNN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time deep learning histopathology inference and feature activation evaluation
          </p>
        </div>

        {/* Upload Custom Biopsy Tile */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 rounded-xl border border-biolens-cyan/40 bg-biolens-cyan/15 px-4 py-2 text-xs font-bold text-biolens-cyan cursor-pointer hover:bg-biolens-cyan/25 transition-all shadow-glow-cyan">
            <Upload className="h-4 w-4" />
            <span>Upload Histology Tile</span>
            <input
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {currentImage && (
            <Link
              to={`/explain?id=${currentImage.id}`}
              className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <Sparkles className="h-4 w-4 text-biolens-violet-bright" />
              <span>Dedicated Explain View</span>
            </Link>
          )}
        </div>
      </div>

      {/* Error banner if present */}
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 text-xs flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="font-bold">Model Notice</p>
            <p className="text-amber-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Central Image Viewer & Live Prediction Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Viewer (7 cols) */}
        <div className="lg:col-span-7">
          <ImageViewer
            imageSrc={imageSrc}
            gradcamSrc={gradcam?.overlay_base64}
            filename={filename}
            dimensions={prediction?.input_dimensions || [150, 150]}
            groundTruth={currentImage?.ground_truth}
            predictedClass={prediction?.predicted_class}
            thumbnails={nearbyImages}
            onSelectThumbnail={handleSelectThumbnail}
            onNext={handleNavigateNext}
            onPrev={handleNavigatePrev}
            hasNext={true}
            hasPrev={true}
          />
        </div>

        {/* Right Column: Prediction Results & Class Probabilities (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Prediction Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Deep Learning Inference
                </h2>
                <p className="text-[11px] text-slate-400">
                  Colorectal_Histology_CNN Output
                </p>
              </div>

              {predicting && (
                <div className="flex items-center space-x-2 text-xs text-biolens-cyan animate-pulse font-mono">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Computing...</span>
                </div>
              )}
            </div>

            {/* Top Prediction Badge */}
            {prediction ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-biolens-cyan/30 bg-gradient-to-br from-biolens-900 to-slate-900 p-4 shadow-glow-cyan">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Predicted Tissue Class</span>
                    <span className="font-mono text-[10px]">Rank #1</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-white font-mono tracking-tight">
                      {prediction.predicted_class}
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-biolens-cyan font-mono">
                        {prediction.confidence_percentage.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">confidence</span>
                    </div>
                  </div>
                </div>

                {/* Ground-Truth Validation Comparison */}
                {prediction.ground_truth ? (
                  <div className={`flex items-center justify-between rounded-xl p-3 border text-xs font-mono ${
                    prediction.is_correct
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {prediction.is_correct ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      )}
                      <span>
                        Ground Truth: <strong>{prediction.ground_truth}</strong>
                      </span>
                    </div>
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-900/60">
                      {prediction.is_correct ? 'MATCHED' : 'DISCREPANCY'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 rounded-xl p-2.5 border border-slate-800 bg-slate-900/40 text-xs text-slate-400 font-mono">
                    <HelpCircle className="h-4 w-4 text-slate-500" />
                    <span>Ground Truth: Unannotated external scan</span>
                  </div>
                )}

                {/* Probability Distribution */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Class Probability Distribution</span>
                    <span className="text-[10px] text-slate-500 font-mono">Softmax &Sigma; = 1.0</span>
                  </div>
                  <ProbabilityBar
                    probabilities={prediction.probabilities_sorted}
                    predictedClass={prediction.predicted_class}
                    groundTruth={prediction.ground_truth}
                  />
                </div>

                {/* Quick actions for Reports & Explain */}
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (currentImage) navigate(`/explain?id=${currentImage.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 rounded-xl border border-biolens-violet/40 bg-biolens-violet/20 py-2.5 text-xs font-bold text-biolens-violet-bright hover:bg-biolens-violet/30 transition-all shadow-glow-violet"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Open in Explain (Grad-CAM)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentImage) navigate(`/reports?id=${currentImage.id}`);
                    }}
                    className="flex items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                Select an image from the gallery or upload a tile to view model predictions.
              </div>
            )}
          </div>

          {/* Research Caveat */}
          <div className="rounded-xl border border-slate-800/80 bg-biolens-900/40 p-3 text-[10px] text-slate-400 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p>
              Model probability reflects statistical feature correlation on the 150&times;150 tile patch. 
              Always review whole-slide architecture and clinical history.
            </p>
          </div>
        </div>
      </div>

      {/* Similar Images Strip (Section 13) */}
      {similarImages.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Related Biopsy Tiles ({currentImage?.ground_truth || 'Same Class'})
              </h3>
              <p className="text-xs text-slate-400">
                Histological reference examples from the same verified tissue category
              </p>
            </div>
            <Link
              to={`/explore?class=${currentImage?.ground_truth}`}
              className="text-xs font-semibold text-biolens-cyan hover:underline flex items-center space-x-1"
            >
              <span>View all {currentImage?.ground_truth}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {similarImages.map((sim) => (
              <div
                key={sim.id}
                onClick={() => setSearchParams({ id: sim.id })}
                className="group cursor-pointer rounded-xl overflow-hidden border border-slate-800 hover:border-biolens-cyan/60 transition-all bg-biolens-950"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={`/api/images/${sim.id}/raw`}
                    alt={sim.filename}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="p-2 bg-biolens-900/80 text-[10px] font-mono text-slate-400 truncate">
                  {sim.filename}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
