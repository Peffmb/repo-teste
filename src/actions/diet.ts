'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const mealSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  time: z.string().optional(),
  notes: z.string().optional(),
});

const dietPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetCalories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  startDate: z.string(),
  endDate: z.string().optional(),
  meals: z.array(mealSchema).optional(),
});

export async function createDietPlan(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const mealsJson = formData.get('meals');
    const meals = mealsJson ? JSON.parse(mealsJson as string) : [];

    const rawData = {
      name: formData.get('name'),
      targetCalories: formData.get('targetCalories'),
      protein: formData.get('protein'),
      carbs: formData.get('carbs'),
      fats: formData.get('fats'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      meals,
    };

    const parsed = dietPlanSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const dietPlan = await prisma.dietPlan.create({
      data: {
        name: parsed.data.name,
        targetCalories: parsed.data.targetCalories,
        protein: parsed.data.protein,
        carbs: parsed.data.carbs,
        fats: parsed.data.fats,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        userId: user.id,
        meals: parsed.data.meals
          ? {
              create: parsed.data.meals.map((meal) => ({
                ...meal,
                time: meal.time ? new Date(meal.time) : null,
              })),
            }
          : undefined,
      },
      include: {
        meals: true,
      },
    });

    revalidatePath('/diet');
    return { success: true, data: dietPlan };
  } catch (error) {
    console.error('Error creating diet plan:', error);
    return { error: 'Failed to create diet plan' };
  }
}

export async function updateDietPlan(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const mealsJson = formData.get('meals');
    const meals = mealsJson ? JSON.parse(mealsJson as string) : [];

    const rawData = {
      name: formData.get('name'),
      targetCalories: formData.get('targetCalories'),
      protein: formData.get('protein'),
      carbs: formData.get('carbs'),
      fats: formData.get('fats'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      meals,
    };

    const parsed = dietPlanSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    await prisma.meal.deleteMany({
      where: { dietPlanId: id },
    });

    const dietPlan = await prisma.dietPlan.update({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        targetCalories: parsed.data.targetCalories,
        protein: parsed.data.protein,
        carbs: parsed.data.carbs,
        fats: parsed.data.fats,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        meals: parsed.data.meals
          ? {
              create: parsed.data.meals.map((meal) => ({
                ...meal,
                time: meal.time ? new Date(meal.time) : null,
              })),
            }
          : undefined,
      },
      include: {
        meals: true,
      },
    });

    revalidatePath('/diet');
    return { success: true, data: dietPlan };
  } catch (error) {
    console.error('Error updating diet plan:', error);
    return { error: 'Failed to update diet plan' };
  }
}

export async function deleteDietPlan(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    await prisma.dietPlan.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/diet');
    return { success: true };
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    return { error: 'Failed to delete diet plan' };
  }
}

export async function getDietPlans() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const dietPlans = await prisma.dietPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        meals: {
          orderBy: { type: 'asc' },
        },
      },
    });

    return { success: true, data: dietPlans };
  } catch (error) {
    console.error('Error getting diet plans:', error);
    return { error: 'Failed to get diet plans' };
  }
}

export async function getDietPlanById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const dietPlan = await prisma.dietPlan.findFirst({
      where: { id, userId: user.id },
      include: {
        meals: {
          orderBy: { type: 'asc' },
        },
      },
    });

    if (!dietPlan) {
      return { error: 'Diet plan not found' };
    }

    return { success: true, data: dietPlan };
  } catch (error) {
    console.error('Error getting diet plan:', error);
    return { error: 'Failed to get diet plan' };
  }
}

export async function addMeal(dietPlanId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const rawData = {
      name: formData.get('name'),
      type: formData.get('type'),
      calories: formData.get('calories'),
      protein: formData.get('protein'),
      carbs: formData.get('carbs'),
      fats: formData.get('fats'),
      time: formData.get('time'),
      notes: formData.get('notes'),
    };

    const parsed = mealSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const dietPlan = await prisma.dietPlan.findFirst({
      where: { id: dietPlanId, userId: user.id },
    });

    if (!dietPlan) {
      return { error: 'Diet plan not found' };
    }

    const meal = await prisma.meal.create({
      data: {
        ...parsed.data,
        dietPlanId,
        time: parsed.data.time ? new Date(parsed.data.time) : null,
      },
    });

    revalidatePath('/diet');
    return { success: true, data: meal };
  } catch (error) {
    console.error('Error adding meal:', error);
    return { error: 'Failed to add meal' };
  }
}

export async function deleteMeal(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const meal = await prisma.meal.findUnique({
      include: {
        dietPlan: true,
      },
    });

    if (!meal || meal.dietPlan.userId !== user.id) {
      return { error: 'Unauthorized' };
    }

    await prisma.meal.delete({
      where: { id },
    });

    revalidatePath('/diet');
    return { success: true };
  } catch (error) {
    console.error('Error deleting meal:', error);
    return { error: 'Failed to delete meal' };
  }
}
