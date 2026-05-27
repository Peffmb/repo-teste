'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui';
import { getWorkoutById, completeWorkout, updateWorkoutExerciseProgress } from '@/actions/workouts';
import type { Workout, Exercise } from '@prisma/client';

interface WorkoutExerciseWithExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps?: number | null;
  weight?: number | null;
  restTime: number;
  completed: boolean;
  actualSets: number;
  actualReps?: number | null;
  actualWeight?: number | null;
  order: number;
}

interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExerciseWithExercise[];
}

export default function ExecuteWorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.workoutId as string;
  
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [startTime] = useState(Date.now());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWorkout();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0 && isResting) {
      setIsResting(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting, restTimer]);

  async function loadWorkout() {
    const result = await getWorkoutById(workoutId);
    if (result.success && result.data) {
      setWorkout(result.data as WorkoutWithExercises);
    }
    setLoading(false);
  }

  function startRest(exerciseIndex: number) {
    const exercise = workout?.exercises[exerciseIndex];
    if (exercise) {
      setRestTimer(exercise.restTime);
      setIsResting(true);
    }
  }

  function skipRest() {
    setIsResting(false);
    setRestTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleCompleteSet(exerciseId: string, setData: { actualSets: number; actualReps?: number; actualWeight?: number }) {
    if (!workout) return;
    
    const result = await updateWorkoutExerciseProgress(exerciseId, setData);
    if (result.success) {
      await loadWorkout();
    }
  }

  async function handleFinishWorkout() {
    if (!workout) return;
    
    setCompleting(true);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    const exercisesData = workout.exercises.map(ex => ({
      id: ex.id,
      actualSets: ex.actualSets,
      actualReps: ex.actualReps,
      actualWeight: ex.actualWeight,
    }));
    
    const result = await completeWorkout(workoutId, exercisesData);
    if (result.success) {
      router.push('/workouts');
    }
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Workout not found</p>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
  const progress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
          <p className="text-gray-600">{workout.exercises.length} exercises</p>
          
          {/* Progress bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rest Timer Overlay */}
        {isResting && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Rest Time</h3>
              <div className="text-4xl font-bold text-yellow-600 mb-4">
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </div>
              <Button variant="outline" onClick={skipRest}>Skip Rest</Button>
            </div>
          </Card>
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <Card className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentExercise.exercise.name}</h2>
                <p className="text-gray-600">Exercise {currentExerciseIndex + 1} of {workout.exercises.length}</p>
              </div>
              <Badge variant="info">{currentExercise.exercise.category}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Sets</p>
                <p className="text-2xl font-bold">{currentExercise.sets}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Reps</p>
                <p className="text-2xl font-bold">{currentExercise.reps || '-'}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Weight</p>
                <p className="text-2xl font-bold">{currentExercise.weight ? `${currentExercise.weight} kg` : '-'}</p>
              </div>
            </div>

            {/* Log Set Form */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Log Your Sets</h3>
              <div className="space-y-3">
                {[...Array(currentExercise.sets)].map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-gray-600">Set {index + 1}</span>
                    <input
                      type="number"
                      placeholder="Reps"
                      className="w-24 px-3 py-2 border rounded-lg"
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value) {
                          handleCompleteSet(currentExercise.id, {
                            actualSets: index + 1,
                            actualReps: value,
                          });
                        }
                      }}
                    />
                    <input
                      type="number"
                      placeholder="kg"
                      className="w-24 px-3 py-2 border rounded-lg"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value) {
                          handleCompleteSet(currentExercise.id, {
                            actualSets: index + 1,
                            actualWeight: value,
                          });
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                disabled={currentExerciseIndex === 0}
              >
                Previous
              </Button>
              
              {isLastExercise ? (
                <Button onClick={handleFinishWorkout} isLoading={completing}>
                  Finish Workout
                </Button>
              ) : (
                <Button onClick={() => {
                  startRest(currentExerciseIndex);
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                }}>
                  Next Exercise
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Exercise List Overview */}
        <Card>
          <h3 className="font-semibold mb-4">Workout Overview</h3>
          <div className="space-y-2">
            {workout.exercises.map((ex, index) => (
              <button
                key={ex.id}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  index === currentExerciseIndex
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{ex.exercise.name}</span>
                <span className="text-sm text-gray-600">
                  {ex.sets} x {ex.reps || '-'} {ex.weight ? `@ ${ex.weight}kg` : ''}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
