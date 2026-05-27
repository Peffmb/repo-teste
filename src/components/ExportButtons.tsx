'use client';

import { Button } from './ui';
import { exportWorkoutToPDF, exportDietPlanToPDF, exportWeightLogsToPDF, exportToCSV } from '@/lib/export';
import type { WorkoutExportData, DietExportData } from '@/lib/export';

interface ExportButtonsProps {
  type: 'workout' | 'diet' | 'weight';
  data: WorkoutExportData | DietExportData | Record<string, unknown>[];
}

export function ExportButtons({ type, data }: ExportButtonsProps) {
  const handleExportPDF = () => {
    if (type === 'workout' && 'name' in data) {
      exportWorkoutToPDF(data as WorkoutExportData);
    } else if (type === 'diet' && 'name' in data) {
      exportDietPlanToPDF(data as DietExportData);
    } else if (type === 'weight') {
      exportWeightLogsToPDF(data as Parameters<typeof exportWeightLogsToPDF>[0]);
    }
  };

  const handleExportCSV = () => {
    if (Array.isArray(data)) {
      exportToCSV(data, `${type}-export`);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF
      </Button>
      {Array.isArray(data) && (
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </Button>
      )}
    </div>
  );
}
