import { parseMCPContent } from "../utils/recipeParser";
import { MCPData } from "../types/mcp";

interface MCPDebugPanelProps {
  mcpData: MCPData;
}

export default function MCPDebugPanel({ mcpData }: MCPDebugPanelProps) {
  return (
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
                    {mcpData.toolsUsed.map((tool, index) => (
                      <div key={index} className="bg-gray-50/50 border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                          <code className="text-xs text-gray-700 bg-gray-100/70 px-3 py-1 rounded-md font-mono font-medium">
                            {tool.toolName}
                          </code>
                        </div>
                        
                        {tool.result !== undefined && (
                          <pre className="text-[11px] text-gray-600 bg-white/70 p-3 rounded-md border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                            {parseMCPContent(tool.result)}
                          </pre>
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
  );
} 