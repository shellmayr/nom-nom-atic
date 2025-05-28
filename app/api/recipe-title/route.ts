import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let baseRecipe = "Recipe"; // Default fallback
  
  try {
    const { recipeName } = await request.json();

    // Use the recipe name to generate a creative title
    baseRecipe = recipeName || "Recipe";

    // Generate a creative title based on the recipe name
    const prompt = `Generate a creative, appetizing recipe title based on this recipe request: "${baseRecipe}"

Guidelines:
- Keep it under 8 words
- Make it sound delicious and appealing
- Make it specific and memorable
- Focus on the cooking style, ingredients, or preparation method
- Transform the basic request into an enticing title

Return ONLY the title, nothing else.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 50,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "recipe-title-generation",
        recordInputs: true,
        recordOutputs: true,
        metadata: {
          recipeName: baseRecipe,
          operation: "title-generation",
          version: "1.0",
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          maxTokens: 50,
        },
      },
    });

    return NextResponse.json({ 
      title: result.text.trim() || baseRecipe
    });

  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json({ title: baseRecipe || "Delicious Recipe" });
  }
} 