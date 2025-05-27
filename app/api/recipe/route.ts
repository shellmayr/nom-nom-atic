import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// Helper function to determine season
function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

// Tool definitions (temporarily disabled)
/*
const tools = {
  getCurrentDate: tool({
    description: "Get the current date and time",
    parameters: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        season: getSeason(now.getMonth()),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      };
    },
  }),
  getLocalWeather: tool({
    description: "Get the current weather information for a general location",
    parameters: z.object({
      location: z.string().describe("The location to get weather for (e.g., 'San Francisco, CA')"),
    }),
    execute: async ({ location }) => {
      // Simulated weather data - in a real app, you'd call a weather API
      const weatherConditions = ['sunny', 'cloudy', 'rainy', 'foggy', 'windy'];
      const temps = [55, 62, 68, 71, 58, 64];
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      const randomTemp = temps[Math.floor(Math.random() * temps.length)];
      
      return {
        location,
        condition: randomWeather,
        temperature: `${randomTemp}°F`,
        description: `Currently ${randomWeather} with a temperature of ${randomTemp}°F in ${location}`,
      };
    },
  }),
};
*/

export async function POST(request: NextRequest) {
  return await Sentry.startSpan(
    {
      name: "recipe-generation",
      op: "http.server",
      attributes: {
        "http.method": "POST",
        "http.route": "/api/recipe",
      },
    },
    async () => {
      const model = "gpt-4o-mini";
      
      try {
        const { input } = await request.json();

        if (!input || typeof input !== "string") {
          return NextResponse.json(
            { error: "Invalid input provided" },
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

        const result = await Sentry.startSpan(
          {
            name: "ai.pipeline.generateText",
            op: "ai.pipeline.generateText",
            attributes: {
              "ai.model.id": model,
              "ai.input.type": "text",
              "ai.input.prompt": input,
            },
          },
          async () => {
            return await generateText({
              model: openai(model),
              system: `You are an expert chef and recipe researcher. Your task is to find the top 10 high-quality recipes for a given dish, analyze them, and create one unified "best" recipe that combines their strengths.

Follow this process:
1. Figure out if the recipe actually exists, otherwise tell the user that it doesn't exist
2. Research and identify 10 high-quality recipes for the requested dish
3. Analyze common ingredients and techniques across all recipes
4. Create a unified recipe that includes only ingredients/steps that appear in multiple recipes
5. For ingredients that appear in only 1-2 recipes but add special flavor/technique, list them as optional variations
6. Based on the current season (${getSeason(new Date().getMonth())}) and weather, suggest local/regional additions that make the dish special

Format your response as:
## Unified [Dish Name] Recipe

### Seasonal Context:
[Brief note about current season and how it influences the recipe]

### Ingredients:
[List core ingredients that appear in multiple recipes]

### Instructions:
[Step-by-step instructions using common techniques]

### Variations:
[List special ingredients/techniques from individual recipes as optional additions, explaining what they add]

### Local/Seasonal Additions:
[Based on current season, suggest local/regional ingredients or techniques that would make this dish special for the current time]

### Notes:
[Any important tips or observations from your research]`,
              prompt: `Please find the top 10 high-quality recipes for: ${input}

Then create a unified recipe following the format specified in your system prompt.`,
            });
          }
        );

        console.log("AI Response:", JSON.stringify(result, null, 2));

        // Extract text from the result
        const text = result.text || "";

        return NextResponse.json({ recipe: text });
      } catch (error) {
        console.error("Error generating recipe:", error);
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to generate recipe" },
          { status: 500 }
        );
      }
    }
  );
} 