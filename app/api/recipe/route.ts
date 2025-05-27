import { generateText, experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";



export async function POST(request: NextRequest) {
  return await Sentry.startSpan({ name: "recipe-generation" }, async () => {
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
      const mcpData = {
        enabled: true,
        toolsAvailable: [] as string[],
        toolsUsed: [] as Array<{
          toolName: string;
          args: any;
          result: any;
        }>,
        transport: null as any,
        error: null as string | null,
        systemPrompt: "",
        userPrompt: "",
        model: "",
        toolDetails: {} as any,
      };

      // Temporarily disable MCP to debug empty response issue
      const enableMCP = true; // Set to true to enable MCP

      if (enableMCP) {
        try {
          // Connect to our custom weather MCP server
          const transport = new Experimental_StdioMCPTransport({
            command: "node",
            args: ["mcp-servers/weather-server.js"],
          });

          mcpClient = await experimental_createMCPClient({
            transport,
          });

          mcpTools = await mcpClient.tools();
          mcpToolsLoaded = true;
          mcpData.toolsAvailable = Object.keys(mcpTools);
          mcpData.transport = {
            command: "node",
            args: ["mcp-servers/weather-server.js"],
          };
          mcpData.toolDetails = mcpTools;
          console.log("MCP tools loaded:", Object.keys(mcpTools));
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
    ? "You have access to MCP tools for additional functionality. Use them if they can help with recipe research or enhancement."
    : ""
}

Follow this process:
1. Figure out if the recipe actually exists, otherwise tell the user that it doesn't exist
2. Research and identify 10 high-quality recipes for the requested dish
3. Analyze common ingredients and techniques across all recipes
4. Create a unified recipe that includes only ingredients/steps that appear in multiple recipes
5. For ingredients that appear in only 1-2 recipes but add special flavor/technique, list them as optional variations
6. Based on the current season, which you can get from the get_weather call, choose local/regional additions that make the dish special
      It is of the utmost importance that you stick to the information provided by the tools. Do not make up information. 

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
[Any important tips or observations from your research]`;

      const userPrompt = `Please find the top 10 high-quality recipes for: ${input}

Then create a unified recipe following the format specified in your system prompt.${
        mcpToolsLoaded && Object.keys(mcpTools).length > 0
          ? " Use any available MCP tools that might enhance your research or provide additional context."
          : ""
      }`;

      // Store the prompts and tools in MCP data
      mcpData.systemPrompt = systemPrompt;
      mcpData.userPrompt = userPrompt;
      mcpData.model = model;

      const result = await generateText({
        model: openai(model),
        ...(mcpToolsLoaded && Object.keys(mcpTools).length > 0
          ? { tools: mcpTools }
          : {}), // Only include tools if they exist
        maxSteps: 5, // Allow multiple tool calls and then final generation
        system: systemPrompt,
        prompt: userPrompt,
        ...(mcpToolsLoaded && Object.keys(mcpTools).length > 0
          ? { toolChoice: "auto" }
          : {}),
        experimental_telemetry: {
          functionId: "recipe-generation",
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      });

      // Extract any tool calls that were made
      if (result.steps) {
        mcpData.toolsUsed = result.steps
          .filter((step) => step.toolCalls && step.toolCalls.length > 0)
          .flatMap(
            (step) =>
              step.toolCalls?.map((call) => ({
                toolName: call.toolName || "unknown",
                args: call.args || {},
                result:
                  step.toolResults?.find(
                    (r) => r.toolCallId === call.toolCallId
                  )?.result || null,
              })) || []
          );
      }

      console.log("AI Response received");
      console.log("Response text length:", result.text?.length || 0);
      console.log("Response object keys:", Object.keys(result));
      console.log("Full AI Response:", JSON.stringify(result, null, 2));

      // Extract text from the result
      const text = result.text || "";

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
  });
}
