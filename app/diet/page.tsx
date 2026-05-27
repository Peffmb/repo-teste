'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button, Card, Input, Select, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import { getDietPlans, createDietPlan, deleteDietPlan, addMeal, deleteMeal } from '@/actions/diet';
import type { DietPlan, Meal } from '@prisma/client';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function DietPage() {
  const [dietPlans, setDietPlans] = useState<(DietPlan & { meals: Meal[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDietPlans();
  }, []);

  async function loadDietPlans() {
    setLoading(true);
    const result = await getDietPlans();
    if (result.success && result.data) {
      setDietPlans(result.data as (DietPlan & { meals: Meal[] })[]);
    }
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const mealsData = formData.get('meals') || '[]';
    const result = await createDietPlan(formData);
    if (result.success) {
      setShowForm(false);
      await loadDietPlans();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this diet plan?')) return;
    await deleteDietPlan(id);
    await loadDietPlans();
  }

  async function handleAddMeal(formData: FormData) {
    if (!selectedPlan) return;
    setSubmitting(true);
    const result = await addMeal(selectedPlan, formData);
    if (result.success) {
      setShowAddMeal(false);
      await loadDietPlans();
    }
    setSubmitting(false);
  }

  async function handleDeleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return;
    await deleteMeal(id);
    await loadDietPlans();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Diet Plans</h1>
            <p className="text-gray-600 mt-1">Plan your meals and track macros</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Plan'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <form action={handleSubmit} className="space-y-4">
              <Input name="name" label="Plan Name" required placeholder="e.g., Cutting Phase" />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input name="targetCalories" label="Target Calories" type="number" required />
                <Input name="protein" label="Protein (g)" type="number" required />
                <Input name="carbs" label="Carbs (g)" type="number" required />
                <Input name="fats" label="Fats (g)" type="number" required />
                <Input name="startDate" label="Start Date" type="date" required />
              </div>
              
              <Input name="endDate" label="End Date (optional)" type="date" />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Save Plan
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : dietPlans.length === 0 ? (
          <EmptyState
            title="No diet plans yet"
            description="Create your first diet plan to start tracking nutrition"
            action={
              <Button onClick={() => setShowForm(true)}>
                + Create Plan
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {dietPlans.map((plan) => (
              <Card key={plan.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                      {plan.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Calories:</span>
                        <span className="ml-2 font-medium">{plan.targetCalories}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Protein:</span>
                        <span className="ml-2 font-medium">{plan.protein}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Carbs:</span>
                        <span className="ml-2 font-medium">{plan.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fats:</span>
                        <span className="ml-2 font-medium">{plan.fats}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setShowAddMeal(true);
                      }}
                    >
                      + Add Meal
                    </Button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-gray-400 hover:text-red-600 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Meals */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Meals</h4>
                  {plan.meals.length === 0 ? (
                    <p className="text-gray-500 text-sm">No meals added</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.meals.map((meal) => (
                        <div key={meal.id} className="bg-gray-50 p-4 rounded-lg relative">
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{meal.name}</span>
                            <Badge variant="default">{meal.type}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-x-3">
                            <span>{meal.calories} cal</span>
                            <span>P: {meal.protein}g</span>
                            <span>C: {meal.carbs}g</span>
                            <span>F: {meal.fats}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Meal Modal */}
        {showAddMeal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Meal</h3>
              <form action={handleAddMeal} className="space-y-4">
                <Input name="name" label="Meal Name" required placeholder="e.g., Grilled Chicken Salad" />
                <Select name="type" label="Meal Type" options={mealTypes} />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="calories" label="Calories" type="number" required />
                  <Input name="protein" label="Protein (g)" type="number" required />
                  <Input name="carbs" label="Carbs (g)" type="number" required />
                  <Input name="fats" label="Fats (g)" type="number" required />
                </div>
                <Input name="time" label="Time" type="time" />
                <Input name="notes" label="Notes" placeholder="Optional notes..." />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddMeal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={submitting}>
                    Add Meal
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
