import { generateText, experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { MCPData, MCPToolCall } from "../../../types/mcp";

export async function POST(request: NextRequest) {
  const model = "gpt-4o-mini";
  let mcpClient: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;

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

    // Try to create MCP client for additional tools (optional)
    let mcpTools = {};
    let mcpToolsLoaded = false;
    const mcpData: MCPData = {
      enabled: true,
      toolsAvailable: [],
      toolsUsed: [],
      transport: null,
      error: null,
      systemPrompt: "",
      userPrompt: "",
      model: "",
      toolDetails: {},
    };

    // Temporarily disable MCP to debug empty response issue
    const enableMCP = true; // Set to true to enable MCP

    if (enableMCP) {
      try {
        // Connect to our custom weather MCP server
        const weatherTransport = new Experimental_StdioMCPTransport({
          command: "node",
          args: ["mcp-servers/weather-server.js"],
        });

        const weatherClient = await experimental_createMCPClient({
          transport: weatherTransport,
        });

        const weatherTools = await weatherClient.tools();

        // Connect to Nutritionix MCP server
        let nutritionTools = {};
        let nutritionClient = null;
        try {
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

          nutritionTools = await nutritionClient.tools();
          console.log("Nutritionix tools loaded:", Object.keys(nutritionTools));
        } catch (nutritionError) {
          console.log("Nutritionix MCP not available:", nutritionError);
        }

        // Combine tools from both servers
        mcpTools = { ...weatherTools, ...nutritionTools };
        mcpClient = weatherClient; // Store primary client for cleanup
        
        mcpToolsLoaded = true;
        mcpData.toolsAvailable = Object.keys(mcpTools);
        mcpData.transport = [
          {
            name: "weather",
            command: "node",
            args: ["mcp-servers/weather-server.js"],
          },
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
        mcpData.toolDetails = mcpTools;
        console.log("All MCP tools loaded:", Object.keys(mcpTools));
        console.log("MCP tools details:", JSON.stringify(mcpTools, null, 2));
      } catch (mcpError) {
        console.log(
          "MCP not available, continuing without MCP tools:",
          mcpError
        );
        mcpData.error =
          mcpError instanceof Error ? mcpError.message : String(mcpError);
        mcpData.toolsAvailable = [];
        // Continue without MCP tools
      }
    } else {
      console.log("MCP disabled for debugging");
      mcpData.enabled = false;
    }

    console.log(
      "About to call generateText with tools:",
      Object.keys(mcpTools)
    );

    const systemPrompt = `You are an expert chef and recipe researcher. Your task is to find the top 10 high-quality recipes for a given dish, analyze them, and create one unified "best" recipe that combines their strengths.

${
  mcpToolsLoaded && Object.keys(mcpTools).length > 0
    ? "You have access to MCP tools for additional functionality, including weather information and nutrition data. Use them if they can help with recipe research or enhancement. For nutrition tools, you can look up nutritional information for ingredients to provide healthier alternatives or portion guidance. Make sure to only call each tool once with the same parameters to not waste time."
    : ""
}

Follow this process:
1. Figure out if the recipe actually exists, otherwise tell the user that it doesn't exist
2. Research and identify 10 high-quality recipes for the requested dish
3. Analyze common ingredients and techniques across all recipes
4. Use nutrition tools if available to provide nutritional insights about key ingredients
5. Create a unified recipe that includes only ingredients/steps that appear in multiple recipes
6. For ingredients that appear in only 1-2 recipes but add special flavor/technique, list them as optional variations
7. Based on the current season, which you can get from the get_weather call, choose local/regional additions that make the dish special
      It is of the utmost importance that you stick to the information provided by the tools. Do not make up information. 
8. Make sure that all ingredients use metric units, like grams, liters, kilograms, etc., and only use weight units unless it is a liquid. 

Format your response as:
## Unified [Dish Name] Recipe

### Seasonal Context:
[Brief note about current season and how it influences the recipe]

### Nutritional Highlights:
[If nutrition data is available, briefly mention key nutritional benefits of main ingredients]

### Ingredients:
[List core ingredients that appear in multiple recipes]

### Instructions:
[Step-by-step instructions using common techniques]

### Variations:
[List special ingredients/techniques from individual recipes as optional additions, explaining what they add]

### Local/Seasonal Additions:
[Based on current season, suggest local/regional ingredients or techniques that would make this dish special for the current time]

### Notes:
[Any important tips or observations from your research, including nutritional tips if available]`;

    const userPrompt = `Please find the top 10 high-quality recipes for: ${input}

Then create a unified recipe following the format specified in your system prompt.${
      mcpToolsLoaded && Object.keys(mcpTools).length > 0
        ? " Use any available MCP tools that might enhance your research or provide additional context. After using tools, you MUST provide the final unified recipe in the specified format."
        : ""
    }

IMPORTANT: After gathering information with tools, you must generate the complete recipe output in the specified markdown format. Do not end with tool calls - always provide the final recipe text.`;

    // Store the prompts and tools in MCP data
    mcpData.systemPrompt = systemPrompt;
    mcpData.userPrompt = userPrompt;
    mcpData.model = model;

    const startTime = Date.now();
    
    const result = await generateText({
      model: openai(model),
      ...(mcpToolsLoaded && Object.keys(mcpTools).length > 0
        ? { tools: mcpTools }
        : {}), // Only include tools if they exist
      maxSteps: 8, // Reduced to encourage final text generation
      system: systemPrompt,
      prompt: userPrompt,
      experimental_telemetry: {
        functionId: "recipe-generation",
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
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

    console.log("AI Response received");

    // Extract text from the result
    const text = result.text || "❌ Recipe generation completed but no text was returned. Please try again.";

    return NextResponse.json({
      recipe: text,
      mcpData: mcpData,
    });
  } catch (error) {
    console.error("Error generating recipe:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  } finally {
    // Clean up MCP client
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }
  }
}
