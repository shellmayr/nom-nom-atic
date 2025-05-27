"use client";

import { useState, useEffect } from "react";
import RecipeForm from "../components/RecipeForm";
import TabbedRecipeView from "../components/TabbedRecipeView";
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
  const [hasContent, setHasContent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRecipeSubmit = async (userInput: string) => {
    setIsLoading(true);
    setHasContent(true);
    setRecipe("");
    setRecipeTitle("");
    setRecipeImage(null);
    setNutritionData(null);
    setRecipeMcpData(null);
    setNutritionMcpData(null);
    setNutritionLoading(false);
    
    try {
      // Generate the recipe first
      const result = await generateCombinedRecipe(userInput);
      setRecipe(result.recipe);
      
      // Recipe is ready - show it immediately
      setIsLoading(false);
      
      // Set recipe MCP data immediately when available
      if (isMCPData(result.mcpData)) {
        setRecipeMcpData(result.mcpData);
      } else {
        setRecipeMcpData(null);
      }
      
      // Generate creative title if we have MCP data with location/weather info
      let finalTitle = userInput; // Default fallback
      if (hasMCPTools(result.mcpData) && result.mcpData.toolsUsed.length > 0) {
        try {
          const creativeName = await generateCreativeTitle(userInput, result.mcpData);
          finalTitle = creativeName;
        } catch (titleError) {
          console.error("Error generating creative title:", titleError);
          // Keep the default title (userInput) if title generation fails
        }
      }
      setRecipeTitle(finalTitle);
      
      // Start background processes (nutrition and image)
      setNutritionLoading(true);
      
      // Parse ingredients from recipe for nutrition analysis
      const parsedRecipe = parseRecipeContent(result.recipe);
      const ingredientsList = parsedRecipe.ingredients.map(ing => 
        ing.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')
      );
      
      // Run background processes
      const [imageUrl, nutritionResult] = await Promise.all([
        generateRecipeImage(finalTitle),
        getNutritionData(ingredientsList)
      ]);
      
      // Set results
      if (imageUrl) {
        setRecipeImage(imageUrl);
      }
      
      if (nutritionResult.nutritionData) {
        setNutritionData(nutritionResult.nutritionData);
      }
      setNutritionMcpData(nutritionResult.mcpData);
      setNutritionLoading(false);
      
    } catch (error) {
      console.error("Error in recipe generation:", error);
      setIsLoading(false);
      setNutritionLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Top Bar with Title and Input */}
      <RecipeForm onSubmit={handleRecipeSubmit} isLoading={isLoading} />

      {/* Main Content */}
      {hasContent && (
        <div className="grid grid-cols-1 gap-6">
          {/* Recipe Section with Tabs - Takes full width */}
          <TabbedRecipeView
            recipe={recipe}
            recipeTitle={recipeTitle}
            recipeImage={recipeImage}
            nutritionData={nutritionData}
            nutritionLoading={nutritionLoading}
            servings={servings}
            onServingsChange={setServings}
            recipeMcpData={recipeMcpData}
            nutritionMcpData={nutritionMcpData}
            isRecipeLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
