import { generateText, experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { MCPData, MCPToolCall } from "../../../types/mcp";

export async function POST(request: NextRequest) {
  let nutritionClient: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;

  try {
    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Invalid ingredients provided" },
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

    let nutritionData = null;
    let error = null;

    // Initialize MCP data for nutrition analysis
    const mcpData: MCPData = {
      enabled: true,
      toolsAvailable: [],
      toolsUsed: [],
      transport: null,
      error: null,
      systemPrompt: "",
      userPrompt: "",
      model: "gpt-4o-mini",
      toolDetails: {},
    };

    try {
      // Connect to Nutritionix MCP server
      const nutritionTransport = new Experimental_StdioMCPTransport({
        command: "uvx",
        args: [
          "nutritionix-mcp-server",
          "--app-id",
          process.env.NUTRITIONIX_APP_ID || "YOUR_APP_ID",
          "--app-key", 
          process.env.NUTRITIONIX_APP_KEY || "YOUR_APP_KEY"
        ],
      });

      nutritionClient = await experimental_createMCPClient({
        transport: nutritionTransport,
      });

      const nutritionTools = await nutritionClient.tools();

      if (Object.keys(nutritionTools).length === 0) {
        throw new Error("No nutrition tools available");
      }

      // Update MCP data with available tools
      mcpData.toolsAvailable = Object.keys(nutritionTools);
      mcpData.transport = [
        {
          name: "nutritionix", 
          command: "uvx",
          args: [
            "nutritionix-mcp-server",
            "--app-id",
            process.env.NUTRITIONIX_APP_ID || "YOUR_APP_ID",
            "--app-key",
            process.env.NUTRITIONIX_APP_KEY || "YOUR_APP_KEY"
          ],
        }
      ];
      mcpData.toolDetails = nutritionTools;

      const systemPrompt = `You are a nutrition analyst. Use the available nutrition tools to look up nutritional information for the provided ingredients. 

For each significant ingredient (ignore small amounts of spices, salt, etc.), use nutrition_lookup or nutrition_search to get:
- Calories
- Protein (g)
- Carbohydrates (g) 
- Fat (g)
- Fiber (g)
- Sugar (g)
- Sodium (mg)

Then provide a summary of total nutrition for the entire recipe.

Format your response as JSON:
{
  "totalNutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "amount used",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}`;

      const userPrompt = `Please analyze these recipe ingredients and provide nutritional information: ${ingredients.join(", ")}`;

      // Store prompts in MCP data
      mcpData.systemPrompt = systemPrompt;
      mcpData.userPrompt = userPrompt;

      const startTime = Date.now();

      // Use AI to analyze ingredients and get nutrition data
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        tools: nutritionTools,
        maxSteps: 3,
        system: systemPrompt,
        prompt: userPrompt,
        toolChoice: "auto",
      });

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Extract any tool calls that were made
      if (result.steps) {
        let stepStartTime = startTime;
        
        mcpData.toolsUsed = result.steps
          .filter((step) => step.toolCalls && step.toolCalls.length > 0)
          .flatMap((step) => {
            if (!step.toolCalls) return [];
            
            // Estimate timing for each step (distribute total time across steps)
            const stepDuration = result.steps.length > 0 ? totalDuration / result.steps.length : totalDuration;
            const currentStepStart = stepStartTime;
            const currentStepEnd = stepStartTime + stepDuration;
            stepStartTime = currentStepEnd;
            
            return step.toolCalls.map((call, callIndex): MCPToolCall => {
              // Type assertion to work around AI SDK type inference issues
              const toolCall = call as {
                toolCallId?: string;
                toolName?: string;
                args?: Record<string, unknown>;
              };
              
              const toolResults = step.toolResults as Array<{
                toolCallId?: string;
                result?: unknown;
              }> | undefined;
              
              const toolResult = toolResults?.find(
                (r) => r.toolCallId === toolCall.toolCallId
              );
              
              // Estimate individual tool call timing within the step
              const toolCallDuration = step.toolCalls.length > 0 ? stepDuration / step.toolCalls.length : stepDuration;
              const toolCallStart = currentStepStart + (callIndex * toolCallDuration);
              const toolCallEnd = toolCallStart + toolCallDuration;
              
              return {
                toolName: toolCall.toolName || "unknown",
                args: toolCall.args || {},
                result: toolResult?.result || null,
                startTime: Math.round(toolCallStart),
                endTime: Math.round(toolCallEnd),
                duration: Math.round(toolCallDuration),
              };
            });
          });
      }

      // Add usage information to MCP data
      if (result.usage) {
        mcpData.usage = {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        };
      }

      // Add timing information to MCP data
      mcpData.timing = {
        startTime,
        endTime,
        duration: totalDuration,
      };

      // Try to parse the response as JSON
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          nutritionData = JSON.parse(jsonMatch[0]);
        } else {
          nutritionData = { 
            totalNutrition: { 
              calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 
            },
            ingredients: [],
            rawResponse: result.text
          };
        }
      } catch (parseError) {
        nutritionData = { 
          totalNutrition: { 
            calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 
          },
          ingredients: [],
          rawResponse: result.text,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        };
      }

    } catch (nutritionError) {
      console.error("Nutrition analysis failed:", nutritionError);
      error = nutritionError instanceof Error ? nutritionError.message : String(nutritionError);
      mcpData.error = error;
    }

    return NextResponse.json({
      nutritionData,
      mcpData,
      error,
    });

  } catch (error) {
    console.error("Error in nutrition API:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to analyze nutrition" },
      { status: 500 }
    );
  } finally {
    // Clean up MCP client
    if (nutritionClient) {
      try {
        await nutritionClient.close();
      } catch (closeError) {
        console.error("Error closing nutrition client:", closeError);
      }
    }
  }
} 