import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface WorkoutExportData {
  name: string;
  description?: string | null;
  status: string;
  completedAt?: Date | null;
  duration?: number | null;
  exercises: {
    exerciseName: string;
    sets: number;
    reps?: number | null;
    weight?: number | null;
    actualSets: number;
    actualReps?: number | null;
    actualWeight?: number | null;
    completed: boolean;
  }[];
}

export interface DietExportData {
  name: string;
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  startDate: Date;
  endDate?: Date | null;
  meals: {
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    notes?: string | null;
  }[];
}

export interface WeightExportData {
  weight: number;
  unit: string;
  bodyFat?: number | null;
  notes?: string | null;
  loggedAt: Date;
}[];

export function exportWorkoutToPDF(workout: WorkoutExportData): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('GymTrack Pro - Workout Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Workout: ${workout.name}`, 14, 35);
  
  if (workout.description) {
    doc.text(`Description: ${workout.description}`, 14, 42);
  }
  
  doc.text(`Status: ${workout.status}`, 14, 49);
  
  if (workout.completedAt) {
    doc.text(`Completed: ${new Date(workout.completedAt).toLocaleDateString()}`, 14, 56);
  }
  
  if (workout.duration) {
    const minutes = Math.floor(workout.duration / 60);
    const seconds = workout.duration % 60;
    doc.text(`Duration: ${minutes}m ${seconds}s`, 14, 63);
  }
  
  const tableData = workout.exercises.map(ex => [
    ex.exerciseName,
    `${ex.sets} x ${ex.reps || '-'}`,
    ex.weight ? `${ex.weight} kg` : '-',
    ex.actualSets > 0 ? `${ex.actualSets} x ${ex.actualReps || '-'}` : '-',
    ex.actualWeight ? `${ex.actualWeight} kg` : '-',
    ex.completed ? '✓' : '✗',
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [['Exercise', 'Planned', 'Planned Weight', 'Actual', 'Actual Weight', 'Done']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  doc.save(`workout-${workout.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export function exportDietPlanToPDF(diet: DietExportData): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('GymTrack Pro - Diet Plan Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Plan: ${diet.name}`, 14, 35);
  doc.text(`Target Calories: ${diet.targetCalories} kcal`, 14, 42);
  doc.text(`Macros: P: ${diet.protein}g | C: ${diet.carbs}g | F: ${diet.fats}g`, 14, 49);
  doc.text(`Start: ${new Date(diet.startDate).toLocaleDateString()}`, 14, 56);
  
  if (diet.endDate) {
    doc.text(`End: ${new Date(diet.endDate).toLocaleDateString()}`, 14, 63);
  }
  
  const tableData = diet.meals.map(meal => [
    meal.name,
    meal.type,
    meal.calories,
    `${meal.protein}g`,
    `${meal.carbs}g`,
    `${meal.fats}g`,
    meal.notes || '-',
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [['Meal', 'Type', 'Calories', 'Protein', 'Carbs', 'Fats', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });
  
  doc.save(`diet-${diet.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export function exportWeightLogsToPDF(logs: WeightExportData): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('GymTrack Pro - Weight Log Report', 14, 20);
  
  const tableData = logs.map(log => [
    new Date(log.loggedAt).toLocaleDateString(),
    `${log.weight} ${log.unit}`,
    log.bodyFat ? `${log.bodyFat}%` : '-',
    log.notes || '-',
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Weight', 'Body Fat', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
  });
  
  doc.save('weight-logs.pdf');
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
