'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.coerce.number().min(1),
  reps: z.coerce.number().min(1).optional(),
  weight: z.coerce.number().min(0).optional(),
  restTime: z.coerce.number().min(0).default(60),
});

const workoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  exercises: z.array(workoutExerciseSchema).min(1, 'At least one exercise is required'),
});

export async function createWorkout(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const exercisesJson = formData.get('exercises');
    const exercises = exercisesJson ? JSON.parse(exercisesJson as string) : [];

    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      scheduledAt: formData.get('scheduledAt'),
      exercises,
    };

    const parsed = workoutSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const workout = await prisma.workout.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
        userId: user.id,
        exercises: {
          create: parsed.data.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restTime: ex.restTime,
            order: index,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    revalidatePath('/workouts');
    return { success: true, data: workout };
  } catch (error) {
    console.error('Error creating workout:', error);
    return { error: 'Failed to create workout' };
  }
}

export async function updateWorkout(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const exercisesJson = formData.get('exercises');
    const exercises = exercisesJson ? JSON.parse(exercisesJson as string) : [];

    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      scheduledAt: formData.get('scheduledAt'),
      exercises,
    };

    const parsed = workoutSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    await prisma.workoutExercise.deleteMany({
      where: { workoutId: id },
    });

    const workout = await prisma.workout.update({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
        exercises: {
          create: parsed.data.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restTime: ex.restTime,
            order: index,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    revalidatePath('/workouts');
    return { success: true, data: workout };
  } catch (error) {
    console.error('Error updating workout:', error);
    return { error: 'Failed to update workout' };
  }
}

export async function deleteWorkout(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    await prisma.workout.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/workouts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting workout:', error);
    return { error: 'Failed to delete workout' };
  }
}

export async function completeWorkout(id: string, exercises: { id: string; actualSets: number; actualReps?: number; actualWeight?: number }[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    await Promise.all(
      exercises.map(ex =>
        prisma.workoutExercise.update({
          where: { id: ex.id },
          data: {
            completed: true,
            actualSets: ex.actualSets,
            actualReps: ex.actualReps,
            actualWeight: ex.actualWeight,
          },
        })
      )
    );

    const workout = await prisma.workout.update({
      where: { id, userId: user.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    revalidatePath('/workouts');
    return { success: true, data: workout };
  } catch (error) {
    console.error('Error completing workout:', error);
    return { error: 'Failed to complete workout' };
  }
}

export async function getWorkouts() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return { success: true, data: workouts };
  } catch (error) {
    console.error('Error getting workouts:', error);
    return { error: 'Failed to get workouts' };
  }
}

export async function getWorkoutById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const workout = await prisma.workout.findFirst({
      where: { id, userId: user.id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workout) {
      return { error: 'Workout not found' };
    }

    return { success: true, data: workout };
  } catch (error) {
    console.error('Error getting workout:', error);
    return { error: 'Failed to get workout' };
  }
}

export async function updateWorkoutExerciseProgress(
  workoutExerciseId: string,
  data: { actualSets: number; actualReps?: number; actualWeight?: number }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const workoutExercise = await prisma.workoutExercise.update({
      where: { id: workoutExerciseId },
      data,
      include: {
        workout: true,
      },
    });

    if (workoutExercise.workout.userId !== user.id) {
      return { error: 'Unauthorized' };
    }

    return { success: true, data: workoutExercise };
  } catch (error) {
    console.error('Error updating exercise progress:', error);
    return { error: 'Failed to update exercise progress' };
  }
}
