import { isMCPData, MCPToolCall } from "../types/mcp";
import { parseMCPContent } from "../utils/recipeParser";

interface TraceCall extends MCPToolCall {
  service: 'recipe' | 'nutrition';
  serviceColor: string;
  serviceBg: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
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

  // Collect all tool calls with timing information
  const allCalls: TraceCall[] = [];
  let earliestStart = Date.now();
  let latestEnd = Date.now();

  if (recipeData?.toolsUsed) {
    recipeData.toolsUsed.forEach((tool, index) => {
      const startTime = tool.startTime || Date.now();
      const endTime = tool.endTime || Date.now();
      allCalls.push({
        ...tool,
        service: 'recipe',
        serviceColor: 'bg-blue-500',
        serviceBg: 'bg-blue-50',
        index,
        startTime,
        endTime,
        duration: tool.duration || (endTime - startTime)
      });
      if (startTime < earliestStart) earliestStart = startTime;
      if (endTime > latestEnd) latestEnd = endTime;
    });
  }

  if (nutritionData?.toolsUsed) {
    nutritionData.toolsUsed.forEach((tool, index) => {
      const startTime = tool.startTime || Date.now();
      const endTime = tool.endTime || Date.now();
      allCalls.push({
        ...tool,
        service: 'nutrition',
        serviceColor: 'bg-emerald-500',
        serviceBg: 'bg-emerald-50',
        index,
        startTime,
        endTime,
        duration: tool.duration || (endTime - startTime)
      });
      if (startTime < earliestStart) earliestStart = startTime;
      if (endTime > latestEnd) latestEnd = endTime;
    });
  }

  const totalDuration = latestEnd - earliestStart;

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
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6">
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-300 border-t-emerald-500"></div>
            <div>
              <h4 className="font-medium text-emerald-800">Nutrition Analysis in Progress</h4>
              <p className="text-sm text-emerald-600 mt-1">Fetching nutritional data via MCP...</p>
            </div>
          </div>
        </div>
      )}

      {/* Gantt Chart Timeline */}
      {allCalls.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h4 className="font-medium text-gray-900">Timeline Visualization</h4>
            <p className="text-sm text-gray-600 mt-1">Tool execution timeline with relative positioning</p>
          </div>
          
          <div className="p-6">
            {/* Timeline Header */}
            <div className="flex justify-between text-xs text-gray-500 mb-4">
              <span>Start: {formatTime(earliestStart)}</span>
              <span>Duration: {formatDuration(totalDuration)}</span>
              <span>End: {formatTime(latestEnd)}</span>
            </div>

            {/* Timeline Bars */}
            <div className="space-y-3">
              {allCalls.map((call, index) => {
                const relativeStart = totalDuration > 0 ? ((call.startTime - earliestStart) / totalDuration) * 100 : 0;
                const relativeWidth = totalDuration > 0 ? (call.duration / totalDuration) * 100 : 100;
                
                return (
                  <div key={`${call.service}-${index}`} className="relative">
                    {/* Tool Info */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${call.serviceColor}`}></div>
                        <span className="font-medium text-sm text-gray-900">
                          {call.toolName}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${call.serviceBg} ${call.service === 'recipe' ? 'text-blue-700' : 'text-emerald-700'}`}>
                          {call.service}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(call.duration)}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-8 bg-gray-100 rounded-lg">
                      <div 
                        className={`absolute h-full rounded-lg ${call.serviceColor} opacity-80`}
                        style={{
                          left: `${Math.max(0, Math.min(100, relativeStart))}%`,
                          width: `${Math.max(2, Math.min(100, relativeWidth))}%`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-white font-medium truncate px-2">
                          {call.toolName}
                        </span>
                      </div>
                    </div>

                    {/* Timing Details */}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatTime(call.startTime)}</span>
                      <span>{formatTime(call.endTime)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tool Information */}
      {allCalls.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Tool Call Details</h4>
          
          {/* Recipe Tools */}
          {recipeData && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h5 className="font-medium text-blue-900">Recipe Generation Tools</h5>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {recipeData.toolsUsed?.length || 0} calls
                </span>
                {recipeData.usage && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {recipeData.usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
                {recipeData.timing && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {formatDuration(recipeData.timing.duration)}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {recipeData.toolsUsed?.map((tool, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-25">
                      <span className="font-medium text-blue-800">{tool.toolName}</span>
                      <span className="text-xs text-blue-600">
                        {tool.duration ? formatDuration(tool.duration) : 'No timing data'}
                      </span>
                    </summary>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-blue-100 text-sm">
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
                          <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {parseMCPContent(tool.result)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition Tools */}
          {nutritionData && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <h5 className="font-medium text-emerald-900">Nutrition Analysis Tools</h5>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {nutritionData.toolsUsed?.length || 0} calls
                </span>
                {nutritionData.usage && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                    {nutritionData.usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
                {nutritionData.timing && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                    {formatDuration(nutritionData.timing.duration)}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {nutritionData.toolsUsed?.map((tool, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200 hover:bg-emerald-25">
                      <span className="font-medium text-emerald-800">{tool.toolName}</span>
                      <span className="text-xs text-emerald-600">
                        {tool.duration ? formatDuration(tool.duration) : 'No timing data'}
                      </span>
                    </summary>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-100 text-sm">
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
                          <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {parseMCPContent(tool.result)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {allCalls.length === 0 && !nutritionLoading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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