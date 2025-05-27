import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const { recipeTitle, recipeContent } = await request.json();

    if (!recipeTitle || typeof recipeTitle !== "string") {
      return NextResponse.json(
        { error: "Recipe title is required" },
        { status: 400 }
      );
    }

    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Create a detailed prompt for DALL-E based on the recipe
    const basePrompt = `A beautifully styled food photography shot of ${recipeTitle} captured with a Leica Summicron 50mm f/2 lens. Professional food styling with perfect lighting, shallow depth of field, and artistic composition. The dish should be the hero of the image with beautiful bokeh in the background. Clean, modern presentation on elegant dishware. Soft natural lighting that highlights textures and colors. Shot from a flattering angle that showcases the dish's most appetizing features. High-end restaurant quality plating and presentation.`;
    
    // Add recipe context if available
    const recipeContext = recipeContent ? `\n\nRecipe details for accurate representation: ${recipeContent.slice(0, 1000)}` : '';
    const imagePrompt = basePrompt + recipeContext;

    console.log("Generating image with prompt:", imagePrompt);

    const result = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: imagePrompt,
      size: "1024x1024",
      providerOptions: {
        openai: { 
          quality: "standard",
          style: "natural"
        },
      },
    });

    console.log("Image generation result:", result);

    // Extract the image URL from the result
    const imageUrl = result.image?.base64;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image - no URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageUrl}`,
      prompt: imagePrompt,
    });
  } catch (error) {
    console.error("Error generating recipe image:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to generate recipe image" },
      { status: 500 }
    );
  }
} 