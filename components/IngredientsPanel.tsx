import RecipeImage from "./RecipeImage";
import { parseMarkdown } from "../utils/recipeParser";
import React from "react";

interface IngredientsPanelProps {
  ingredients: string[];
  recipeImage?: string | null;
  recipeTitle: string;
}

export default function IngredientsPanel({ 
  ingredients, 
  recipeImage, 
  recipeTitle 
}: IngredientsPanelProps) {
  return (
    <div className="lg:col-span-2 bg-gradient-to-b from-gray-50/50 to-gray-50/30 border-r border-gray-100/80 px-8 py-6">
      <div className="sticky top-6">
        {/* Recipe Image */}
        {recipeImage && (
          <RecipeImage imageUrl={recipeImage} recipeTitle={recipeTitle} />
        )}
        
        <h2 className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-[0.2em] letter-spacing-wider">
          Ingredients
        </h2>
        
        {ingredients.length > 0 ? (
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-start space-x-4 text-sm leading-relaxed">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                <span className="text-gray-700 font-light">
                  {parseMarkdown(ingredient.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')).map((node, nodeIndex) => (
                    <React.Fragment key={nodeIndex}>{node}</React.Fragment>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm font-light italic">No ingredients listed</p>
        )}
      </div>
    </div>
  );
} 