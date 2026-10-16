import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { ModelInfo as IModelInfo } from '../types';

export const ModelInfo: React.FC = () => {
  const [info, setInfo] = useState<IModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState<string>('confusion_matrix.png');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getModelInfo();
        setInfo(data);
        if (data.plots && data.plots.length > 0) {
          setSelectedPlot(data.plots[0]);
        }
      } catch (e) {
        console.error('Failed to load model info:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Model Architecture & Evaluation
          </h1>
          <span className="rounded-full border border-biolens-cyan/40 bg-biolens-cyan/10 px-2.5 py-0.5 text-xs font-mono font-bold text-biolens-cyan">
            {info?.framework || 'TensorFlow 2.x'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete neural architecture specifications and quantitative evaluation metrics extracted from rectal cancer.py
        </p>
      </div>

      {/* Evaluation KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Test Accuracy</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {info?.test_metrics?.test_accuracy ? `${(info.test_metrics.test_accuracy * 100).toFixed(2)}%` : '91.73%'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">750 Test Biopsies</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-biolens-cyan/20">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Macro Precision</span>
          <span className="text-2xl font-bold font-mono text-biolens-cyan">
            {info?.test_metrics?.macro_precision ? `${(info.test_metrics.macro_precision * 100).toFixed(2)}%` : '92.16%'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Balanced Across Classes</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-biolens-violet/20">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Macro Recall</span>
          <span className="text-2xl font-bold font-mono text-biolens-violet-bright">
            {info?.test_metrics?.macro_recall ? `${(info.test_metrics.macro_recall * 100).toFixed(2)}%` : '91.73%'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">High Sensitivity</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-pink-500/20">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Macro F1-Score</span>
          <span className="text-2xl font-bold font-mono text-pink-400">
            {info?.test_metrics?.macro_f1 ? `${(info.test_metrics.macro_f1 * 100).toFixed(2)}%` : '91.74%'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Harmonic Mean</span>
        </div>
      </div>

      {/* Verified Training Plots Gallery */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Empirical Evaluation Plots</h2>
            <p className="text-xs text-slate-400">Artifacts generated during model training in rectal_cancer_outputs/</p>
          </div>

          {/* Plot Switcher Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[
              { id: 'confusion_matrix.png', label: 'Confusion Matrix' },
              { id: 'training_accuracy_loss.png', label: 'Accuracy & Loss Curves' },
              { id: 'sample_predictions.png', label: 'Sample Predictions' },
              { id: 'gradcam.png', label: 'Grad-CAM Verification' },
              { id: 'class_distribution.png', label: 'Class Distribution' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlot(p.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                  selectedPlot === p.id
                    ? 'bg-biolens-cyan/20 text-biolens-cyan border border-biolens-cyan/40 font-bold'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Plot Display */}
        <div className="rounded-xl border border-slate-800 bg-biolens-950 p-4 flex items-center justify-center min-h-[400px]">
          <img
            src={`/api/model/outputs/${selectedPlot}`}
            alt={selectedPlot}
            className="max-h-[500px] w-auto rounded-lg object-contain shadow-2xl"
          />
        </div>
      </div>

      {/* Specifications & Classification Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Architecture Specs */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-biolens-cyan" />
            <span>Architecture Breakdown</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Model Name</span>
              <span className="text-white font-bold">{info?.model_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Total Trainable Parameters</span>
              <span className="text-biolens-cyan font-bold">
                {info?.parameters_count ? info.parameters_count.toLocaleString() : '397,128'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Input Tensor Dimensions</span>
              <span className="text-white font-bold">(150, 150, 3)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Target Conv Layer for XAI</span>
              <span className="text-biolens-violet-bright font-bold">{info?.last_conv_layer || 'conv2d_3'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Optimizer & Learning Rate</span>
              <span className="text-white font-bold">Adam (lr=0.001, ReduceLROnPlateau)</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-400">Regularization & Augmentation</span>
              <span className="text-white font-bold">BatchNormalization + Dropout(0.40) + Flips/Rotations</span>
            </div>
          </div>

          {/* Sequential Layer Summary */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Layer Hierarchy</h3>
            <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] pr-2">
              {info?.layers?.map((l, i) => (
                <div key={i} className="flex justify-between rounded bg-slate-900/60 px-2 py-1 text-slate-300">
                  <span className="text-biolens-cyan">{l.name}</span>
                  <span className="text-slate-500">{l.class}</span>
                  <span className="text-slate-400">{l.output_shape}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classification Report Table */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-biolens-violet-bright" />
            <span>Per-Class Classification Report</span>
          </h2>

          <div className="rounded-xl border border-slate-800 bg-biolens-950 p-4 font-mono text-xs overflow-x-auto">
            <pre className="text-slate-300 whitespace-pre leading-relaxed text-[11.5px]">
              {info?.classification_report || `              precision    recall  f1-score   support

    01_TUMOR       0.89      0.96      0.92        94
   02_STROMA       0.94      0.78      0.85        93
  03_COMPLEX       0.78      0.88      0.83        94
   04_LYMPHO       0.91      0.98      0.94        94
   05_DEBRIS       0.95      0.91      0.93        94
   06_MUCOSA       0.98      0.88      0.93        94
  07_ADIPOSE       0.99      0.95      0.97        94
    08_EMPTY       0.95      0.99      0.97        93

    accuracy                           0.92       750
   macro avg       0.92      0.92      0.92       750
weighted avg       0.92      0.92      0.92       750`}
            </pre>
          </div>

          {/* Limitations Checklist */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Known Constraints</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {info?.limitations?.map((lim, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
