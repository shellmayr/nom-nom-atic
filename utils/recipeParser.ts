import React from "react";

export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  variations: string[];
  seasonalAdditions: string[];
  notes: string[];
}

// Helper function to convert markdown to JSX
export function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (currentList.length > 0 && listType) {
      const ListComponent = listType === 'ul' ? 'ul' : 'ol';
      elements.push(
        React.createElement(ListComponent, { 
          key: elements.length, 
          className: "space-y-1 ml-4" 
        }, currentList)
      );
      currentList = [];
      listType = null;
    }
  };

  const parseBold = (text: string): React.ReactNode[] => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return React.createElement('strong', { 
          key: index, 
          className: "font-semibold" 
        }, part);
      }
      return part;
    });
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    // Check for unordered list items
    if (trimmedLine.match(/^[-*+]\s/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      const content = trimmedLine.replace(/^[-*+]\s/, '');
      currentList.push(
        React.createElement('li', {
          key: currentList.length,
          className: "text-sm text-gray-700 font-light leading-relaxed"
        }, parseBold(content))
      );
    }
    // Check for ordered list items
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      currentList.push(
        React.createElement('li', {
          key: currentList.length,
          className: "text-sm text-gray-700 font-light leading-relaxed"
        }, parseBold(content))
      );
    }
    // Regular paragraph
    else if (trimmedLine) {
      flushList();
      elements.push(
        React.createElement('p', {
          key: elements.length,
          className: "text-sm text-gray-700 font-light leading-relaxed"
        }, parseBold(trimmedLine))
      );
    }
    // Empty line
    else if (elements.length > 0) {
      flushList();
      elements.push(React.createElement('br', { key: elements.length }));
    }
  });

  flushList(); // Flush any remaining list
  return elements;
}

// Helper function to parse recipe content and extract ingredients
export function parseRecipeContent(recipe: string): ParsedRecipe {
  const lines = recipe.split('\n');
  const ingredients: string[] = [];
  const instructions: string[] = [];
  const variations: string[] = [];
  const seasonalAdditions: string[] = [];
  const notes: string[] = [];
  let currentSection = '';
  let title = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('## ')) {
      title = line.slice(3);
      currentSection = 'title';
    } else if (line.startsWith('### ')) {
      const sectionName = line.slice(4).toLowerCase();
      if (sectionName.includes('ingredient')) {
        currentSection = 'ingredients';
      } else if (sectionName.includes('instruction')) {
        currentSection = 'instructions';
      } else if (sectionName.includes('variation')) {
        currentSection = 'variations';
      } else if (sectionName.includes('seasonal') || sectionName.includes('local')) {
        currentSection = 'seasonal';
      } else if (sectionName.includes('note')) {
        currentSection = 'notes';
      } else {
        currentSection = 'other';
      }
    } else if (line && !line.startsWith('#')) {
      switch (currentSection) {
        case 'ingredients':
          if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+/)) {
            ingredients.push(line);
          } else {
            ingredients.push(`• ${line}`);
          }
          break;
        case 'instructions':
          if (line.match(/^\d+\.?\s/)) {
            instructions.push(line);
          } else if (line) {
            instructions.push(line);
          }
          break;
        case 'variations':
          variations.push(line);
          break;
        case 'seasonal':
          seasonalAdditions.push(line);
          break;
        case 'notes':
          notes.push(line);
          break;
      }
    }
  }

  return {
    title,
    ingredients,
    instructions,
    variations,
    seasonalAdditions,
    notes
  };
}

// Helper function to parse MCP content structure
export function parseMCPContent(data: unknown): string {
  if (!data) return 'No data';
  
  // If it's already a string, return it
  if (typeof data === 'string') return data;
  
  // If it has the MCP content structure
  if (typeof data === 'object' && data !== null && 'content' in data) {
    const content = (data as { content: unknown }).content;
    if (Array.isArray(content)) {
      return content
        .map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'type' in item && 'text' in item) {
            const typedItem = item as { type: string; text: string };
            if (typedItem.type === 'text' && typedItem.text) {
              // Try to parse the text as JSON for better formatting
              try {
                const parsed = JSON.parse(typedItem.text);
                return JSON.stringify(parsed, null, 2);
              } catch {
                // If it's not JSON, return as is
                return typedItem.text;
              }
            }
          }
          return JSON.stringify(item, null, 2);
        })
        .join('\n\n');
    }
  }
  
  // Otherwise, return stringified version
  return JSON.stringify(data, null, 2);
} 