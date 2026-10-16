import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import { DatasetImage } from '../types';

interface ImageViewerProps {
  imageSrc: string;
  gradcamSrc?: string | null;
  filename: string;
  dimensions?: [number, number];
  groundTruth?: string | null;
  predictedClass?: string | null;
  thumbnails?: DatasetImage[];
  onSelectThumbnail?: (img: DatasetImage) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageSrc,
  gradcamSrc,
  filename,
  dimensions = [150, 150],
  groundTruth,
  predictedClass,
  thumbnails = [],
  onSelectThumbnail,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'overlay' | 'side-by-side'>('original');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset zoom when image changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const downloadCurrentImage = () => {
    const a = document.createElement('a');
    a.href = (viewMode === 'overlay' && gradcamSrc) ? gradcamSrc : imageSrc;
    a.download = `BioLens_${filename}`;
    a.click();
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-panel rounded-2xl border border-biolens-cyan/20 overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-biolens-950' : 'h-[620px]'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-biolens-900/80 px-4 py-2.5 text-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-biolens-cyan shadow-glow-cyan" />
            <span className="font-mono font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
              {filename}
            </span>
          </div>
          <span className="hidden sm:inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {dimensions[0]} &times; {dimensions[1]} px
          </span>
          {groundTruth && (
            <span className="hidden md:inline-flex items-center space-x-1 rounded bg-biolens-violet/10 border border-biolens-violet/30 px-2 py-0.5 text-[10px] font-mono text-biolens-violet-bright">
              <span>GT:</span>
              <span className="font-bold">{groundTruth}</span>
            </span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2">
          {gradcamSrc && (
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700/80 p-0.5">
              <button
                onClick={() => setViewMode('original')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  viewMode === 'original'
                    ? 'bg-biolens-cyan/20 text-biolens-cyan border border-biolens-cyan/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Histology
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`flex items-center space-x-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  viewMode === 'overlay'
                    ? 'bg-biolens-violet/20 text-biolens-violet-bright border border-biolens-violet/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Grad-CAM</span>
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`hidden lg:block rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  viewMode === 'side-by-side'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual View
              </button>
            </div>
          )}

          {/* Opacity slider when in overlay mode */}
          {viewMode === 'overlay' && gradcamSrc && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-mono">Heatmap</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-16 accent-biolens-cyan h-1 cursor-pointer"
              />
            </div>
          )}

          {/* Viewer Tools */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-biolens-cyan transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-biolens-cyan transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset View"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-biolens-cyan transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={downloadCurrentImage}
              title="Download Image"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-biolens-cyan transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-biolens-cyan transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        className="relative flex-1 bg-biolens-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md shadow-lg hover:bg-biolens-cyan/20 hover:text-biolens-cyan transition-all"
            title="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md shadow-lg hover:bg-biolens-cyan/20 hover:text-biolens-cyan transition-all"
            title="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Canvas / Render Area */}
        {viewMode === 'side-by-side' && gradcamSrc ? (
          <div className="flex h-full w-full items-center justify-center space-x-6 p-6">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono text-slate-400 mb-2">Original Histology</span>
              <img
                src={imageSrc}
                alt="Original"
                className="max-h-[380px] max-w-[380px] rounded-lg border border-slate-800 object-contain shadow-2xl"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono text-biolens-violet-bright mb-2">Grad-CAM Overlay</span>
              <img
                src={gradcamSrc}
                alt="Grad-CAM"
                className="max-h-[380px] max-w-[380px] rounded-lg border border-biolens-violet/40 object-contain shadow-glow-violet"
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="relative flex items-center justify-center"
          >
            {/* Base Histology Image */}
            <img
              src={imageSrc}
              alt={filename}
              draggable={false}
              className="max-h-[440px] max-w-[440px] rounded-xl border border-slate-800 object-contain shadow-2xl"
            />

            {/* Grad-CAM Heatmap layer */}
            {viewMode === 'overlay' && gradcamSrc && (
              <img
                src={gradcamSrc}
                alt="Grad-CAM Overlay"
                draggable={false}
                style={{ opacity: overlayOpacity }}
                className="absolute inset-0 h-full w-full rounded-xl object-contain pointer-events-none mix-blend-screen"
              />
            )}
          </div>
        )}

        {/* Zoom Factor Floating Indicator */}
        <div className="absolute bottom-3 left-4 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-md">
          {Math.round(scale * 100)}% ZOOM
        </div>
      </div>

      {/* Thumbnail Navigation Strip */}
      {thumbnails.length > 0 && (
        <div className="border-t border-slate-800/80 bg-biolens-900/90 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Tile Reel ({thumbnails.length} nearby)</span>
            <span className="text-[9px] text-slate-400">Click to switch scan</span>
          </p>
          <div className="flex space-x-2 overflow-x-auto pb-1 pt-0.5">
            {thumbnails.map((thumb) => {
              const isSelected = thumb.filename === filename;
              return (
                <button
                  key={thumb.id}
                  onClick={() => onSelectThumbnail?.(thumb)}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-biolens-cyan shadow-glow-cyan scale-105'
                      : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`/api/images/${thumb.id}/raw`}
                    alt={thumb.filename}
                    className="h-12 w-12 object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-mono text-center text-slate-300 truncate px-0.5">
                    {thumb.ground_truth.split('_')[1] || thumb.ground_truth}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
