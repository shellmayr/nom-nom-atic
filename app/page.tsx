import { generateText } from "ai";
import { openai } from "@ai-sdk/openai"; // Ensure OPENAI_API_KEY environment variable is set

async function generate() {
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    return "⚠️ OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.";
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: "You are a friendly assistant!",
      prompt: "Why is the sky blue?",
    });

    console.log(text);
    return text;
  } catch (error) {
    console.error("Error generating text:", error);
    return "❌ Error generating text. Please check your API key and try again.";
  }
}

export default async function Home() {
  const text = await generate()
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {text}
    </div>
  );
}
