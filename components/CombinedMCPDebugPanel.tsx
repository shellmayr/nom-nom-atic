import { isMCPData } from "../types/mcp";
import { parseMCPContent } from "../utils/recipeParser";

interface CombinedMCPDebugPanelProps {
  recipeMcpData: unknown;
  nutritionMcpData: unknown;
}

export default function CombinedMCPDebugPanel({ 
  recipeMcpData, 
  nutritionMcpData 
}: CombinedMCPDebugPanelProps) {
  const recipeData = isMCPData(recipeMcpData) ? recipeMcpData : null;
  const nutritionData = isMCPData(nutritionMcpData) ? nutritionMcpData : null;

  // Count total tools used across all sources
  const totalToolsUsed = (recipeData?.toolsUsed?.length || 0) + (nutritionData?.toolsUsed?.length || 0);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden h-fit">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">MCP Debug Panel</h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalToolsUsed} tool{totalToolsUsed !== 1 ? 's' : ''} called across {[recipeData, nutritionData].filter(Boolean).length} service{[recipeData, nutritionData].filter(Boolean).length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        
        {/* Recipe MCP Data */}
        {recipeData && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-800">Recipe Generation</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {recipeData.toolsUsed?.length || 0} calls
              </span>
            </div>
            
            <div className="space-y-3 ml-5">
              {/* Available Tools */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-[0.15em]">
                  Available Tools
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recipeData.toolsAvailable?.map((tool, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tool Calls */}
              {recipeData.toolsUsed && recipeData.toolsUsed.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-[0.15em]">
                    Tool Calls
                  </h4>
                  <div className="space-y-2">
                    {recipeData.toolsUsed.map((tool, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-700 text-sm">{tool.toolName}</span>
                        </div>
                        
                        {tool.args && Object.keys(tool.args).length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500 block mb-1">Arguments:</span>
                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(tool.args, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {tool.result !== undefined && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Result:</span>
                            <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                              {parseMCPContent(tool.result)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nutrition MCP Data */}
        {nutritionData && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-800">Nutrition Analysis</h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {nutritionData.toolsUsed?.length || 0} calls
              </span>
            </div>
            
            <div className="space-y-3 ml-5">
              {/* Available Tools */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-[0.15em]">
                  Available Tools
                </h4>
                <div className="flex flex-wrap gap-1">
                  {nutritionData.toolsAvailable?.map((tool, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tool Calls */}
              {nutritionData.toolsUsed && nutritionData.toolsUsed.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-[0.15em]">
                    Tool Calls
                  </h4>
                  <div className="space-y-2">
                    {nutritionData.toolsUsed.map((tool, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-emerald-700 text-sm">{tool.toolName}</span>
                        </div>
                        
                        {tool.args && Object.keys(tool.args).length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500 block mb-1">Arguments:</span>
                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(tool.args, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {tool.result !== undefined && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Result:</span>
                            <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                              {parseMCPContent(tool.result)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error States */}
        {recipeData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Recipe MCP Error</h4>
            <p className="text-xs text-red-600">{recipeData.error}</p>
          </div>
        )}

        {nutritionData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Nutrition MCP Error</h4>
            <p className="text-xs text-red-600">{nutritionData.error}</p>
          </div>
        )}

        {/* No MCP Data */}
        {!recipeData && !nutritionData && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">No MCP data available</p>
            <p className="text-xs text-gray-400 mt-1">Generate a recipe to see tool calls</p>
          </div>
        )}
      </div>
    </div>
  );
} 