import { isMCPData, MCPToolCall } from "../types/mcp";
import { parseMCPContent, parseRecipeContent } from "../utils/recipeParser";
import { useState } from "react";

interface TraceCall extends MCPToolCall {
  service: 'recipe' | 'nutrition';
  serviceColor: string;
  serviceBg: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  tokenUsage?: number;
}

interface MCPTraceViewProps {
  recipeMcpData: unknown;
  nutritionMcpData: unknown;
  nutritionLoading?: boolean;
}

export default function MCPTraceView({ 
  recipeMcpData, 
  nutritionMcpData,
  nutritionLoading = false
}: MCPTraceViewProps) {
  const recipeData = isMCPData(recipeMcpData) ? recipeMcpData : null;
  const nutritionData = isMCPData(nutritionMcpData) ? nutritionMcpData : null;
  const [selectedCall, setSelectedCall] = useState<TraceCall | null>(null);

  // Collect all tool calls with timing information
  const allCalls: TraceCall[] = [];
  let earliestStart: number | null = null;
  let latestEnd: number | null = null;

  if (recipeData?.toolsUsed) {
    recipeData.toolsUsed.forEach((tool, index) => {
      // Only use actual timestamps, no fallbacks
      const startTime = tool.startTime;
      const endTime = tool.endTime;
      
      if (startTime && endTime) {
        const toolWithExtras = tool as MCPToolCall & { 
          usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
          }; 
          tokenUsage?: number;
        };
        allCalls.push({
          ...tool,
          service: 'recipe',
          serviceColor: 'bg-blue-500',
          serviceBg: 'bg-blue-50',
          index,
          startTime,
          endTime,
          duration: tool.duration || (endTime - startTime),
          usage: toolWithExtras.usage,
          tokenUsage: toolWithExtras.tokenUsage
        });
        
        // Set timeline bounds using only actual timestamps
        if (earliestStart === null || startTime < earliestStart) earliestStart = startTime;
        if (latestEnd === null || endTime > latestEnd) latestEnd = endTime;
      }
    });
  }

  if (nutritionData?.toolsUsed) {
    nutritionData.toolsUsed.forEach((tool, index) => {
      // Only use actual timestamps, no fallbacks
      const startTime = tool.startTime;
      const endTime = tool.endTime;
      
      if (startTime && endTime) {
        const toolWithExtras = tool as MCPToolCall & { 
          usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
          }; 
          tokenUsage?: number;
        };
        allCalls.push({
          ...tool,
          service: 'nutrition',
          serviceColor: 'bg-emerald-500',
          serviceBg: 'bg-emerald-50',
          index,
          startTime,
          endTime,
          duration: tool.duration || (endTime - startTime),
          usage: toolWithExtras.usage,
          tokenUsage: toolWithExtras.tokenUsage
        });
        
        // Set timeline bounds using only actual timestamps
        if (earliestStart === null || startTime < earliestStart) earliestStart = startTime;
        if (latestEnd === null || endTime > latestEnd) latestEnd = endTime;
      }
    });
  }

  // Sort calls by start time for proper waterfall ordering
  allCalls.sort((a, b) => a.startTime - b.startTime);

  // Use actual timeline bounds or default to 0 if no valid data
  const timelineStart = earliestStart || 0;
  const timelineEnd = latestEnd || 0;
  const totalDuration = timelineEnd - timelineStart;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-6" style={{ borderRadius: 0 }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">MCP Trace Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Tools:</span>
            <span className="ml-2 font-medium text-gray-900">{allCalls.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Duration:</span>
            <span className="ml-2 font-medium text-gray-900">{formatDuration(totalDuration)}</span>
          </div>
          <div>
            <span className="text-gray-600">Services:</span>
            <span className="ml-2 font-medium text-gray-900">
              {[recipeData, nutritionData].filter(Boolean).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Tokens:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(() => {
                let totalTokens = 0;
                if (recipeData?.usage?.totalTokens) totalTokens += recipeData.usage.totalTokens;
                if (nutritionData?.usage?.totalTokens) totalTokens += nutritionData.usage.totalTokens;
                return totalTokens > 0 ? totalTokens.toLocaleString() : 'N/A';
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Loading State for Nutrition */}
      {nutritionLoading && !nutritionData && (
        <div className="bg-emerald-50 border border-emerald-200 p-6" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-emerald-300 border-t-emerald-500" style={{ borderRadius: '50%' }}></div>
            <div>
              <h4 className="font-medium text-emerald-800">Nutrition Analysis in Progress</h4>
              <p className="text-sm text-emerald-600 mt-1">Fetching nutritional data via MCP...</p>
            </div>
          </div>
        </div>
      )}

      {/* Waterfall Timeline */}
      {allCalls.length > 0 && (
        <div className="bg-white border border-gray-200 overflow-hidden" style={{ borderRadius: 0 }}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h4 className="font-medium text-gray-900">Waterfall View</h4>
            <p className="text-sm text-gray-600 mt-1">Click on timeline bars to view detailed information</p>
          </div>
          
          <div className="flex">
            {/* Main Timeline Area */}
            <div className={`${selectedCall ? 'w-2/3' : 'w-full'} p-6 transition-all duration-300 ease-in-out`}>
              {/* Timeline Header */}
              <div className="flex justify-between text-xs text-gray-500 mb-4">
                <span>Start: {formatTime(timelineStart)}</span>
                <span>Duration: {formatDuration(totalDuration)}</span>
                <span>End: {formatTime(timelineEnd)}</span>
              </div>

              {/* Time scale ruler */}
              <div className="relative mb-3 h-6 border-b border-gray-200">
                <div className="absolute inset-0 flex justify-between text-xs text-gray-400">
                  {Array.from({ length: 5 }, (_, i) => {
                    const timePoint = timelineStart + (totalDuration * i / 4);
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-300"></div>
                        <span className="mt-1">{formatTime(timePoint)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact waterfall bars with inline task names */}
              <div className="space-y-px">
                {allCalls.map((call, index) => {
                  const relativeStart = totalDuration > 0 ? ((call.startTime - timelineStart) / totalDuration) * 100 : 0;
                  const relativeWidth = totalDuration > 0 ? (call.duration / totalDuration) * 100 : 100;
                  const isSelected = selectedCall === call;
                  
                  return (
                    <div 
                      key={`${call.service}-${index}`} 
                      className={`relative flex items-center gap-3 py-1 px-2 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 border-l-2 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCall(selectedCall === call ? null : call)}
                    >
                      {/* Simple task name text */}
                      <div className="w-48 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${call.serviceColor} ${isSelected ? 'ring-2 ring-blue-300' : ''}`} style={{ borderRadius: 0 }}></div>
                          <span className={`text-xs truncate ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                            {call.toolName}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                            ({formatDuration(call.duration)})
                          </span>
                        </div>
                      </div>

                      {/* Timeline bar */}
                      <div className="flex-1">
                        <div 
                          className={`relative h-2.5 transition-all ${isSelected ? 'transform scale-y-150' : ''}`}
                          style={{ borderRadius: 0 }}
                        >
                          <div className="relative h-full bg-gray-200" style={{ borderRadius: 0 }}>
                            <div 
                              className={`absolute h-full ${call.serviceColor} ${isSelected ? 'opacity-100 shadow-md ring-1 ring-blue-400' : 'opacity-80'}`}
                              style={{
                                left: `${Math.max(0, Math.min(100, relativeStart))}%`,
                                width: `${Math.max(1, Math.min(100, relativeWidth))}%`,
                                borderRadius: 0
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expandable Details Panel */}
            <div className={`${selectedCall ? 'w-1/3' : 'w-0'} border-l border-gray-200 bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out`}>
              {selectedCall && (
                <div className="p-6 overflow-y-auto max-h-screen">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">Task Details</h5>
                    <button 
                      onClick={() => setSelectedCall(null)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Task Header */}
                    <div className="p-3 bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 ${selectedCall.serviceColor}`} style={{ borderRadius: 0 }}></div>
                        <span className="font-medium text-sm text-gray-900">
                          {selectedCall.toolName}
                        </span>
                      </div>
                      <div className={`text-xs px-2 py-1 ${selectedCall.serviceBg} ${selectedCall.service === 'recipe' ? 'text-blue-700' : 'text-emerald-700'} mb-2`} style={{ borderRadius: 0 }}>
                        {selectedCall.service} service
                      </div>
                    </div>

                    {/* Timing Information */}
                    <div className="p-3 bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                      <h6 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Timing</h6>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium">{formatDuration(selectedCall.duration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Start:</span>
                          <span className="ml-2 font-mono text-gray-700">{formatTime(selectedCall.startTime)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">End:</span>
                          <span className="ml-2 font-mono text-gray-700">{formatTime(selectedCall.endTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Token Usage Information */}
                    {(selectedCall.usage || selectedCall.tokenUsage) && (
                      <div className="p-3 bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                        <h6 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Token Usage</h6>
                        <div className="space-y-1 text-xs">
                          {selectedCall.usage?.totalTokens && (
                            <div>
                              <span className="text-gray-500">Total Tokens:</span>
                              <span className="ml-2 font-medium">{selectedCall.usage.totalTokens.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedCall.usage?.promptTokens && (
                            <div>
                              <span className="text-gray-500">Prompt Tokens:</span>
                              <span className="ml-2 font-mono text-gray-700">{selectedCall.usage.promptTokens.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedCall.usage?.completionTokens && (
                            <div>
                              <span className="text-gray-500">Completion Tokens:</span>
                              <span className="ml-2 font-mono text-gray-700">{selectedCall.usage.completionTokens.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedCall.tokenUsage && (
                            <div>
                              <span className="text-gray-500">Tokens:</span>
                              <span className="ml-2 font-medium">{selectedCall.tokenUsage.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arguments */}
                    {selectedCall.args && Object.keys(selectedCall.args).length > 0 && (
                      <div className="p-3 bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                        <h6 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Arguments</h6>
                        <pre className="text-xs bg-gray-50 p-2 border border-gray-200 overflow-x-auto" style={{ borderRadius: 0 }}>
                          {JSON.stringify(selectedCall.args, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Result */}
                    {selectedCall.result !== undefined && (
                      <div className="p-3 bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                        <h6 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Result</h6>
                        {(() => {
                          const resultContent = parseMCPContent(selectedCall.result);
                          
                          // Check if this looks like recipe content
                          if (resultContent.includes('### Ingredients') || resultContent.includes('### Instructions')) {
                            const parsedRecipe = parseRecipeContent(resultContent);
                            
                            return (
                              <div className="space-y-4">
                                {/* Recipe Title */}
                                {parsedRecipe.title && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">{parsedRecipe.title}</h4>
                                  </div>
                                )}
                                
                                {/* Ingredients */}
                                {parsedRecipe.ingredients.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Ingredients</h5>
                                    <div className="bg-gray-50 p-3 border border-gray-200 max-h-32 overflow-y-auto" style={{ borderRadius: 0 }}>
                                      <ul className="space-y-1 text-xs">
                                        {parsedRecipe.ingredients.slice(0, 10).map((ingredient: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                            <span className="text-gray-700">{ingredient.replace(/^[•\-\*]\s*/, '')}</span>
                                          </li>
                                        ))}
                                        {parsedRecipe.ingredients.length > 10 && (
                                          <li className="text-gray-500 italic">... and {parsedRecipe.ingredients.length - 10} more ingredients</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Instructions */}
                                {parsedRecipe.instructions.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Instructions</h5>
                                    <div className="bg-gray-50 p-3 border border-gray-200 max-h-32 overflow-y-auto" style={{ borderRadius: 0 }}>
                                      <ul className="space-y-1 text-xs">
                                        {parsedRecipe.instructions.slice(0, 5).map((instruction: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-gray-500 font-medium flex-shrink-0">{idx + 1}.</span>
                                            <span className="text-gray-700">{instruction.replace(/^\d+\.\s*/, '')}</span>
                                          </li>
                                        ))}
                                        {parsedRecipe.instructions.length > 5 && (
                                          <li className="text-gray-500 italic">... and {parsedRecipe.instructions.length - 5} more steps</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Raw content toggle */}
                                <details className="mt-3">
                                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    Show raw content
                                  </summary>
                                  <pre className="text-xs bg-green-50 p-2 border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto mt-2" style={{ borderRadius: 0 }}>
                                    {resultContent}
                                  </pre>
                                </details>
                              </div>
                            );
                          }
                          
                          // For non-recipe content, show as before
                          return (
                            <pre className="text-xs bg-green-50 p-2 border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto" style={{ borderRadius: 0 }}>
                              {resultContent}
                            </pre>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tool Information - Updated with square corners */}
      {allCalls.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Tool Call Summary</h4>
          
          {/* Recipe Tools */}
          {recipeData && (
            <div className="bg-blue-50 border border-blue-200 p-4" style={{ borderRadius: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-blue-500" style={{ borderRadius: 0 }}></div>
                <h5 className="font-medium text-blue-900">Recipe Generation Tools</h5>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1" style={{ borderRadius: 0 }}>
                  {recipeData.toolsUsed?.length || 0} calls
                </span>
                {recipeData.usage && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1" style={{ borderRadius: 0 }}>
                    {recipeData.usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
                {recipeData.timing && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1" style={{ borderRadius: 0 }}>
                    {formatDuration(recipeData.timing.duration)}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-blue-800">
                Click on timeline bars above to view individual tool details
              </div>
            </div>
          )}

          {/* Nutrition Tools */}
          {nutritionData && (
            <div className="bg-emerald-50 border border-emerald-200 p-4" style={{ borderRadius: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-emerald-500" style={{ borderRadius: 0 }}></div>
                <h5 className="font-medium text-emerald-900">Nutrition Analysis Tools</h5>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1" style={{ borderRadius: 0 }}>
                  {nutritionData.toolsUsed?.length || 0} calls
                </span>
                {nutritionData.usage && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1" style={{ borderRadius: 0 }}>
                    {nutritionData.usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
                {nutritionData.timing && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1" style={{ borderRadius: 0 }}>
                    {formatDuration(nutritionData.timing.duration)}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-emerald-800">
                Click on timeline bars above to view individual tool details
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {allCalls.length === 0 && !nutritionLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: 0 }}>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">No MCP trace data available</p>
          <p className="text-xs text-gray-400 mt-1">Generate a recipe to see tool execution timeline</p>
        </div>
      )}
    </div>
  );
} 