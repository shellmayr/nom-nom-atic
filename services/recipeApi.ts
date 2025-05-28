export interface RecipeResult {
  recipe: string;
  mcpData: unknown;
}

export interface NutritionData {
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  ingredients: Array<{
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  rawResponse?: string;
  parseError?: string;
}

export async function generateCombinedRecipe(userInput: string): Promise<RecipeResult> {
  try {
    const response = await fetch("/api/recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: userInput }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        recipe: `❌ Error: ${errorData.error || "Failed to generate recipe"}`,
        mcpData: null 
      };
    }

    const data = await response.json();
    return {
      recipe: data.recipe,
      mcpData: data.mcpData
    };
  } catch (error) {
    console.error("Error generating recipe:", error);
    return { 
      recipe: "❌ Error generating recipe. Please try again.",
      mcpData: null 
    };
  }
}

export async function generateCreativeTitle(recipeName: string, mcpData: unknown): Promise<string> {
  try {
    const response = await fetch("/api/recipe-title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipeName, mcpData }),
    });

    if (!response.ok) {
      console.error("Failed to generate creative title");
      return recipeName; // Fallback to original name
    }

    const data = await response.json();
    return data.title || recipeName;
  } catch (error) {
    console.error("Error generating creative title:", error);
    return recipeName; // Fallback to original name
  }
}

export async function generateRecipeImage(recipeTitle: string, recipeContent?: string): Promise<string | null> {
  try {
    const response = await fetch("/api/recipe-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipeTitle, recipeContent }),
    });

    if (!response.ok) {
      console.error("Failed to generate recipe image");
      return null;
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating recipe image:", error);
    return null;
  }
} 