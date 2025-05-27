# MCP (Model Context Protocol) Integration

This recipe app now supports MCP tools for enhanced functionality. MCP allows the AI to access external tools and data sources in a standardized way.

## What's Included

### Weather MCP Server
Located in `mcp-servers/weather-server.js`, this provides:

1. **get_weather** - Get current weather information for a location
2. **get_seasonal_ingredients** - Get seasonal ingredients available in a location

## How It Works

1. **MCP Client Setup**: The recipe API creates an MCP client that connects to the weather server
2. **Tool Discovery**: The AI automatically discovers available MCP tools
3. **Tool Usage**: The AI can call these tools to enhance recipe recommendations
4. **Context Enhancement**: Weather and seasonal data influences recipe suggestions

## Example Usage

When you request a recipe, the AI will:
1. Call `get_weather` to understand current conditions
2. Call `get_seasonal_ingredients` to know what's in season
3. Use this data to suggest:
   - Weather-appropriate cooking methods
   - Seasonal ingredient variations
   - Regional adaptations

## Adding More MCP Servers

You can add more MCP servers by:

1. **Creating a new server** in the `mcp-servers/` directory
2. **Installing dependencies** with `npm install`
3. **Updating the API route** to connect to your new server

### Example: Adding a Nutrition MCP Server

```javascript
// In the API route
const nutritionTransport = new Experimental_StdioMCPTransport({
  command: 'node',
  args: ['mcp-servers/nutrition-server.js'],
});

const nutritionClient = await experimental_createMCPClient({
  transport: nutritionTransport,
});

const nutritionTools = await nutritionClient.tools();

// Combine tools from multiple servers
const allTools = {
  ...mcpTools,
  ...nutritionTools,
};
```

## Available MCP Servers (Examples)

You can also use existing MCP servers:

- **@modelcontextprotocol/server-filesystem** - File system access
- **@modelcontextprotocol/server-slack** - Slack integration
- **@modelcontextprotocol/server-github** - GitHub access
- **@modelcontextprotocol/server-postgres** - Database queries

## Error Handling

The app gracefully handles MCP server failures:
- If MCP servers are unavailable, the app continues without MCP tools
- Errors are logged but don't break the recipe generation
- Users get recipes even if external tools fail

## Benefits

- **Enhanced Context**: Real-time weather and seasonal data
- **Better Recommendations**: Location and season-specific suggestions
- **Extensible**: Easy to add new data sources and tools
- **Standardized**: Uses the open MCP protocol for tool integration 