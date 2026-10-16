import React from 'react';
import { ClassProbability } from '../types';

interface ProbabilityBarProps {
  probabilities: ClassProbability[];
  predictedClass?: string;
  groundTruth?: string | null;
}

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

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  probabilities,
  predictedClass,
  groundTruth,
}) => {
  return (
    <div className="space-y-3">
      {probabilities.map((item) => {
        const isPredicted = item.class_id === predictedClass;
        const isGroundTruth = item.class_id === groundTruth;
        const barColor = CLASS_COLORS[item.class_id] || '#06B6D4';

        return (
          <div key={item.class_id} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center space-x-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: barColor }}
                />
                <span className={`font-mono font-medium ${isPredicted ? 'text-white font-bold' : 'text-slate-300'}`}>
                  {item.class_name}
                </span>
                {isPredicted && (
                  <span className="rounded bg-biolens-cyan/20 border border-biolens-cyan/40 px-1.5 py-0.2 text-[9px] font-bold text-biolens-cyan uppercase tracking-wider">
                    Top
                  </span>
                )}
                {isGroundTruth && (
                  <span className="rounded bg-biolens-violet/20 border border-biolens-violet/40 px-1.5 py-0.2 text-[9px] font-bold text-biolens-violet-bright uppercase tracking-wider">
                    Ground Truth
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold text-slate-200">
                {item.percentage.toFixed(2)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(item.percentage, 1)}%`,
                  backgroundColor: barColor,
                  boxShadow: isPredicted ? `0 0 10px ${barColor}` : 'none'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
