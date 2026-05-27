'use client';

import { Card, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WorkoutStats {
  totalWorkouts: number;
  completedWorkouts: number;
  totalVolume: number;
  averageDuration: number;
}

interface WeightData {
  date: string;
  weight: number;
}

interface MuscleGroupData {
  name: string;
  value: number;
}

interface AnalyticsDashboardProps {
  workoutStats?: WorkoutStats;
  weightData?: WeightData[];
  muscleGroupData?: MuscleGroupData[];
  weeklyWorkouts?: { day: string; count: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AnalyticsDashboard({
  workoutStats,
  weightData,
  muscleGroupData,
  weeklyWorkouts,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Workouts" className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-3xl font-bold text-blue-700">{workoutStats?.totalWorkouts || 0}</div>
          <p className="text-sm text-blue-600">All time</p>
        </Card>
        
        <Card title="Completed" className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-3xl font-bold text-green-700">{workoutStats?.completedWorkouts || 0}</div>
          <p className="text-sm text-green-600">
            {workoutStats && workoutStats.totalWorkouts > 0 
              ? `${Math.round((workoutStats.completedWorkouts / workoutStats.totalWorkouts) * 100)}% completion`
              : 'No data'}
          </p>
        </Card>
        
        <Card title="Total Volume" className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-3xl font-bold text-purple-700">
            {workoutStats?.totalVolume ? `${(workoutStats.totalVolume / 1000).toFixed(1)}k` : '0'} kg
          </div>
          <p className="text-sm text-purple-600">Lifetime</p>
        </Card>
        
        <Card title="Avg Duration" className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-3xl font-bold text-orange-700">
            {workoutStats?.averageDuration ? Math.round(workoutStats.averageDuration / 60) : 0} min
          </div>
          <p className="text-sm text-orange-600">Per workout</p>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      {weightData && weightData.length > 0 && (
        <Card title="Weight Progress">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={2} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Weekly Activity Chart */}
      {weeklyWorkouts && weeklyWorkouts.length > 0 && (
        <Card title="Weekly Activity">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkouts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Muscle Group Distribution */}
      {muscleGroupData && muscleGroupData.length > 0 && (
        <Card title="Muscle Group Distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={muscleGroupData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {muscleGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
