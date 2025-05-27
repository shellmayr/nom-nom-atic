import { parseMarkdown } from "../utils/recipeParser";
import React from "react";

interface InstructionsPanelProps {
  instructions: string[];
  notes: string[];
}

export default function InstructionsPanel({ instructions, notes }: InstructionsPanelProps) {
  return (
    <div className="lg:col-span-3 px-8 py-6">
      {instructions.length > 0 ? (
        <div className="space-y-6">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex space-x-5">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed font-light">
                  {parseMarkdown(instruction.replace(/^\d+\.\s*/, '')).map((node, nodeIndex) => (
                    <React.Fragment key={nodeIndex}>{node}</React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm font-light italic">No instructions listed</p>
      )}

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="mt-8 p-5 bg-amber-50/50 border border-amber-100/50 rounded-xl">
          <h3 className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-[0.15em]">
            Chef&apos;s Notes
          </h3>
          <div className="space-y-2">
            {notes.map((note, index) => (
              <p key={index} className="text-sm text-amber-700/90 font-light leading-relaxed">
                {parseMarkdown(note).map((node, nodeIndex) => (
                  <React.Fragment key={nodeIndex}>{node}</React.Fragment>
                ))}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 