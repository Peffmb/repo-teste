'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const weightLogSchema = z.object({
  weight: z.coerce.number().min(0, 'Weight must be positive'),
  unit: z.enum(['kg', 'lbs']).default('kg'),
  bodyFat: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
});

export async function createWeightLog(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const rawData = {
      weight: formData.get('weight'),
      unit: formData.get('unit'),
      bodyFat: formData.get('bodyFat'),
      notes: formData.get('notes'),
      loggedAt: formData.get('loggedAt'),
    };

    const parsed = weightLogSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const weightLog = await prisma.weightLog.create({
      data: {
        ...parsed.data,
        loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date(),
        userId: user.id,
      },
    });

    revalidatePath('/weight');
    return { success: true, data: weightLog };
  } catch (error) {
    console.error('Error creating weight log:', error);
    return { error: 'Failed to create weight log' };
  }
}

export async function updateWeightLog(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const rawData = {
      weight: formData.get('weight'),
      unit: formData.get('unit'),
      bodyFat: formData.get('bodyFat'),
      notes: formData.get('notes'),
      loggedAt: formData.get('loggedAt'),
    };

    const parsed = weightLogSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const weightLog = await prisma.weightLog.update({
      where: { id, userId: user.id },
      data: {
        ...parsed.data,
        loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : undefined,
      },
    });

    revalidatePath('/weight');
    return { success: true, data: weightLog };
  } catch (error) {
    console.error('Error updating weight log:', error);
    return { error: 'Failed to update weight log' };
  }
}

export async function deleteWeightLog(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    await prisma.weightLog.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/weight');
    return { success: true };
  } catch (error) {
    console.error('Error deleting weight log:', error);
    return { error: 'Failed to delete weight log' };
  }
}

export async function getWeightLogs() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const weightLogs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
    });

    return { success: true, data: weightLogs };
  } catch (error) {
    console.error('Error getting weight logs:', error);
    return { error: 'Failed to get weight logs' };
  }
}

export async function getWeightLogsForChart(limit = 30) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const weightLogs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'asc' },
      take: limit,
    });

    const chartData = weightLogs.map(log => ({
      date: new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: log.weight,
    }));

    return { success: true, data: chartData };
  } catch (error) {
    console.error('Error getting weight logs for chart:', error);
    return { error: 'Failed to get weight logs for chart' };
  }
}

export async function getWeightStats() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const weightLogs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
    });

    if (weightLogs.length === 0) {
      return { 
        success: true, 
        data: {
          currentWeight: null,
          startWeight: null,
          minWeight: null,
          maxWeight: null,
          change: null,
          percentChange: null,
        }
      };
    }

    const weights = weightLogs.map(log => log.weight);
    const currentWeight = weightLogs[0].weight;
    const startWeight = weightLogs[weightLogs.length - 1].weight;
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const change = currentWeight - startWeight;
    const percentChange = ((change / startWeight) * 100).toFixed(1);

    return {
      success: true,
      data: {
        currentWeight,
        startWeight,
        minWeight,
        maxWeight,
        change,
        percentChange,
      },
    };
  } catch (error) {
    console.error('Error getting weight stats:', error);
    return { error: 'Failed to get weight stats' };
  }
}
