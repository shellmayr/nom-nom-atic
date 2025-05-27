interface RecipeImageProps {
  imageUrl: string;
  recipeTitle: string;
}

export default function RecipeImage({ imageUrl, recipeTitle }: RecipeImageProps) {
  return (
    <div className="mb-8">
      <img 
        src={imageUrl} 
        alt={recipeTitle} 
        className="w-full aspect-square object-cover rounded-xl shadow-sm border border-gray-200/50"
      />
    </div>
  );
} 