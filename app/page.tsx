"use client";

import { useState, useEffect } from "react";

// Helper function to parse MCP content structure
function parseMCPContent(data: any): string {
  if (!data) return 'No data';
  
  // If it's already a string, return it
  if (typeof data === 'string') return data;
  
  // If it has the MCP content structure
  if (data.content && Array.isArray(data.content)) {
    return data.content
      .map((item: any) => {
        if (item.type === 'text' && item.text) {
          // Try to parse the text as JSON for better formatting
          try {
            const parsed = JSON.parse(item.text);
            return JSON.stringify(parsed, null, 2);
          } catch {
            // If it's not JSON, return as is
            return item.text;
          }
        }
        return JSON.stringify(item, null, 2);
      })
      .join('\n\n');
  }
  
  // Otherwise, return stringified version
  return JSON.stringify(data, null, 2);
}

async function generateCreativeTitle(recipeName: string, mcpData: any) {
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

async function generateCombinedRecipe(userInput: string) {
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

export default function Home() {
  const [input, setInput] = useState("");
  const [recipe, setRecipe] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [mcpData, setMcpData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    setRecipeTitle(""); // Clear previous title
    
    // Generate the recipe first
    const result = await generateCombinedRecipe(input.trim());
    setRecipe(result.recipe);
    setMcpData(result.mcpData);
    
    // Generate creative title if we have MCP data with location/weather info
    if (result.mcpData && result.mcpData.toolsUsed && result.mcpData.toolsUsed.length > 0) {
      const creativeName = await generateCreativeTitle(input.trim(), result.mcpData);
      setRecipeTitle(creativeName);
    } else {
      setRecipeTitle(input.trim()); // Fallback to user input
    }
    
    setIsLoading(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Recipe Combiner</h1>
        <p className="text-gray-600">Enter a dish name and I&apos;ll find the top 10 recipes, then combine them into one optimized version!</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a dish name (e.g., chocolate chip cookies, beef stew, pasta carbonara)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Finding Recipes..." : "Generate Recipe"}
          </button>
        </div>
      </form>

      {(recipe || mcpData) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Section - Takes 2/3 of the width on large screens */}
          {recipe && (
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">
                {recipeTitle || "Generated Recipe"}
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="prose max-w-none">
                  {recipe.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-bold mt-6 mb-4">{line.slice(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index} className="mb-2">{line}</p>;
                    }
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MCP Data Section - Takes 1/3 of the width on large screens */}
          {mcpData && (
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-4">MCP Data</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="space-y-6 text-sm">
                  
                  {/* MCP Status */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Status</h3>
                    <div className="bg-white p-3 rounded border">
                      <p className={`font-medium ${mcpData.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {mcpData.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </p>
                      {mcpData.error && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Error:</p>
                          <div className="text-red-600 text-xs bg-red-50 p-2 rounded border-l-4 border-red-200 whitespace-pre-wrap">
                            {mcpData.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Information */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Model</h3>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-600 font-mono">{mcpData.model}</p>
                    </div>
                  </div>

                  {/* Available Tools */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Available Tools</h3>
                    <div className="bg-white p-3 rounded border">
                      {mcpData.toolsAvailable.length > 0 ? (
                        <ul className="space-y-1">
                          {mcpData.toolsAvailable.map((tool: string, index: number) => (
                            <li key={index} className="flex items-center text-gray-600">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tool}</code>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No tools available</p>
                      )}
                    </div>
                  </div>

                  {/* Tools Used */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Tools Used</h3>
                    {mcpData.toolsUsed.length > 0 ? (
                      <div className="space-y-3">
                        {mcpData.toolsUsed.map((tool: any, index: number) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                              <code className="font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                                {tool.toolName}
                              </code>
                            </div>
                            
                            {tool.args && Object.keys(tool.args).length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">Arguments:</p>
                                <pre className="text-xs text-gray-700 bg-blue-50 p-3 rounded border border-blue-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
{parseMCPContent(tool.args)}</pre>
                              </div>
                            )}
                            
                            {tool.result && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">Result:</p>
                                <pre className="text-xs text-gray-700 bg-green-50 p-3 rounded border border-green-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
{parseMCPContent(tool.result)}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-gray-500 italic">No tools were used</p>
                      </div>
                    )}
                  </div>

                  {/* Transport Information */}
                  {mcpData.transport && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3">Transport</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
{JSON.stringify(mcpData.transport, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {/* Prompts (collapsible) */}
                  <details className="group">
                    <summary className="font-semibold text-gray-700 cursor-pointer hover:text-gray-900 flex items-center">
                      <span className="mr-2 transform transition-transform group-open:rotate-90">▶</span>
                      View Prompts
                    </summary>
                    <div className="mt-3 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">System Prompt</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
{mcpData.systemPrompt}</pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">User Prompt</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
{mcpData.userPrompt}</pre>
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Tool Details (collapsible) */}
                  {mcpData.toolDetails && Object.keys(mcpData.toolDetails).length > 0 && (
                    <details className="group">
                      <summary className="font-semibold text-gray-700 cursor-pointer hover:text-gray-900 flex items-center">
                        <span className="mr-2 transform transition-transform group-open:rotate-90">▶</span>
                        Tool Details
                      </summary>
                      <div className="mt-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
{JSON.stringify(mcpData.toolDetails, null, 2)}</pre>
                        </div>
                      </div>
                    </details>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Researching and combining the best recipes...</p>
        </div>
      )}
    </div>
  );
}
