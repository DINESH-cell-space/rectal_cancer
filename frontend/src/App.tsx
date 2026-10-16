import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { ImageAnalysis } from './pages/ImageAnalysis';
import { ExplainWorkspace } from './pages/ExplainWorkspace';
import { TissueLearning } from './pages/TissueLearning';
import { ImageReports } from './pages/ImageReports';
import { DatasetInfo } from './pages/DatasetInfo';
import { ModelInfo } from './pages/ModelInfo';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { DatasetSummary, ModelInfo as IModelInfo } from './types';

export function App() {
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [modelInfo, setModelInfo] = useState<IModelInfo | null>(null);

  useEffect(() => {
    async function loadGlobalMeta() {
      try {
        const [sum, mInfo] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getModelInfo().catch(() => null)
        ]);
        if (sum) setDatasetSummary(sum);
        if (mInfo) setModelInfo(mInfo);
      } catch (e) {
        console.error('Global meta load:', e);
      }
    }
    loadGlobalMeta();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-biolens-950 text-slate-100 flex flex-col font-sans">
        {/* Top Navbar */}
        <Navbar modelInfo={modelInfo} datasetSummary={datasetSummary} />

        <div className="flex flex-1 pt-0">
          {/* Left Sidebar */}
          <Sidebar datasetSummary={datasetSummary} modelInfo={modelInfo} />

          {/* Main Content Area */}
          <main className="flex-1 ml-64 p-6 sm:p-8 max-w-[1600px] overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explore" element={<DatasetExplorer />} />
              <Route path="/analyze" element={<ImageAnalysis />} />
              <Route path="/explain" element={<ExplainWorkspace />} />
              <Route path="/learn" element={<TissueLearning />} />
              <Route path="/reports" element={<ImageReports />} />
              <Route path="/dataset-info" element={<DatasetInfo />} />
              <Route path="/model-info" element={<ModelInfo />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
