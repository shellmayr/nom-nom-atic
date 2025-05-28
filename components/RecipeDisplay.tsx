import IngredientsPanel from "./IngredientsPanel";
import InstructionsPanel from "./InstructionsPanel";
import { parseRecipeContent } from "../utils/recipeParser";
import React from "react";

interface RecipeDisplayProps {
  recipe: string;
  recipeTitle: string;
  recipeImage?: string | null;
}

export default function RecipeDisplay({ 
  recipe, 
  recipeTitle, 
  recipeImage 
}: RecipeDisplayProps) {
  const parsedRecipe = parseRecipeContent(recipe);

  return (
    <div className="lg:col-span-2">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Recipe Title */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-8 py-8">
          <h1 className="text-2xl font-semibold text-center tracking-wide leading-tight text-gray-900">
            {(recipeTitle || "Generated Recipe").replace(/^["']|["']$/g, '')}
          </h1>
          
          {/* Recipe Metadata */}
          {(parsedRecipe.description || parsedRecipe.prepTime || parsedRecipe.cookTime || parsedRecipe.totalTime || parsedRecipe.servings) && (
            <div className="mt-6 space-y-2">
              {parsedRecipe.description && (
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  {parsedRecipe.description}
                </p>
              )}
              <div className="flex justify-center space-x-6 text-xs text-gray-500">
                {parsedRecipe.prepTime && (
                  <span><span className="font-medium">Prep:</span> {parsedRecipe.prepTime}</span>
                )}
                {parsedRecipe.cookTime && (
                  <span><span className="font-medium">Cook:</span> {parsedRecipe.cookTime}</span>
                )}
                {parsedRecipe.totalTime && (
                  <span><span className="font-medium">Total:</span> {parsedRecipe.totalTime}</span>
                )}
                {parsedRecipe.servings && (
                  <span><span className="font-medium">Serves:</span> {parsedRecipe.servings}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Recipe Content - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[400px]">
          {/* Ingredients Panel - Left Side */}
          <IngredientsPanel 
            ingredients={parsedRecipe.ingredients}
            recipeImage={recipeImage}
            recipeTitle={recipeTitle}
          />

          {/* Instructions Panel - Right Side */}
          <InstructionsPanel 
            instructions={parsedRecipe.instructions}
            notes={parsedRecipe.tips}
          />
        </div>

        {/* Nutrition Information Section */}
        {parsedRecipe.nutritionInfo && Object.values(parsedRecipe.nutritionInfo).some(val => val !== null && val !== undefined && val !== '') && (
          <div className="border-t border-gray-100/80 bg-gradient-to-r from-emerald-50/30 to-green-50/30 px-8 py-6">
            <h3 className="text-xs font-bold text-gray-600 mb-5 uppercase tracking-[0.15em] flex items-center">
              <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nutrition Information (Per Serving)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {parsedRecipe.nutritionInfo.calories && parsedRecipe.nutritionInfo.calories > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.calories}</div>
                  <div className="text-xs text-gray-600 font-medium">Calories</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.protein && parsedRecipe.nutritionInfo.protein > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.protein}g</div>
                  <div className="text-xs text-gray-600 font-medium">Protein</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.carbs && parsedRecipe.nutritionInfo.carbs > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.carbs}g</div>
                  <div className="text-xs text-gray-600 font-medium">Carbs</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.fat && parsedRecipe.nutritionInfo.fat > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.fat}g</div>
                  <div className="text-xs text-gray-600 font-medium">Fat</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.fiber && parsedRecipe.nutritionInfo.fiber > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.fiber}g</div>
                  <div className="text-xs text-gray-600 font-medium">Fiber</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.sugar && parsedRecipe.nutritionInfo.sugar > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.sugar}g</div>
                  <div className="text-xs text-gray-600 font-medium">Sugar</div>
                </div>
              )}
              {parsedRecipe.nutritionInfo.sodium && parsedRecipe.nutritionInfo.sodium > 0 && (
                <div className="text-center bg-white/50 rounded-lg p-3 border border-emerald-100/50">
                  <div className="text-xl font-bold text-emerald-700">{parsedRecipe.nutritionInfo.sodium}mg</div>
                  <div className="text-xs text-gray-600 font-medium">Sodium</div>
                </div>
              )}
            </div>
            {parsedRecipe.nutritionInfo.highlights && parsedRecipe.nutritionInfo.highlights.trim() && (
              <div className="mt-4 bg-white/30 rounded-lg p-4 border border-emerald-100/50">
                <p className="text-sm text-gray-700 italic leading-relaxed">{parsedRecipe.nutritionInfo.highlights.trim()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 