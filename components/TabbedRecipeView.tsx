import { useState, useEffect } from "react";
import RecipeDisplay from "./RecipeDisplay";
import NutritionPanel from "./NutritionPanel";
import MCPTraceView from "./MCPTraceView";
import { NutritionData } from "../services/recipeApi";

interface TabbedRecipeViewProps {
  recipe: string;
  recipeTitle: string;
  recipeImage: string | null;
  nutritionData: NutritionData | null;
  nutritionLoading: boolean;
  servings: number;
  onServingsChange: (servings: number) => void;
  recipeMcpData?: unknown;
  nutritionMcpData?: unknown;
  isRecipeLoading?: boolean;
}

export default function TabbedRecipeView({
  recipe,
  recipeTitle,
  recipeImage,
  nutritionData,
  nutritionLoading,
  servings,
  onServingsChange,
  recipeMcpData,
  nutritionMcpData,
  isRecipeLoading,
}: TabbedRecipeViewProps) {
  const [activeTab, setActiveTab] = useState<"recipe" | "nutrition" | "trace">("recipe");

  // Ensure we're on recipe tab when recipe content becomes available
  useEffect(() => {
    if (recipe && !isRecipeLoading) {
      setActiveTab("recipe");
    }
  }, [recipe, isRecipeLoading]);

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("recipe")}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 flex items-center gap-2 ${
            activeTab === "recipe"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Recipe
          {isRecipeLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          )}
          {!isRecipeLoading && recipe && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
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
        <button
          onClick={() => setActiveTab("trace")}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 flex items-center gap-2 ${
            activeTab === "trace"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Trace
          {(recipeMcpData || nutritionMcpData || nutritionLoading) && (
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "recipe" && (
          <div>
            {isRecipeLoading ? (
              <div className="min-h-[400px]">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
                  {/* Title Skeleton */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-8 py-8">
                    <div className="h-8 bg-gray-200 rounded-lg animate-pulse mx-auto max-w-md"></div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[400px]">
                    {/* Ingredients Skeleton */}
                    <div className="lg:col-span-2 bg-gradient-to-b from-gray-50/50 to-gray-50/30 border-r border-gray-100/80 px-8 py-6">
                      {/* Image Skeleton */}
                      <div className="mb-8">
                        <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
                      </div>
                      
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-20"></div>
                      <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex items-start space-x-4">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2.5 animate-pulse"></div>
                            <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions Skeleton */}
                    <div className="lg:col-span-3 px-8 py-6">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-16"></div>
                      <div className="space-y-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex space-x-5">
                            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                              <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`}></div>
                              <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : recipe ? (
              <RecipeDisplay 
                recipe={recipe}
                recipeTitle={recipeTitle}
                recipeImage={recipeImage}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No recipe available</p>
                  <p className="text-sm text-gray-400 mt-1">Submit a recipe request to get started</p>
                </div>
              </div>
            )}
          </div>
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
        
        {activeTab === "trace" && (
          <MCPTraceView 
            recipeMcpData={recipeMcpData}
            nutritionMcpData={nutritionMcpData}
            nutritionLoading={nutritionLoading}
          />
        )}
      </div>
    </div>
  );
} 