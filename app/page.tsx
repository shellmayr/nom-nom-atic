"use client";

import { useState, useEffect } from "react";

// Helper function to convert markdown to JSX
function parseMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let currentList: React.JSX.Element[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (currentList.length > 0 && listType) {
      const ListComponent = listType === 'ul' ? 'ul' : 'ol';
      elements.push(
        <ListComponent key={elements.length} className="space-y-1 ml-4">
          {currentList}
        </ListComponent>
      );
      currentList = [];
      listType = null;
    }
  };

  const parseBold = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    // Check for unordered list items
    if (trimmedLine.match(/^[-*+]\s/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      const content = trimmedLine.replace(/^[-*+]\s/, '');
      currentList.push(
        <li key={currentList.length} className="text-sm text-gray-700 font-light leading-relaxed">
          {parseBold(content)}
        </li>
      );
    }
    // Check for ordered list items
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      currentList.push(
        <li key={currentList.length} className="text-sm text-gray-700 font-light leading-relaxed">
          {parseBold(content)}
        </li>
      );
    }
    // Regular paragraph
    else if (trimmedLine) {
      flushList();
      elements.push(
        <p key={elements.length} className="text-sm text-gray-700 font-light leading-relaxed">
          {parseBold(trimmedLine)}
        </p>
      );
    }
    // Empty line
    else if (elements.length > 0) {
      flushList();
      elements.push(<br key={elements.length} />);
    }
  });

  flushList(); // Flush any remaining list
  return elements;
}

// Helper function to parse recipe content and extract ingredients
function parseRecipeContent(recipe: string) {
  const lines = recipe.split('\n');
  let ingredients: string[] = [];
  let instructions: string[] = [];
  let variations: string[] = [];
  let seasonalAdditions: string[] = [];
  let notes: string[] = [];
  let currentSection = '';
  let title = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('## ')) {
      title = line.slice(3);
      currentSection = 'title';
    } else if (line.startsWith('### ')) {
      const sectionName = line.slice(4).toLowerCase();
      if (sectionName.includes('ingredient')) {
        currentSection = 'ingredients';
      } else if (sectionName.includes('instruction')) {
        currentSection = 'instructions';
      } else if (sectionName.includes('variation')) {
        currentSection = 'variations';
      } else if (sectionName.includes('seasonal') || sectionName.includes('local')) {
        currentSection = 'seasonal';
      } else if (sectionName.includes('note')) {
        currentSection = 'notes';
      } else {
        currentSection = 'other';
      }
    } else if (line && !line.startsWith('#')) {
      switch (currentSection) {
        case 'ingredients':
          if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+/)) {
            ingredients.push(line);
          } else {
            ingredients.push(`• ${line}`);
          }
          break;
        case 'instructions':
          if (line.match(/^\d+\.?\s/)) {
            instructions.push(line);
          } else if (line) {
            instructions.push(line);
          }
          break;
        case 'variations':
          variations.push(line);
          break;
        case 'seasonal':
          seasonalAdditions.push(line);
          break;
        case 'notes':
          notes.push(line);
          break;
      }
    }
  }

  return {
    title,
    ingredients,
    instructions,
    variations,
    seasonalAdditions,
    notes
  };
}

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

