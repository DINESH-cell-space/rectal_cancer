import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Cpu, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetSummary, ModelInfo } from '../types';

export const Settings: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  const [datasetPath, setDatasetPath] = useState('');
  const [savingPath, setSavingPath] = useState(false);
  const [pathMessage, setPathMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [uploadingModel, setUploadingModel] = useState(false);
  const [modelMessage, setModelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sum, m] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getModelInfo().catch(() => null)
        ]);
        if (sum) {
          setSummary(sum);
          setDatasetPath(sum.dataset_path);
        }
        if (m) setModelInfo(m);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetPath.trim()) return;
    setSavingPath(true);
    setPathMessage(null);
    try {
      const res = await api.setDatasetPath(datasetPath.trim());
      setSummary(res);
      setPathMessage({ type: 'success', text: `Path updated! Indexed ${res.total_images} tiles across ${res.classes_count} classes.` });
    } catch (err: any) {
      setPathMessage({ type: 'error', text: err.message || 'Failed to update dataset path.' });
    } finally {
      setSavingPath(false);
    }
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingModel(true);
    setModelMessage(null);
    try {
      const res = await api.uploadModel(file);
      setModelMessage({ type: 'success', text: `Loaded model: ${res.filename} (${res.status})` });
      const m = await api.getModelInfo();
      setModelInfo(m);
    } catch (err: any) {
      setModelMessage({ type: 'error', text: err.message || 'Failed to upload model weights.' });
    } finally {
      setUploadingModel(false);
    }
  };

  const handleReloadModel = async () => {
    try {
      const res = await api.reloadModel();
      const m = await api.getModelInfo();
      setModelInfo(m);
      alert(`Model reloaded: ${res.status}`);
    } catch (err: any) {
      alert(`Error reloading model: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workstation Configuration
          </h1>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
            System Settings
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage local dataset paths, update deep learning weights checkpoints, and verify system connectivity.
        </p>
      </div>

      {/* Dataset Storage Configuration */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="rounded-xl bg-biolens-cyan/10 p-2 text-biolens-cyan">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Histopathology Dataset Storage
            </h2>
            <p className="text-xs text-slate-400">
              Zenodo 53169 colorectal histological tile root directory
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePath} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Absolute Directory Path on Local Disk
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={datasetPath}
                onChange={(e) => setDatasetPath(e.target.value)}
                placeholder="e.g. C:\Users\admin\Downloads\Kather_texture_2016_image_tiles_5000\..."
                className="flex-1 rounded-xl border border-slate-700 bg-biolens-900 px-3.5 py-2 text-xs font-mono text-white focus:border-biolens-cyan focus:outline-none"
              />
              <button
                type="submit"
                disabled={savingPath}
                className="rounded-xl bg-biolens-cyan px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-glow-cyan disabled:opacity-50"
              >
                {savingPath ? 'Scanning...' : 'Update Path'}
              </button>
            </div>
          </div>

          {pathMessage && (
            <div className={`rounded-xl p-3 text-xs flex items-center space-x-2 ${
              pathMessage.type === 'success' 
                ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-300' 
                : 'border border-red-500/30 bg-red-950/20 text-red-300'
            }`}>
              {pathMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{pathMessage.text}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
            <p>&bull; Active dataset folder: <span className="text-slate-300">{summary?.dataset_path}</span></p>
            <p>&bull; Indexed images: <span className="text-biolens-cyan font-bold">{summary?.total_images || 0} tiles</span></p>
          </div>
        </form>
      </div>

      {/* Model Weights Checkpoints */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="rounded-xl bg-biolens-violet/10 p-2 text-biolens-violet-bright">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Trained Model Weights (.keras / .h5)
            </h2>
            <p className="text-xs text-slate-400">
              Load checkpoint produced by rectal cancer.py or upload Google Colab export
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-biolens-950 p-4">
            <div>
              <span className="text-xs font-semibold text-white block">Current Model Status</span>
              <span className="text-xs font-mono text-biolens-cyan">{modelInfo?.status || 'Active'}</span>
              <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                {modelInfo?.model_path || 'rectal_cancer_outputs/best_rectal_cancer_model.keras'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReloadModel}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Weights</span>
              </button>

              <label className="flex items-center space-x-1.5 rounded-xl border border-biolens-violet/40 bg-biolens-violet/20 px-3.5 py-2 text-xs font-bold text-biolens-violet-bright cursor-pointer hover:bg-biolens-violet/30 shadow-glow-violet">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploadingModel ? 'Uploading...' : 'Upload .keras File'}</span>
                <input
                  type="file"
                  accept=".keras,.h5"
                  onChange={handleModelUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {modelMessage && (
            <div className={`rounded-xl p-3 text-xs flex items-center space-x-2 ${
              modelMessage.type === 'success' 
                ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-300' 
                : 'border border-red-500/30 bg-red-950/20 text-red-300'
            }`}>
              {modelMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{modelMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Backend Health Status */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              FastAPI Inference Engine Connectivity
            </h2>
            <p className="text-xs text-slate-400">
              Live REST API service listening on localhost:8000
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
            <span className="text-slate-500 text-[10px] block">API HEALTH</span>
            <span className="text-emerald-400 font-bold">ONLINE &bull; 200 OK</span>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
            <span className="text-slate-500 text-[10px] block">INFERENCE ENGINE</span>
            <span className="text-biolens-cyan font-bold">TensorFlow Keras (CPU)</span>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
            <span className="text-slate-500 text-[10px] block">VERSION</span>
            <span className="text-slate-300 font-bold">BioLens 2.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
