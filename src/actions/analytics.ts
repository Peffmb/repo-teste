'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function getAnalyticsData() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Get workout stats
    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
    
    let totalVolume = 0;
    let totalDuration = 0;
    let workoutsWithDuration = 0;

    workouts.forEach(workout => {
      if (workout.duration) {
        totalDuration += workout.duration;
        workoutsWithDuration++;
      }
      
      workout.exercises.forEach(we => {
        if (we.actualSets && we.actualReps && we.actualWeight) {
          totalVolume += we.actualSets * we.actualReps * we.actualWeight;
        } else if (we.sets && we.reps && we.weight) {
          totalVolume += we.sets * we.reps * we.weight;
        }
      });
    });

    const averageDuration = workoutsWithDuration > 0 
      ? Math.round(totalDuration / workoutsWithDuration) 
      : 0;

    // Get weekly workout data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = await prisma.workout.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        createdAt: {
          gte: weekAgo,
        },
      },
      _count: true,
    });

    const weeklyData = [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 },
      { day: 'Sun', count: 0 },
    ];

    workouts
      .filter(w => w.createdAt >= weekAgo)
      .forEach(workout => {
        const dayIndex = workout.createdAt.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        weeklyData[adjustedIndex].count += 1;
      });

    // Get muscle group distribution
    const muscleGroupCounts: Record<string, number> = {};
    
    workouts.forEach(workout => {
      workout.exercises.forEach(we => {
        const muscleGroup = we.exercise.muscleGroup || 'Other';
        muscleGroupCounts[muscleGroup] = (muscleGroupCounts[muscleGroup] || 0) + 1;
      });
    });

    const muscleGroupData = Object.entries(muscleGroupCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Get weight data for chart
    const weightLogs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'asc' },
      take: 30,
    });

    const weightData = weightLogs.map(log => ({
      date: new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: log.weight,
    }));

    return {
      success: true,
      data: {
        workoutStats: {
          totalWorkouts,
          completedWorkouts,
          totalVolume,
          averageDuration,
        },
        weeklyWorkouts: weeklyData,
        muscleGroupData,
        weightData,
      },
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return { error: 'Failed to get analytics data' };
  }
}

export async function getWorkoutHistory(limit = 10) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
    console.error('Error getting workout history:', error);
    return { error: 'Failed to get workout history' };
  }
}

export async function getProgressSummary() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const [workouts, weightLogs] = await Promise.all([
      prisma.workout.count({
        where: { userId: user.id, status: 'completed' },
      }),
      prisma.weightLog.findFirst({
        where: { userId: user.id },
        orderBy: { loggedAt: 'desc' },
      }),
    ]);

    const activeDietPlan = await prisma.dietPlan.findFirst({
      where: { userId: user.id, isActive: true },
    });

    return {
      success: true,
      data: {
        completedWorkouts: workouts,
        currentWeight: weightLogs?.weight || null,
        hasActiveDietPlan: !!activeDietPlan,
      },
    };
  } catch (error) {
    console.error('Error getting progress summary:', error);
    return { error: 'Failed to get progress summary' };
  }
}
