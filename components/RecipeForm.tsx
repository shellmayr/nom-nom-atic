"use client";

import { useState } from "react";

interface RecipeFormProps {
  onSubmit: (input: string) => Promise<void>;
  isLoading: boolean;
}

export default function RecipeForm({ onSubmit, isLoading }: RecipeFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await onSubmit(input.trim());
  };

  return (
    <div className="flex items-center gap-8 mb-8">
      <h1 className="text-4xl font-bold tracking-tight whitespace-nowrap text-gray-700 font-bungee">
        Nom-Nom-atic
      </h1>
      
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a dish name (e.g., chocolate chip cookies, beef stew, pasta carbonara)"
            className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent text-sm font-light bg-white/80 backdrop-blur-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-8 py-4 bg-[#0a1628] text-white rounded-2xl hover:bg-[#1e293b] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm tracking-wide transition-all duration-200 whitespace-nowrap font-bungee"
          >
            {isLoading ? "Finding..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
} 