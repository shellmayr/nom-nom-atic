export function RecipeLoadingSkeleton() {
  return (
    <div className="lg:col-span-2">
      {/* Tab Headers Skeleton */}
      <div className="flex border-b border-gray-200 mb-6">
        <div className="px-6 py-3 border-b-2 border-blue-500">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
        </div>
        <div className="px-6 py-3 border-b-2 border-transparent">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </div>

      {/* Recipe Content Skeleton */}
      <div className="min-h-[400px]">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden">
          {/* Title Skeleton */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-8 py-8">
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse mx-auto max-w-md"></div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[400px]">
            {/* Ingredients Skeleton */}
            <div className="lg:col-span-2 bg-gradient-to-b from-gray-50/50 to-gray-50/30 border-r border-gray-100/80 px-8 py-6">
              {/* Image Skeleton */}
              <div className="mb-8">
                <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
              
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-20"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2.5 animate-pulse"></div>
                    <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Skeleton */}
            <div className="lg:col-span-3 px-8 py-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 w-16"></div>
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex space-x-5">
                    <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`}></div>
                      <div className={`h-4 bg-gray-200 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DebugLoadingSkeleton() {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl shadow-sm overflow-hidden sticky top-6">
        <div className="bg-gradient-to-r from-gray-100/50 to-slate-100/50 border-b border-gray-100/60 px-6 py-4">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 