# MCP (Model Context Protocol) Integration

This recipe app now supports MCP tools for enhanced functionality. MCP allows the AI to access external tools and data sources in a standardized way.

## What's Included

### Weather MCP Server
Located in `mcp-servers/weather-server.js`, this provides:

1. **get_weather** - Get current weather information for a location
2. **get_seasonal_ingredients** - Get seasonal ingredients available in a location

### Nutritionix MCP Server
External server that provides nutrition data:

1. **nutrition_lookup** - Get detailed nutritional information for foods and ingredients
2. **nutrition_search** - Search for foods and get basic nutrition data

## Setup

### Environment Variables
Create a `.env.local` file with:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Nutritionix API Credentials
# Get these from https://developer.nutritionix.com/
NUTRITIONIX_APP_ID=your_nutritionix_app_id_here
NUTRITIONIX_APP_KEY=your_nutritionix_app_key_here
```

### Nutritionix Setup
1. Sign up at https://developer.nutritionix.com/
2. Create a new application to get your App ID and App Key
3. Add the credentials to your `.env.local` file
4. The MCP server will automatically install via `uvx nutritionix-mcp-server`

## How It Works

1. **MCP Client Setup**: The recipe API creates MCP clients for both weather and nutrition servers
2. **Tool Discovery**: The AI automatically discovers available MCP tools from both servers
3. **Tool Usage**: The AI can call these tools to enhance recipe recommendations
4. **Context Enhancement**: Weather, seasonal, and nutritional data influences recipe suggestions

## Example Usage

When you request a recipe, the AI will:
1. Call `get_weather` to understand current conditions
2. Call `get_seasonal_ingredients` to know what's in season
3. Call `nutrition_lookup` for key ingredients to provide nutritional insights
4. Use this data to suggest:
   - Weather-appropriate cooking methods
   - Seasonal ingredient variations
   - Regional adaptations
   - Nutritional highlights and healthier alternatives

## Adding More MCP Servers

You can add more MCP servers by:

1. **Creating a new server** in the `mcp-servers/` directory
2. **Installing dependencies** with `npm install`
3. **Updating the API route** to connect to your new server

### Example: Adding Multiple MCP Servers

```javascript
// In the API route
const weatherTransport = new Experimental_StdioMCPTransport({
  command: 'node',
  args: ['mcp-servers/weather-server.js'],
});

const nutritionTransport = new Experimental_StdioMCPTransport({
  command: 'uvx',
  args: [
    'nutritionix-mcp-server',
    '--app-id', process.env.NUTRITIONIX_APP_ID,
    '--app-key', process.env.NUTRITIONIX_APP_KEY
  ],
});

const weatherClient = await experimental_createMCPClient({
  transport: weatherTransport,
});

const nutritionClient = await experimental_createMCPClient({
  transport: nutritionTransport,
});

// Combine tools from multiple servers
const allTools = {
  ...await weatherClient.tools(),
  ...await nutritionClient.tools(),
};
```

## Available MCP Servers (Examples)

You can also use existing MCP servers:

- **nutritionix-mcp-server** - Nutrition data (now integrated!)
- **@modelcontextprotocol/server-filesystem** - File system access
- **@modelcontextprotocol/server-slack** - Slack integration
- **@modelcontextprotocol/server-github** - GitHub access
- **@modelcontextprotocol/server-postgres** - Database queries

## Error Handling

The app gracefully handles MCP server failures:
- If MCP servers are unavailable, the app continues without MCP tools
- Each server is tried independently - if one fails, others can still work
- Errors are logged but don't break the recipe generation
- Users get recipes even if external tools fail

## Benefits

- **Enhanced Context**: Real-time weather, seasonal, and nutritional data
- **Better Recommendations**: Location, season, and health-specific suggestions
- **Nutritional Insights**: Detailed nutritional information for ingredients
- **Extensible**: Easy to add new data sources and tools
- **Standardized**: Uses the open MCP protocol for tool integration 