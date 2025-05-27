export interface MCPTool {
  toolName: string;
  result?: unknown;
}

export interface MCPData {
  enabled: boolean;
  model: string;
  toolsAvailable: unknown[];
  toolsUsed: MCPTool[];
}

export function isMCPData(data: unknown): data is MCPData {
  return (
    typeof data === 'object' && 
    data !== null &&
    'enabled' in data &&
    'model' in data &&
    'toolsAvailable' in data &&
    'toolsUsed' in data
  );
}

export function hasMCPTools(data: unknown): data is { toolsUsed: unknown[] } {
  return (
    typeof data === 'object' && 
    data !== null &&
    'toolsUsed' in data &&
    Array.isArray((data as { toolsUsed: unknown }).toolsUsed)
  );
} 