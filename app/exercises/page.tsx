'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button, Card, Input, Select, Textarea, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import { getExercises, createExercise, deleteExercise } from '@/actions/exercises';
import type { Exercise } from '@prisma/client';

const categories = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'sport', label: 'Sport' },
];

const muscleGroups = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'core', label: 'Core' },
  { value: 'full-body', label: 'Full Body' },
];

const equipment = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance-band', label: 'Resistance Band' },
];

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    setLoading(true);
    const result = await getExercises();
    if (result.success && result.data) {
      setExercises(result.data);
    }
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await createExercise(formData);
    if (result.success) {
      setShowForm(false);
      await loadExercises();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    await deleteExercise(id);
    await loadExercises();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exercises</h1>
            <p className="text-gray-600 mt-1">Manage your exercise library</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Exercise'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <form action={handleSubmit} className="space-y-4">
              <Input name="name" label="Exercise Name" required placeholder="e.g., Bench Press" />
              
              <Textarea name="description" label="Description" placeholder="Optional description..." />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select name="category" label="Category" options={categories} defaultValue="strength" />
                <Select name="muscleGroup" label="Muscle Group" options={muscleGroups} />
                <Select name="equipment" label="Equipment" options={equipment} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Save Exercise
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : exercises.length === 0 ? (
          <EmptyState
            title="No exercises yet"
            description="Create your first exercise to start building your library"
            action={
              <Button onClick={() => setShowForm(true)}>
                + Add Exercise
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="info">{exercise.category}</Badge>
                  <button
                    onClick={() => handleDelete(exercise.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{exercise.name}</h3>
                
                {exercise.description && (
                  <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroup && (
                    <Badge variant="default">{exercise.muscleGroup}</Badge>
                  )}
                  {exercise.equipment && (
                    <Badge variant="default">{exercise.equipment}</Badge>
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
