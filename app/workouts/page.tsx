'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button, Card, Input, Select, Textarea, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import { getWorkouts, createWorkout, deleteWorkout } from '@/actions/workouts';
import { getExercises } from '@/actions/exercises';
import type { Workout, Exercise } from '@prisma/client';

interface WorkoutWithExercises extends Workout {
  exercises: (WorkoutExercise & { exercise: Exercise })[];
}

interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  restTime: number;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [workoutsResult, exercisesResult] = await Promise.all([
      getWorkouts(),
      getExercises(),
    ]);
    if (workoutsResult.success && workoutsResult.data) {
      setWorkouts(workoutsResult.data as WorkoutWithExercises[]);
    }
    if (exercisesResult.success && exercisesResult.data) {
      setExercises(exercisesResult.data);
    }
    setLoading(false);
  }

  function addExercise(exerciseId: string) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise || selectedExercises.find(e => e.exerciseId === exerciseId)) return;

    setSelectedExercises([
      ...selectedExercises,
      { exerciseId, sets: 3, reps: 10, weight: 0, restTime: 60 },
    ]);
  }

  function updateSelectedExercise(index: number, field: keyof WorkoutExercise, value: number) {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedExercises(updated);
  }

  function removeSelectedExercise(index: number) {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    setSubmitting(true);
    formData.append('exercises', JSON.stringify(selectedExercises));
    const result = await createWorkout(formData);
    if (result.success) {
      setShowForm(false);
      setSelectedExercises([]);
      await loadData();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    await deleteWorkout(id);
    await loadData();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
            <p className="text-gray-600 mt-1">Create and manage your workout routines</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Workout'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <form action={handleSubmit} className="space-y-4">
              <Input name="name" label="Workout Name" required placeholder="e.g., Upper Body Day" />
              <Textarea name="description" label="Description" placeholder="Optional description..." />
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Add Exercises</h3>
                
                <div className="flex gap-2 mb-4">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => addExercise(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select an exercise</option>
                    {exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                {selectedExercises.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No exercises added yet</p>
                ) : (
                  <div className="space-y-4">
                    {selectedExercises.map((ex, index) => {
                      const exercise = exercises.find(e => e.id === ex.exerciseId);
                      return (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-medium">{exercise?.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedExercise(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input
                              type="number"
                              label="Sets"
                              value={ex.sets}
                              onChange={(e) => updateSelectedExercise(index, 'sets', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                            <Input
                              type="number"
                              label="Reps"
                              value={ex.reps || ''}
                              onChange={(e) => updateSelectedExercise(index, 'reps', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                            <Input
                              type="number"
                              label="Weight (kg)"
                              value={ex.weight || ''}
                              onChange={(e) => updateSelectedExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.5"
                            />
                            <Input
                              type="number"
                              label="Rest (sec)"
                              value={ex.restTime}
                              onChange={(e) => updateSelectedExercise(index, 'restTime', parseInt(e.target.value) || 0)}
                              min="0"
                              step="15"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting} disabled={selectedExercises.length === 0}>
                  Save Workout
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : workouts.length === 0 ? (
          <EmptyState
            title="No workouts yet"
            description="Create your first workout routine"
            action={
              <Button onClick={() => setShowForm(true)}>
                + Create Workout
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={workout.status === 'completed' ? 'success' : 'default'}>
                    {workout.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Link href={`/workouts/execute/${workout.id}`}>
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(workout.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{workout.name}</h3>
                
                {workout.description && (
                  <p className="text-gray-600 text-sm mb-3">{workout.description}</p>
                )}
                
                <div className="text-sm text-gray-500">
                  <p>{workout.exercises.length} exercises</p>
                  {workout.completedAt && (
                    <p>Completed: {new Date(workout.completedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
