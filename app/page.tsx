"use client";

import { useState, useEffect } from "react";
import RecipeForm from "../components/RecipeForm";
import TabbedRecipeView from "../components/TabbedRecipeView";
import CombinedMCPDebugPanel from "../components/CombinedMCPDebugPanel";
import { RecipeLoadingSkeleton, DebugLoadingSkeleton } from "../components/LoadingSkeleton";
import { generateCombinedRecipe, generateCreativeTitle, generateRecipeImage, getNutritionData, NutritionData } from "../services/recipeApi";
import { MCPData, isMCPData, hasMCPTools } from "../types/mcp";
import { parseRecipeContent } from "../utils/recipeParser";

export default function Home() {
  const [recipe, setRecipe] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [servings, setServings] = useState(4);
  const [recipeMcpData, setRecipeMcpData] = useState<MCPData | null>(null);
  const [nutritionMcpData, setNutritionMcpData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRecipeSubmit = async (userInput: string) => {
    setIsLoading(true);
    setRecipeTitle(""); // Clear previous title
    setRecipeImage(null); // Clear previous image
    setNutritionData(null); // Clear previous nutrition data
    setNutritionMcpData(null); // Clear previous nutrition MCP data
    setNutritionLoading(false); // Reset nutrition loading state
    
    // Generate the recipe first
    const result = await generateCombinedRecipe(userInput);
    setRecipe(result.recipe);
    
    // Type guard for MCP data
    if (isMCPData(result.mcpData)) {
      setRecipeMcpData(result.mcpData);
    } else {
      setRecipeMcpData(null);
    }
    
    // Generate creative title if we have MCP data with location/weather info
    let finalTitle = userInput; // Default fallback
    if (hasMCPTools(result.mcpData) && result.mcpData.toolsUsed.length > 0) {
      const creativeName = await generateCreativeTitle(userInput, result.mcpData);
      finalTitle = creativeName;
    }
    setRecipeTitle(finalTitle);
    
    // Parse ingredients from recipe for nutrition analysis
    const parsedRecipe = parseRecipeContent(result.recipe);
    const ingredientsList = parsedRecipe.ingredients.map(ing => 
      ing.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')
    );
    
    // Start background nutrition loading
    setNutritionLoading(true);
    
    // Parallelize image generation and nutrition data fetching
    const [imageUrl, nutritionResult] = await Promise.all([
      generateRecipeImage(finalTitle),
      getNutritionData(ingredientsList)
    ]);
    
    // Set image immediately
    if (imageUrl) {
      setRecipeImage(imageUrl);
    }
    
    // Set nutrition data and MCP data, then stop loading
    if (nutritionResult.nutritionData) {
      setNutritionData(nutritionResult.nutritionData);
    }
    setNutritionMcpData(nutritionResult.mcpData);
    setNutritionLoading(false);
    
    // Recipe generation is complete
    setIsLoading(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Top Bar with Title and Input */}
      <RecipeForm onSubmit={handleRecipeSubmit} isLoading={isLoading} />

      {/* Main Content */}
      {((recipe ? true : false) || (recipeMcpData ? true : false) || (nutritionMcpData ? true : false)) && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Section with Tabs - Takes 2/3 of the width */}
          {recipe && (
            <TabbedRecipeView
              recipe={recipe}
              recipeTitle={recipeTitle}
              recipeImage={recipeImage}
              nutritionData={nutritionData}
              nutritionLoading={nutritionLoading}
              servings={servings}
              onServingsChange={setServings}
            />
          )}

          {/* Combined MCP Data Section - Takes 1/3 of the width on the right */}
          {((recipeMcpData ? true : false) || (nutritionMcpData ? true : false)) && (
            <CombinedMCPDebugPanel 
              recipeMcpData={recipeMcpData}
              nutritionMcpData={nutritionMcpData}
            />
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecipeLoadingSkeleton />
          </div>
          <DebugLoadingSkeleton />
        </div>
      )}
    </div>
  );
}
