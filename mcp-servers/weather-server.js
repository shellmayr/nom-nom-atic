#!/usr/bin/env node

/**
 * Simple Weather MCP Server Example
 * This is a basic MCP server that provides weather information
 * In a real implementation, you'd connect to a real weather API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Create server instance
const server = new Server(
  {
    name: 'weather-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Simulated weather data (in production, use a real weather API)
const weatherData = {
  'San Francisco, CA': {
    temperature: '65°F',
    condition: 'Partly cloudy',
    humidity: '60%',
    season: 'Fall',
  },
  'New York, NY': {
    temperature: '45°F',
    condition: 'Cold and clear',
    humidity: '45%',
    season: 'Winter',
  },
  'default': {
    temperature: '70°F',
    condition: 'Pleasant',
    humidity: '50%',
    season: 'Spring',
  }
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather information for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location to get weather for (e.g., "San Francisco, CA")',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'get_seasonal_ingredients',
        description: 'Get seasonal ingredients available in a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location to get seasonal ingredients for',
            },
            season: {
              type: 'string',
              description: 'Current season (Spring, Summer, Fall, Winter)',
            },
          },
          required: ['location'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_weather') {
    const location = args.location || 'default';
    const weather = weatherData[location] || weatherData['default'];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location,
            ...weather,
            description: `Currently ${weather.condition.toLowerCase()} with ${weather.temperature} in ${location}. Humidity: ${weather.humidity}. Season: ${weather.season}.`,
          }, null, 2),
        },
      ],
    };
  }

  if (name === 'get_seasonal_ingredients') {
    const location = args.location || 'default';
    const season = args.season || 'Spring';
    
    // Simulated seasonal ingredients
    const seasonalIngredients = {
      'Spring': ['asparagus', 'spring onions', 'fresh peas', 'strawberries', 'artichokes'],
      'Summer': ['tomatoes', 'zucchini', 'corn', 'berries', 'fresh herbs'],
      'Fall': ['pumpkin', 'apples', 'squash', 'root vegetables', 'cranberries'],
      'Winter': ['citrus fruits', 'kale', 'brussels sprouts', 'potatoes', 'winter squash'],
    };
    
    const ingredients = seasonalIngredients[season] || seasonalIngredients['Spring'];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location,
            season,
            ingredients,
            description: `Seasonal ingredients available in ${location} during ${season}: ${ingredients.join(', ')}`,
          }, null, 2),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 