export interface MCPToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string | null;
  isError?: boolean;
}

export interface MCPTool {
  toolName: string;
  result?: unknown;
}

export interface MCPTransport {
  name: string;
  command: string;
  args: string[];
}

export interface MCPData {
  enabled: boolean;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  toolsAvailable: string[];
  toolsUsed: MCPToolCall[];
  transport: MCPTransport[] | null;
  error: string | null;
  toolDetails: Record<string, unknown>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timing?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
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