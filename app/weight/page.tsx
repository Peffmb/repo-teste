'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button, Card, Input, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import { createWeightLog, getWeightLogs, deleteWeightLog, getWeightStats, getWeightLogsForChart } from '@/actions/weight';
import { AnalyticsDashboard } from '@/components/charts/AnalyticsDashboard';
import { ExportButtons } from '@/components/ExportButtons';
import type { WeightLog } from '@prisma/client';

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [stats, setStats] = useState<{
    currentWeight: number | null;
    startWeight: number | null;
    minWeight: number | null;
    maxWeight: number | null;
    change: number | null;
    percentChange: string | null;
  } | null>(null);
  const [chartData, setChartData] = useState<{ date: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [logsResult, statsResult, chartResult] = await Promise.all([
      getWeightLogs(),
      getWeightStats(),
      getWeightLogsForChart(30),
    ]);
    
    if (logsResult.success && logsResult.data) {
      setLogs(logsResult.data);
    }
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }
    if (chartResult.success && chartResult.data) {
      setChartData(chartResult.data);
    }
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await createWeightLog(formData);
    if (result.success) {
      setShowForm(false);
      await loadData();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this weight log?')) return;
    await deleteWeightLog(id);
    await loadData();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weight Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor your weight and body composition</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Log Weight'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.currentWeight ? `${stats.currentWeight} kg` : '-'}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-1">Start</p>
              <p className="text-2xl font-bold text-gray-700">
                {stats.startWeight ? `${stats.startWeight} kg` : '-'}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-1">Min</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.minWeight ? `${stats.minWeight} kg` : '-'}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-1">Max</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.maxWeight ? `${stats.maxWeight} kg` : '-'}
              </p>
            </Card>
          </div>
        )}

        {/* Change indicator */}
        {stats && stats.change !== null && stats.change !== 0 && (
          <Card className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Change</p>
                <p className={`text-xl font-bold ${stats.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} kg ({stats.percentChange}%)
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                stats.change > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <svg 
                  className={`w-6 h-6 ${stats.change > 0 ? 'text-red-600' : 'text-green-600'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={stats.change > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4m-6 5H3a2 2 0 01-2-2V5a2 2 0 012-2h4" : "M13 17h8m0 0V9m0 8l-8-8-4 4m-6 5H3a2 2 0 01-2-2V5a2 2 0 012-2h4"} 
                  />
                </svg>
              </div>
            </div>
          </Card>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8" title="Weight Progress">
            <AnalyticsDashboard weightData={chartData} />
          </Card>
        )}

        {showForm && (
          <Card className="mb-8">
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="weight" label="Weight" type="number" step="0.1" required />
                <select
                  name="unit"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="kg"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
                <Input name="loggedAt" label="Date" type="datetime-local" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="bodyFat" label="Body Fat %" type="number" step="0.1" placeholder="Optional" />
                <Input name="notes" label="Notes" placeholder="Optional notes..." />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Save Log
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Logs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No weight logs yet"
            description="Start tracking your weight to see progress over time"
            action={
              <Button onClick={() => setShowForm(true)}>
                + Log Weight
              </Button>
            }
          />
        ) : (
          <Card title="Recent Logs" action={<ExportButtons type="weight" data={logs} />}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Weight</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Body Fat</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Notes</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(log.loggedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {log.weight} {log.unit}
                      </td>
                      <td className="py-3 px-4">
                        {log.bodyFat ? `${log.bodyFat}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {log.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
