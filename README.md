# Recipe Combiner App

A Next.js application that finds the top 10 recipes for any dish and combines them into one optimized recipe. Enhanced with MCP (Model Context Protocol) integration for weather and seasonal context.

## Quick Start

```bash
# Install all dependencies (main app + MCP servers)
npm run setup

# Run both the main app and weather server together
npm run dev:full
```

## Available Scripts

### Main Application
- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### MCP Server Management
- `npm run mcp:install` - Install dependencies for MCP servers
- `npm run mcp:weather` - Start the weather MCP server (production mode)
- `npm run mcp:weather-dev` - Start the weather MCP server (development mode)
- `npm run dev:full` - Run both main app and weather server concurrently
- `npm run setup` - Install all dependencies (main + MCP servers)

## Development Workflow

### Option 1: Full Development (Recommended)
```bash
npm run dev:full
```
This starts both the Next.js app and the weather MCP server simultaneously.

### Option 2: Separate Terminals
```bash
# Terminal 1 - Main app
npm run dev

# Terminal 2 - Weather server
npm run mcp:weather-dev
```

### Option 3: Main App Only (MCP Disabled)
```bash
npm run dev
```
Set `enableMCP = false` in `/app/api/recipe/route.ts` to disable MCP integration.

## MCP Server Configuration

The weather MCP server is located in `mcp-servers/weather-server.js` and provides:
- Weather information for locations
- Seasonal ingredient recommendations

See `MCP_SETUP.md` for detailed MCP integration documentation.

## Environment Variables

Create a `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## How It Works

1. Enter a dish name (e.g., "chocolate chip cookies")
2. The app researches 10 high-quality recipes
3. AI combines them into one optimized recipe
4. MCP tools provide weather and seasonal context
5. Get a unified recipe with variations and local additions

## Features

- 🔍 Recipe research and combination
- 🌤️ Weather-aware recommendations
- 🍂 Seasonal ingredient suggestions
- 📱 Responsive design
- 🛠️ MCP protocol integration
- 📊 Sentry monitoring

## Tech Stack

- Next.js with TypeScript
- AI SDK with OpenAI integration
- MCP (Model Context Protocol)
- Tailwind CSS
- Sentry for monitoring