async function generateRecipeImage(recipeTitle: string, recipeContent?: string) {
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
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
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
    setRecipeImage(null); // Clear previous image
    
    // Generate the recipe first
    const result = await generateCombinedRecipe(input.trim());
    setRecipe(result.recipe);
    setMcpData(result.mcpData);
    
    // Generate creative title if we have MCP data with location/weather info
    let finalTitle = input.trim(); // Default fallback
    if (result.mcpData && result.mcpData.toolsUsed && result.mcpData.toolsUsed.length > 0) {
      const creativeName = await generateCreativeTitle(input.trim(), result.mcpData);
      finalTitle = creativeName;
    }
    setRecipeTitle(finalTitle);
    
    // Generate recipe image
    const imageUrl = await generateRecipeImage(finalTitle);
    if (imageUrl) {
      setRecipeImage(imageUrl);
    }
    
    setIsLoading(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&display=swap"
        rel="stylesheet"
      />
      
      {/* CSS for shine animation */}
      <style jsx>{`
        .shine-text {
          background: linear-gradient(
            45deg,
            #374151 0%,
            #374151 40%,
            #d1d5db 50%,
            #374151 60%,
            #374151 100%
          );
          background-size: 200% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 4s ease-in-out infinite;
        }
        
        @keyframes shine {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      
      <div className="min-h-screen p-8 max-w-7xl mx-auto">
        {/* Top Bar with Title and Input */}
        <div className="flex items-center gap-8 mb-8">
          <h1 className="text-4xl font-bold tracking-tight whitespace-nowrap text-gray-700" style={{ fontFamily: 'Fredoka One, cursive' }}>
            Recipe Combiner
          </h1>
          
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a dish name (e.g., chocolate chip cookies, beef stew, pasta carbonara)"
                className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent text-sm font-light bg-white/80 backdrop-blur-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm tracking-wide transition-all duration-200 whitespace-nowrap"
              >
                {isLoading ? "Finding..." : "Generate"}
              </button>
            </div>
          </form>
        </div>

        {(recipe || mcpData) && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipe Section - Takes 2/3 of the width */}
            {recipe && (
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
                  {/* Recipe Title */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-8 py-8">
                    <h1 className="text-2xl font-semibold text-center tracking-wide leading-tight text-gray-900">
                      {(recipeTitle || "Generated Recipe").replace(/^["']|["']$/g, '')}
                    </h1>
                  </div>

                  {(() => {
                    const parsedRecipe = parseRecipeContent(recipe);
                    return (
                      <>
                        {/* Main Recipe Content - Side by Side Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[400px]">
                          {/* Ingredients Panel - Left Side */}
                          <div className="lg:col-span-2 bg-gradient-to-b from-gray-50/50 to-gray-50/30 border-r border-gray-100/80 px-8 py-6">
                            <div className="sticky top-6">
                              {/* Recipe Image */}
                              {recipeImage && (
                                <div className="mb-8">
                                  <img 
                                    src={recipeImage} 
                                    alt={recipeTitle || "Generated Recipe"} 
                                    className="w-full aspect-square object-cover rounded-xl shadow-sm border border-gray-200/50"
                                  />
                                </div>
                              )}
                              
                              <h2 className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-[0.2em] letter-spacing-wider">
                                Ingredients
                              </h2>
                              
                              {parsedRecipe.ingredients.length > 0 ? (
                                <div className="space-y-3">
                                  {parsedRecipe.ingredients.map((ingredient, index) => (
                                    <div key={index} className="flex items-start space-x-4 text-sm leading-relaxed">
                                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2.5 flex-shrink-0"></div>
                                      <span className="text-gray-700 font-light">
                                        {parseMarkdown(ingredient.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, ''))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-sm font-light italic">No ingredients listed</p>
                              )}
                            </div>
                          </div>

                          {/* Instructions Panel - Right Side */}
                          <div className="lg:col-span-3 px-8 py-6">
                            {parsedRecipe.instructions.length > 0 ? (
                              <div className="space-y-6">
                                {parsedRecipe.instructions.map((instruction, index) => (
                                  <div key={index} className="flex space-x-5">
                                    <div className="flex-shrink-0">
                                      <span className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-800 leading-relaxed font-light">
                                        {parseMarkdown(instruction.replace(/^\d+\.\s*/, ''))}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm font-light italic">No instructions listed</p>
                            )}

                            {/* Notes Section */}
                            {parsedRecipe.notes.length > 0 && (
                              <div className="mt-8 p-5 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                                <h3 className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-[0.15em]">
                                  Chef&apos;s Notes
                                </h3>
                                <div className="space-y-2">
                                  {parsedRecipe.notes.map((note, index) => (
                                    <p key={index} className="text-sm text-amber-700/90 font-light leading-relaxed">
                                      {parseMarkdown(note)}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Variations Section - Bottom */}
                        {(parsedRecipe.variations.length > 0 || parsedRecipe.seasonalAdditions.length > 0) && (
                          <div className="border-t border-gray-100/80 bg-gradient-to-r from-slate-50/30 to-gray-50/30 px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Variations */}
                              {parsedRecipe.variations.length > 0 && (
                                <div>
                                  <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-[0.15em]">
                                    Variations
                                  </h3>
                                  <div className="space-y-3">
                                    {parsedRecipe.variations.map((variation, index) => (
                                      <div key={index} className="flex items-start space-x-3">
                                        <div className="w-1 h-1 bg-purple-400 rounded-full mt-2.5 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-700 font-light leading-relaxed">
                                          {parseMarkdown(variation)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Seasonal Additions */}
                              {parsedRecipe.seasonalAdditions.length > 0 && (
                                <div>
                                  <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-[0.15em]">
                                    Seasonal
                                  </h3>
                                  <div className="space-y-3">
                                    {parsedRecipe.seasonalAdditions.map((addition, index) => (
                                      <div key={index} className="flex items-start space-x-3">
                                        <div className="w-1 h-1 bg-orange-400 rounded-full mt-2.5 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-700 font-light leading-relaxed">
                                          {parseMarkdown(addition)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MCP Data Section - Takes 1/3 of the width on the right */}
            {mcpData && (
              <div className="lg:col-span-1">
                <div className="bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl shadow-sm overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-r from-gray-100/50 to-slate-100/50 border-b border-gray-100/60 px-6 py-4">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Debug Info</h2>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 text-xs">
                      
                      {/* Compact Status */}
                      <div>
                        <span className="text-gray-400 uppercase tracking-[0.1em] font-medium text-[10px]">Status</span>
                        <p className={`mt-2 text-xs font-semibold ${mcpData.enabled ? 'text-green-600' : 'text-red-500'}`}>
                          {mcpData.enabled ? 'Active' : 'Inactive'}
                        </p>
                      </div>

                      {/* Compact Model */}
                      <div>
                        <span className="text-gray-400 uppercase tracking-[0.1em] font-medium text-[10px]">Model</span>
                        <p className="mt-2 text-xs text-gray-700 font-mono font-medium">{mcpData.model}</p>
                      </div>

                      {/* Compact Tools Available */}
                      <div>
                        <span className="text-gray-400 uppercase tracking-[0.1em] font-medium text-[10px]">Available</span>
                        <p className="mt-2 text-xs text-gray-700 font-medium">{mcpData.toolsAvailable.length} tools</p>
                      </div>

                      {/* Compact Tools Used */}
                      <div>
                        <span className="text-gray-400 uppercase tracking-[0.1em] font-medium text-[10px]">Executed</span>
                        <p className="mt-2 text-xs text-gray-700 font-medium">{mcpData.toolsUsed.length} calls</p>
                      </div>

                    </div>

                    {/* Collapsible detailed info */}
                    <details className="mt-6 group">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none font-medium tracking-wide">
                        <span className="inline-block transform transition-transform group-open:rotate-90 mr-2"></span>
                        Detailed Results
                      </summary>
                      <div className="mt-4 space-y-4 text-xs">
                        
                        {/* Tools Used Details */}
                        {mcpData.toolsUsed.length > 0 && (
                          <div>
                            <h4 className="text-gray-500 mb-3 uppercase tracking-[0.1em] font-bold text-[10px]">Tool Execution Log</h4>
                            <div className="space-y-3">
                              {mcpData.toolsUsed.map((tool: any, index: number) => (
                                <div key={index} className="bg-gray-50/50 border border-gray-100 rounded-lg p-4">
                                  <div className="flex items-center mb-3">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                                    <code className="text-xs text-gray-700 bg-gray-100/70 px-3 py-1 rounded-md font-mono font-medium">
                                      {tool.toolName}
                                    </code>
                                  </div>
                                  
                                  {tool.result && (
                                    <pre className="text-[11px] text-gray-600 bg-white/70 p-3 rounded-md border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
{parseMCPContent(tool.result)}</pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </details>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipe Skeleton - Takes 2/3 of the width */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
                {/* Title Skeleton */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-8 py-8">
                  <div className="h-8 bg-gray-200 rounded-lg animate-pulse mx-auto max-w-md"></div>
                </div>

                {/* Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[400px]">
                  {/* Ingredients Skeleton */}
                  <div className="lg:col-span-2 bg-gradient-to-b from-gray-50/50 to-gray-50/30 border-r border-gray-100/80 px-8 py-6">
                    {/* Image Skeleton */}
                    <div className="mb-8">
                      <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                    
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-20"></div>
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-start space-x-4">
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2.5 animate-pulse"></div>
                          <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions Skeleton */}
                  <div className="lg:col-span-3 px-8 py-6">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-16"></div>
                    <div className="space-y-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex space-x-5">
                          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`}></div>
                            <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Info Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl shadow-sm overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-gray-100/50 to-slate-100/50 border-b border-gray-100/60 px-6 py-4">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i}>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-12 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
