import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { recipeName, mcpData } = await request.json();

    if (!recipeName || !mcpData) {
      return NextResponse.json(
        { error: "Recipe name and MCP data are required" },
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

    // Extract location and weather info from MCP tool results
    let locationInfo = "";
    let weatherInfo = "";
    
    if (mcpData.toolsUsed && mcpData.toolsUsed.length > 0) {
      mcpData.toolsUsed.forEach((tool: any) => {
        if (tool.result && tool.result.content && Array.isArray(tool.result.content)) {
          tool.result.content.forEach((item: any) => {
            if (item.type === 'text' && item.text) {
              try {
                const parsed = JSON.parse(item.text);
                if (parsed.location) {
                  locationInfo = parsed.location;
                }
                if (parsed.season) {
                  weatherInfo += `Season: ${parsed.season}. `;
                }
                if (parsed.temperature) {
                  weatherInfo += `Temperature: ${parsed.temperature}. `;
                }
                if (parsed.condition) {
                  weatherInfo += `Weather: ${parsed.condition}. `;
                }
                if (parsed.description) {
                  weatherInfo += parsed.description;
                }
              } catch {
                // If not JSON, treat as plain text
                if (item.text.toLowerCase().includes('weather') || 
                    item.text.toLowerCase().includes('temperature') ||
                    item.text.toLowerCase().includes('season')) {
                  weatherInfo += item.text + " ";
                }
              }
            }
          });
        }
      });
    }

    const prompt = `Create a creative, catchy, and localized name for a "${recipeName}" recipe.

${locationInfo ? `Location: ${locationInfo}` : ''}
${weatherInfo ? `Weather/Season Info: ${weatherInfo}` : ''}

Requirements:
- The name should be creative and memorable
- Incorporate local/regional elements if location is provided
- Consider the weather/season information
- Keep it concise (2-8 words)
- Make it sound appetizing and unique
- You can use local landmarks, weather references, or seasonal elements

Examples of good creative names:
- "Golden Gate Fog-Kissed Chocolate Cookies"
- "Autumn Harvest San Francisco Stew"
- "Rainy Day Mission District Pasta"

Generate ONLY the recipe title, nothing else.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      maxTokens: 50,
    });

    const title = result.text?.trim() || recipeName;

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating recipe title:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe title" },
      { status: 500 }
    );
  }
} 