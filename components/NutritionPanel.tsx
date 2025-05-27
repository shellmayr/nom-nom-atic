import { NutritionData } from "../services/recipeApi";

interface NutritionPanelProps {
  nutritionData: NutritionData;
  servings: number;
  onServingsChange: (servings: number) => void;
}

export default function NutritionPanel({ 
  nutritionData, 
  servings, 
  onServingsChange 
}: NutritionPanelProps) {
  const perServing = {
    calories: Math.round(nutritionData.totalNutrition.calories / servings),
    protein: Math.round((nutritionData.totalNutrition.protein / servings) * 10) / 10,
    carbs: Math.round((nutritionData.totalNutrition.carbs / servings) * 10) / 10,
    fat: Math.round((nutritionData.totalNutrition.fat / servings) * 10) / 10,
    fiber: Math.round((nutritionData.totalNutrition.fiber / servings) * 10) / 10,
    sugar: Math.round((nutritionData.totalNutrition.sugar / servings) * 10) / 10,
    sodium: Math.round(nutritionData.totalNutrition.sodium / servings),
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-green-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Nutrition Facts</h2>
          
          {/* Servings Control */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Servings:</label>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
              >
                −
              </button>
              <span className="px-4 py-1 text-center font-medium min-w-[3rem]">
                {servings}
              </span>
              <button
                onClick={() => onServingsChange(servings + 1)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Per Serving Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Per Serving</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Calories</span>
                <span className="text-lg font-bold text-gray-900">{perServing.calories}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-medium">{perServing.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbs</span>
                  <span className="font-medium">{perServing.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-medium">{perServing.fat}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fiber</span>
                  <span className="font-medium">{perServing.fiber}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sugar</span>
                  <span className="font-medium">{perServing.sugar}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sodium</span>
                  <span className="font-medium">{perServing.sodium}mg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Recipe Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Recipe</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Calories</span>
                <span className="text-lg font-bold text-gray-900">{nutritionData.totalNutrition.calories}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-medium">{nutritionData.totalNutrition.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbs</span>
                  <span className="font-medium">{nutritionData.totalNutrition.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-medium">{nutritionData.totalNutrition.fat}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fiber</span>
                  <span className="font-medium">{nutritionData.totalNutrition.fiber}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sugar</span>
                  <span className="font-medium">{nutritionData.totalNutrition.sugar}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sodium</span>
                  <span className="font-medium">{nutritionData.totalNutrition.sodium}mg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Ingredients Breakdown */}
        {nutritionData.ingredients && nutritionData.ingredients.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-[0.15em]">
              Key Ingredients
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nutritionData.ingredients.slice(0, 6).map((ingredient, index) => (
                <div key={index} className="flex justify-between items-center text-xs p-3 bg-gray-50/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">{ingredient.name}</span>
                    <span className="text-gray-500 block">{ingredient.amount}</span>
                  </div>
                  <span className="font-medium text-gray-600">{ingredient.calories} cal</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 