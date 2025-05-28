"use client";

import { useState, useEffect } from "react";
import RecipeForm from "../components/RecipeForm";
import TabbedRecipeView from "../components/TabbedRecipeView";
import { generateCombinedRecipe, generateCreativeTitle, generateRecipeImage, NutritionData } from "../services/recipeApi";
import { MCPData, isMCPData } from "../types/mcp";
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
      // Generate the recipe first (now includes nutrition)
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
      
      // Generate creative title always, not just when MCP tools are used
      let finalTitle = userInput; // Default fallback
      try {
        const creativeName = await generateCreativeTitle(userInput, result.mcpData);
        finalTitle = creativeName;
      } catch (titleError) {
        console.error("Error generating creative title:", titleError);
        // Keep the default title (userInput) if title generation fails
      }
      setRecipeTitle(finalTitle);
      
      // Parse recipe to extract nutrition information
      const parsedRecipe = parseRecipeContent(result.recipe);
      
      // Convert parsed nutrition info to the expected format
      if (parsedRecipe.nutritionInfo && Object.keys(parsedRecipe.nutritionInfo).length > 0) {
        const nutritionData: NutritionData = {
          totalNutrition: {
            calories: parsedRecipe.nutritionInfo.calories || 0,
            protein: parsedRecipe.nutritionInfo.protein || 0,
            carbs: parsedRecipe.nutritionInfo.carbs || 0,
            fat: parsedRecipe.nutritionInfo.fat || 0,
            fiber: parsedRecipe.nutritionInfo.fiber || 0,
            sugar: parsedRecipe.nutritionInfo.sugar || 0,
            sodium: parsedRecipe.nutritionInfo.sodium || 0,
          },
          ingredients: [], // We'll populate this if needed
        };
        setNutritionData(nutritionData);
        // Don't set nutritionMcpData since the tools are already tracked in recipeMcpData
      }
      
      // Generate recipe image in background
      try {
        const imageUrl = await generateRecipeImage(finalTitle);
        if (imageUrl) {
          setRecipeImage(imageUrl);
        }
      } catch (imageError) {
        console.error("Error generating recipe image:", imageError);
      }
      
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
