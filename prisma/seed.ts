import prisma from './prisma';

const exercises = [
  { name: 'Bench Press', category: 'strength', muscleGroup: 'chest', equipment: 'barbell', description: 'Classic chest exercise' },
  { name: 'Squat', category: 'strength', muscleGroup: 'legs', equipment: 'barbell', description: 'Fundamental leg exercise' },
  { name: 'Deadlift', category: 'strength', muscleGroup: 'back', equipment: 'barbell', description: 'Full body compound movement' },
  { name: 'Overhead Press', category: 'strength', muscleGroup: 'shoulders', equipment: 'barbell', description: 'Shoulder strength builder' },
  { name: 'Barbell Row', category: 'strength', muscleGroup: 'back', equipment: 'barbell', description: 'Back thickness exercise' },
  { name: 'Pull-ups', category: 'strength', muscleGroup: 'back', equipment: 'bodyweight', description: 'Upper body pulling exercise' },
  { name: 'Dumbbell Curl', category: 'strength', muscleGroup: 'arms', equipment: 'dumbbell', description: 'Bicep isolation exercise' },
  { name: 'Tricep Dips', category: 'strength', muscleGroup: 'arms', equipment: 'bodyweight', description: 'Tricep compound movement' },
  { name: 'Leg Press', category: 'strength', muscleGroup: 'legs', equipment: 'machine', description: 'Quad focused machine exercise' },
  { name: 'Lat Pulldown', category: 'strength', muscleGroup: 'back', equipment: 'cable', description: 'Wide grip back exercise' },
  { name: 'Running', category: 'cardio', muscleGroup: 'full-body', equipment: 'bodyweight', description: 'Cardiovascular endurance' },
  { name: 'Cycling', category: 'cardio', muscleGroup: 'legs', equipment: 'machine', description: 'Low impact cardio' },
  { name: 'Plank', category: 'flexibility', muscleGroup: 'core', equipment: 'bodyweight', description: 'Core stability exercise' },
];

const workouts = [
  {
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps workout',
    status: 'completed',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 80, restTime: 120 },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 50, restTime: 90 },
      { name: 'Tricep Dips', sets: 3, reps: 12, weight: 0, restTime: 60 },
    ],
  },
  {
    name: 'Pull Day',
    description: 'Back and biceps workout',
    status: 'draft',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: 5, weight: 120, restTime: 180 },
      { name: 'Pull-ups', sets: 4, reps: 8, weight: 0, restTime: 90 },
      { name: 'Barbell Row', sets: 3, reps: 10, weight: 60, restTime: 90 },
      { name: 'Dumbbell Curl', sets: 3, reps: 12, weight: 15, restTime: 60 },
    ],
  },
  {
    name: 'Leg Day',
    description: 'Lower body focused workout',
    status: 'draft',
    exercises: [
      { name: 'Squat', sets: 4, reps: 6, weight: 100, restTime: 180 },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 150, restTime: 90 },
      { name: 'Running', sets: 1, reps: 30, weight: 0, restTime: 0 },
    ],
  },
];

async function seed() {
  console.log('Starting seed...');

  // Get or create a test user
  let user = await prisma.user.findFirst();
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: 'seed-user-id',
        email: 'seed@example.com',
        name: 'Seed User',
      },
    });
    console.log('Created seed user:', user.id);
  }

  // Create exercises
  const createdExercises = await Promise.all(
    exercises.map(ex => 
      prisma.exercise.upsert({
        where: { userId_name: { userId: user!.id, name: ex.name } },
        update: ex,
        create: { ...ex, userId: user!.id },
      })
    )
  );
  console.log(`Created ${createdExercises.length} exercises`);

  // Create workouts with exercises
  for (const workout of workouts) {
    const existingWorkout = await prisma.workout.findFirst({
      where: { userId: user!.id, name: workout.name },
    });

    if (existingWorkout) {
      await prisma.workout.delete({ where: { id: existingWorkout.id } });
    }

    const createdWorkout = await prisma.workout.create({
      data: {
        name: workout.name,
        description: workout.description,
        status: workout.status,
        userId: user!.id,
        exercises: {
          create: await Promise.all(
            workout.exercises.map(async (ex, index) => {
              const exercise = createdExercises.find(e => e.name === ex.name);
              return {
                exerciseId: exercise?.id || createdExercises[0].id,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                restTime: ex.restTime,
                order: index,
              };
            })
          ),
        },
      },
    });
    console.log(`Created workout: ${workout.name}`);
  }

  // Create sample weight logs
  const now = new Date();
  for (let i = 30; i >= 0; i -= 3) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    await prisma.weightLog.create({
      data: {
        userId: user!.id,
        weight: 75 + Math.sin(i / 5) * 2,
        unit: 'kg',
        loggedAt: date,
      },
    });
  }
  console.log('Created weight logs');

  // Create sample diet plan
  const dietPlan = await prisma.dietPlan.create({
    data: {
      userId: user!.id,
      name: 'Cutting Phase',
      targetCalories: 2000,
      protein: 180,
      carbs: 150,
      fats: 60,
      startDate: new Date(),
      isActive: true,
      meals: {
        create: [
          { name: 'Oatmeal & Eggs', type: 'breakfast', calories: 450, protein: 30, carbs: 50, fats: 15 },
          { name: 'Chicken Salad', type: 'lunch', calories: 550, protein: 45, carbs: 30, fats: 20 },
          { name: 'Salmon & Rice', type: 'dinner', calories: 600, protein: 50, carbs: 45, fats: 25 },
          { name: 'Protein Shake', type: 'snack', calories: 200, protein: 25, carbs: 10, fats: 5 },
        ],
      },
    },
  });
  console.log('Created diet plan');

  console.log('Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
