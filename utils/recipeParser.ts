import React from "react";

export interface ParsedRecipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    highlights?: string;
  } | null;
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
  const tips: string[] = [];
  let currentSection = '';
  let title = '';
  let description = '';
  let prepTime = '';
  let cookTime = '';
  let totalTime = '';
  let servings = '';
  let nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    highlights?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('## ')) {
      title = line.slice(3);
      currentSection = 'title';
    } else if (line.startsWith('### ')) {
      const sectionName = line.slice(4).toLowerCase();
      if (sectionName.includes('ingredient')) {
        currentSection = 'ingredients';
      } else if (sectionName.includes('instruction') || sectionName.includes('direction') || sectionName.includes('step')) {
        currentSection = 'instructions';
      } else if (sectionName.includes('tip') || sectionName.includes('note') || sectionName.includes('chef')) {
        currentSection = 'tips';
      } else if (sectionName.includes('nutrition')) {
        currentSection = 'nutrition';
      } else {
        currentSection = 'other';
      }
    } else if (line && !line.startsWith('#')) {
      // Parse metadata from the beginning of the recipe (before sections)
      if (currentSection === 'title' || currentSection === '') {
        // Look for description (usually appears right after title)
        if (!description && line && !line.includes(':') && !line.toLowerCase().includes('prep') && !line.toLowerCase().includes('cook') && !line.toLowerCase().includes('serve')) {
          description = line;
        }
        
        // Look for timing and serving information
        if (line.toLowerCase().includes('prep time:') || line.toLowerCase().includes('preparation time:')) {
          prepTime = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('cook time:') || line.toLowerCase().includes('cooking time:')) {
          cookTime = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('total time:')) {
          totalTime = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('serves:') || line.toLowerCase().includes('servings:') || line.toLowerCase().includes('yield:')) {
          servings = line.split(':')[1]?.trim() || '';
        }
      }
      
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
        case 'tips':
          tips.push(line);
          break;
        case 'nutrition':
          // Parse nutrition information
          if (!nutritionInfo) {
            nutritionInfo = {};
          }
          
          // Look for nutrition data patterns with more flexible matching
          const lowerLine = line.toLowerCase();
          
          // Extract calories - look for various patterns
          if ((lowerLine.includes('calories') || lowerLine.includes('kcal')) && line.match(/\d+/)) {
            const calories = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.calories = calories;
          } 
          // Extract protein - look for g or grams
          else if (lowerLine.includes('protein') && line.match(/\d+/)) {
            const protein = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.protein = protein;
          } 
          // Extract carbohydrates - look for carbs, carbohydrates
          else if ((lowerLine.includes('carb') || lowerLine.includes('carbohydrate')) && line.match(/\d+/)) {
            const carbs = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.carbs = carbs;
          } 
          // Extract total fat
          else if (lowerLine.includes('fat') && line.match(/\d+/)) {
            const fat = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.fat = fat;
          } 
          // Extract fiber
          else if (lowerLine.includes('fiber') && line.match(/\d+/)) {
            const fiber = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.fiber = fiber;
          } 
          // Extract sugar
          else if (lowerLine.includes('sugar') && line.match(/\d+/)) {
            const sugar = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.sugar = sugar;
          } 
          // Extract sodium - look for mg specifically for sodium
          else if (lowerLine.includes('sodium') && line.match(/\d+/)) {
            const sodium = parseInt(line.match(/\d+/)?.[0] || '0');
            nutritionInfo.sodium = sodium;
          }
          // Also handle structured data like "Total Calories: 450" or "Per serving: 285 calories"
          else if (line.includes(':') && lowerLine.includes('calor')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.calories = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && lowerLine.includes('protein')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.protein = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && (lowerLine.includes('carb') || lowerLine.includes('carbohydrate'))) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.carbs = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && lowerLine.includes('fat')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.fat = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && lowerLine.includes('fiber')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.fiber = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && lowerLine.includes('sugar')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.sugar = parseInt(match[0]);
            }
          }
          else if (line.includes(':') && lowerLine.includes('sodium')) {
            const match = line.split(':')[1]?.match(/\d+/);
            if (match) {
              nutritionInfo.sodium = parseInt(match[0]);
            }
          }
          // Capture nutrition highlights (descriptive text that doesn't contain numbers or colons)
          else if (!line.includes(':') && !line.match(/\d+/) && line.length > 15) {
            if (!nutritionInfo.highlights) {
              nutritionInfo.highlights = line;
            } else {
              nutritionInfo.highlights += ' ' + line;
            }
          }
          break;
      }
    }
  }

  return {
    title,
    description,
    prepTime,
    cookTime,
    totalTime,
    servings,
    ingredients,
    instructions,
    tips,
    nutritionInfo
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