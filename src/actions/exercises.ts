'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['strength', 'cardio', 'flexibility', 'sport']),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
});

export async function createExercise(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      muscleGroup: formData.get('muscleGroup'),
      equipment: formData.get('equipment'),
    };

    const parsed = exerciseSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const exercise = await prisma.exercise.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    });

    revalidatePath('/exercises');
    return { success: true, data: exercise };
  } catch (error) {
    console.error('Error creating exercise:', error);
    return { error: 'Failed to create exercise' };
  }
}

export async function updateExercise(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      muscleGroup: formData.get('muscleGroup'),
      equipment: formData.get('equipment'),
    };

    const parsed = exerciseSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const exercise = await prisma.exercise.update({
      where: { id, userId: user.id },
      data: parsed.data,
    });

    revalidatePath('/exercises');
    return { success: true, data: exercise };
  } catch (error) {
    console.error('Error updating exercise:', error);
    return { error: 'Failed to update exercise' };
  }
}

export async function deleteExercise(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    await prisma.exercise.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/exercises');
    return { success: true };
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return { error: 'Failed to delete exercise' };
  }
}

export async function getExercises() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: exercises };
  } catch (error) {
    console.error('Error getting exercises:', error);
    return { error: 'Failed to get exercises' };
  }
}

export async function getExerciseById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const exercise = await prisma.exercise.findFirst({
      where: { id, userId: user.id },
    });

    if (!exercise) {
      return { error: 'Exercise not found' };
    }

    return { success: true, data: exercise };
  } catch (error) {
    console.error('Error getting exercise:', error);
    return { error: 'Failed to get exercise' };
  }
}
