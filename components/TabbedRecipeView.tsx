import { useState } from "react";
import RecipeDisplay from "./RecipeDisplay";
import NutritionPanel from "./NutritionPanel";
import { NutritionData } from "../services/recipeApi";

interface TabbedRecipeViewProps {
  recipe: string;
  recipeTitle: string;
  recipeImage: string | null;
  nutritionData: NutritionData | null;
  nutritionLoading: boolean;
  servings: number;
  onServingsChange: (servings: number) => void;
}

export default function TabbedRecipeView({
  recipe,
  recipeTitle,
  recipeImage,
  nutritionData,
  nutritionLoading,
  servings,
  onServingsChange,
}: TabbedRecipeViewProps) {
  const [activeTab, setActiveTab] = useState<"recipe" | "nutrition">("recipe");

  return (
    <div className="lg:col-span-2">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("recipe")}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 ${
            activeTab === "recipe"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Recipe
        </button>
        <button
          onClick={() => setActiveTab("nutrition")}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 flex items-center gap-2 ${
            activeTab === "nutrition"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Nutrition
          {nutritionLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-emerald-500"></div>
          )}
          {!nutritionLoading && nutritionData && (
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "recipe" && (
          <RecipeDisplay 
            recipe={recipe}
            recipeTitle={recipeTitle}
            recipeImage={recipeImage}
          />
        )}
        
        {activeTab === "nutrition" && (
          <div>
            {nutritionLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing nutrition data...</p>
                </div>
              </div>
            )}
            
            {!nutritionLoading && nutritionData && (
              <NutritionPanel 
                nutritionData={nutritionData}
                servings={servings}
                onServingsChange={onServingsChange}
              />
            )}
            
            {!nutritionLoading && !nutritionData && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Nutrition data unavailable</p>
                  <p className="text-sm text-gray-400 mt-1">Unable to analyze ingredients</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 