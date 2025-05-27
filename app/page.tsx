"use client";

import { useState } from "react";

async function generateCombinedRecipe(userInput: string) {
  try {
    const response = await fetch("/api/recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: userInput }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return `❌ Error: ${errorData.error || "Failed to generate recipe"}`;
    }

    const data = await response.json();
    return data.recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    return "❌ Error generating recipe. Please try again.";
  }
}

export default function Home() {
  const [input, setInput] = useState("");
  const [recipe, setRecipe] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    const result = await generateCombinedRecipe(input.trim());
    setRecipe(result);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Recipe Combiner</h1>
        <p className="text-gray-600">Enter a dish name and I&apos;ll find the top 10 recipes, then combine them into one optimized version!</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a dish name (e.g., chocolate chip cookies, beef stew, pasta carbonara)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Finding Recipes..." : "Generate Recipe"}
          </button>
        </div>
      </form>

      {recipe && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="prose max-w-none">
            {recipe.split('\n').map((line, index) => {
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold mt-6 mb-4">{line.slice(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else {
                return <p key={index} className="mb-2">{line}</p>;
              }
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Researching and combining the best recipes...</p>
        </div>
      )}
    </div>
  );
}
