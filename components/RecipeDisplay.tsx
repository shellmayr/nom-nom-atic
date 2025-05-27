import IngredientsPanel from "./IngredientsPanel";
import InstructionsPanel from "./InstructionsPanel";
import { parseRecipeContent, parseMarkdown } from "../utils/recipeParser";
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
            notes={parsedRecipe.notes}
          />
        </div>

        {/* Variations Section - Bottom */}
        {(parsedRecipe.variations.length > 0 || parsedRecipe.seasonalAdditions.length > 0) && (
          <div className="border-t border-gray-100/80 bg-gradient-to-r from-slate-50/30 to-gray-50/30 px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Variations */}
              {parsedRecipe.variations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-[0.15em]">
                    Variations
                  </h3>
                  <div className="space-y-3">
                    {parsedRecipe.variations.map((variation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-1 h-1 bg-purple-400 rounded-full mt-2.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700 font-light leading-relaxed">
                          {parseMarkdown(variation).map((node, nodeIndex) => (
                            <React.Fragment key={nodeIndex}>{node}</React.Fragment>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Additions */}
              {parsedRecipe.seasonalAdditions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-[0.15em]">
                    Seasonal
                  </h3>
                  <div className="space-y-3">
                    {parsedRecipe.seasonalAdditions.map((addition, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-1 h-1 bg-orange-400 rounded-full mt-2.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700 font-light leading-relaxed">
                          {parseMarkdown(addition).map((node, nodeIndex) => (
                            <React.Fragment key={nodeIndex}>{node}</React.Fragment>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 