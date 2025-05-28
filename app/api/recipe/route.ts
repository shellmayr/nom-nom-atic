import { generateText, experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { MCPData, MCPToolCall } from "../../../types/mcp";

export async function POST(request: NextRequest) {
  const model = "gpt-4o-mini";
  let nutritionClient: Awaited<
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

    // Try to create MCP clients for nutrition tools
    let allTools = {};
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

    const enableMCP = true; // Set to true to enable MCP

    if (enableMCP) {
      try {
        // Connect to Nutritionix MCP server
        const nutritionTransport = new Experimental_StdioMCPTransport({
          command: "uvx",
          args: [
            "nutritionix-mcp-server",
            "--app-id",
            process.env.NUTRITIONIX_APP_ID || "YOUR_APP_ID",
            "--app-key",
            process.env.NUTRITIONIX_APP_KEY || "YOUR_APP_KEY",
          ],
        });

        nutritionClient = await experimental_createMCPClient({
          transport: nutritionTransport,
        });

        const nutritionTools = await nutritionClient.tools();
        allTools = { ...allTools, ...nutritionTools };
        
        mcpToolsLoaded = Object.keys(allTools).length > 0;
        mcpData.toolsAvailable = Object.keys(allTools);
        mcpData.transport = [
          {
            name: "nutritionix",
            command: "uvx",
            args: [
              "nutritionix-mcp-server",
              "--app-id",
              process.env.NUTRITIONIX_APP_ID || "YOUR_APP_ID",
              "--app-key",
              process.env.NUTRITIONIX_APP_KEY || "YOUR_APP_KEY",
            ],
          },
        ];
        mcpData.toolDetails = allTools;
        console.log("Nutrition MCP tools loaded:", Object.keys(allTools));
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
      Object.keys(allTools)
    );

    const systemPrompt = `You have access to nutrition tools that can look up detailed nutritional information for ingredients. Create a detailed, delicious recipe AND provide comprehensive nutrition information.

Create a detailed recipe that includes:
1. A brief, enticing description (2-3 sentences)
2. Prep time, cook time, and total time
3. Serving size
4. Complete ingredient list with measurements
5. Step-by-step instructions that are clear and easy to follow (DO NOT number the steps - just provide the instruction text)
6. Any helpful cooking tips
7. Use the nutrition tools to analyze the main ingredients and provide detailed nutrition information
8. If there are no tools available, or tools have errors via the MCP protocol, do not use the tools and provide a generic recipe. Omit the nutrition information if there are no tools that can provide this data reliably.
9. Once there was a failed tool call, do not keep calling the tools.

Structure your response as:
## Recipe Title
[Brief description]
**Prep Time:** [time]
**Cook Time:** [time] 
**Total Time:** [time]
**Serves:** [number]

### Ingredients
[ingredient list]

### Instructions
[step by step instructions]

### Nutrition Information
Use the nutrition tools to look up the main ingredients and provide:
- Total calories per serving
- Protein, carbs, fat, fiber, sugar, sodium per serving
- Brief nutritional highlights

### Chef's Tips
[helpful tips]

Format your response clearly and make it engaging!`;

    const userPrompt = `Create a delicious recipe for: ${input}

${
      mcpToolsLoaded && Object.keys(allTools).length > 0
        ? "Use any available nutrition tools to enhance the recipe with detailed nutritional information. After using tools, you MUST provide the final recipe in the specified format."
        : ""
    }

IMPORTANT: Generate a complete recipe in the specified markdown format. Focus on creating one excellent recipe rather than multiple options.`;

    // Store the prompts and tools in MCP data
    mcpData.systemPrompt = systemPrompt;
    mcpData.userPrompt = userPrompt;
    mcpData.model = model;

    const startTime = Date.now();
    
    const result = await generateText({
      model: openai(model),
      ...(mcpToolsLoaded && Object.keys(allTools).length > 0
        ? { tools: allTools }
        : {}), // Only include tools if they exist
      maxSteps: 8, // Reduced to encourage final text generation
      system: systemPrompt,
      prompt: userPrompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "recipe-generation",
        recordInputs: true,
        recordOutputs: true,
        metadata: {
          userInput: input,
          mcpToolsAvailable: Object.keys(allTools),
          mcpEnabled: mcpToolsLoaded,
          model: model,
          maxSteps: 8,
          timestamp: new Date().toISOString(),
          operation: "recipe-generation",
          version: "1.0",
        },
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
              error?: string;
              isError?: boolean;
            }> | undefined;
            
            const toolResult = toolResults?.find(
              (r) => r.toolCallId === toolCall.toolCallId
            );
            
            // Debug logging for tool results
            console.log(`Tool call: ${toolCall.toolName}`, {
              toolCallId: toolCall.toolCallId,
              hasResult: !!toolResult,
              resultType: typeof toolResult?.result,
              directError: toolResult?.error,
              resultContent: toolResult?.result
            });
            
            // Enhanced error detection logic
            let hasError = false;
            let errorMessage: string | null = null;
            
            // Check for direct error field
            if (toolResult?.error) {
              hasError = true;
              errorMessage = toolResult.error;
            }
            // Check for isError flag
            else if (toolResult?.isError) {
              hasError = true;
              errorMessage = errorMessage || "Tool call failed";
            }
            // Check if result is an error object
            else if (toolResult?.result && typeof toolResult.result === 'object' && toolResult.result !== null) {
              if ('error' in toolResult.result) {
                hasError = true;
                errorMessage = String((toolResult.result as { error: unknown }).error);
              }
              // Check for common error object patterns
              else if ('isError' in toolResult.result && (toolResult.result as { isError: boolean }).isError) {
                hasError = true;
                errorMessage = 'message' in toolResult.result ? 
                  String((toolResult.result as { message: unknown }).message) : "Tool execution failed";
              }
            }
            // Check if result is a string that indicates an error
            else if (typeof toolResult?.result === 'string') {
              const resultStr = toolResult.result.toLowerCase();
              if (resultStr.includes('error') || 
                  resultStr.includes('failed') || 
                  resultStr.includes('exception') ||
                  resultStr.includes('timeout') ||
                  resultStr.includes('invalid') ||
                  resultStr.startsWith('❌')) {
                hasError = true;
                errorMessage = toolResult.result;
              }
            }
            // Check if no tool result was returned (could indicate failure)
            else if (!toolResult) {
              hasError = true;
              errorMessage = "No tool result returned";
            }
            
            // Debug log the final error detection result
            console.log(`Error detection for ${toolCall.toolName}:`, {
              hasError,
              errorMessage,
              originalResult: toolResult?.result
            });
            
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
              error: errorMessage,
              isError: hasError,
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
    // Clean up nutrition MCP client
    if (nutritionClient && 'close' in nutritionClient) {
      try {
        await (nutritionClient as { close: () => Promise<void> }).close();
      } catch (closeError) {
        console.error("Error closing nutrition MCP client:", closeError);
      }
    }
  }
}
