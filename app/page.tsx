"use client";

import { useState, useEffect } from "react";
import RecipeForm from "../components/RecipeForm";
import RecipeDisplay from "../components/RecipeDisplay";
import MCPDebugPanel from "../components/MCPDebugPanel";
import { RecipeLoadingSkeleton, DebugLoadingSkeleton } from "../components/LoadingSkeleton";
import { generateCombinedRecipe, generateCreativeTitle, generateRecipeImage } from "../services/recipeApi";
import { MCPData, isMCPData, hasMCPTools } from "../types/mcp";

export default function Home() {
  const [recipe, setRecipe] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [mcpData, setMcpData] = useState<MCPData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRecipeSubmit = async (userInput: string) => {
    setIsLoading(true);
    setRecipeTitle(""); // Clear previous title
    setRecipeImage(null); // Clear previous image
    
    // Generate the recipe first
    const result = await generateCombinedRecipe(userInput);
    setRecipe(result.recipe);
    
    // Type guard for MCP data
    if (isMCPData(result.mcpData)) {
      setMcpData(result.mcpData);
    } else {
      setMcpData(null);
    }
    
    // Generate creative title if we have MCP data with location/weather info
    let finalTitle = userInput; // Default fallback
    if (hasMCPTools(result.mcpData) && result.mcpData.toolsUsed.length > 0) {
      const creativeName = await generateCreativeTitle(userInput, result.mcpData);
      finalTitle = creativeName;
    }
    setRecipeTitle(finalTitle);
    
    // Generate recipe image
    const imageUrl = await generateRecipeImage(finalTitle);
    if (imageUrl) {
      setRecipeImage(imageUrl);
    }
    
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
      {(recipe || mcpData) && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Section - Takes 2/3 of the width */}
          {recipe && (
            <RecipeDisplay 
              recipe={recipe}
              recipeTitle={recipeTitle}
              recipeImage={recipeImage}
            />
          )}

          {/* MCP Data Section - Takes 1/3 of the width on the right */}
          {mcpData && (
            <MCPDebugPanel mcpData={mcpData} />
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecipeLoadingSkeleton />
          <DebugLoadingSkeleton />
        </div>
      )}
    </div>
  );
}
