import { NutritionData } from "../services/recipeApi";
import { useState } from "react";

interface NutritionPanelProps {
  nutritionData: NutritionData;
  servings: number;
  onServingsChange: (servings: number) => void;
}

interface UserProfile {
  gender: 'male' | 'female';
  age: number;
  weight: number; // kg
  height: number; // cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
}

export default function NutritionPanel({ 
  nutritionData, 
  servings, 
  onServingsChange 
}: NutritionPanelProps) {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gender: 'male',
    age: 30,
    weight: 70,
    height: 170,
    activityLevel: 'moderate'
  });

  const perServing = {
    calories: Math.round(nutritionData.totalNutrition.calories / servings),
    protein: Math.round((nutritionData.totalNutrition.protein / servings) * 10) / 10,
    carbs: Math.round((nutritionData.totalNutrition.carbs / servings) * 10) / 10,
    fat: Math.round((nutritionData.totalNutrition.fat / servings) * 10) / 10,
    fiber: Math.round((nutritionData.totalNutrition.fiber / servings) * 10) / 10,
    sugar: Math.round((nutritionData.totalNutrition.sugar / servings) * 10) / 10,
    sodium: Math.round(nutritionData.totalNutrition.sodium / servings),
  };

  // Calculate daily values based on user profile
  const calculateDailyValues = (profile: UserProfile) => {
    // Mifflin-St Jeor Equation for BMR
    let bmr;
    if (profile.gender === 'male') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9
    };

    const dailyCalories = Math.round(bmr * activityMultipliers[profile.activityLevel]);

    return {
      calories: dailyCalories,
      protein: Math.round(profile.weight * 0.8), // 0.8g per kg body weight
      carbs: Math.round(dailyCalories * 0.45 / 4), // 45-65% of calories, using 45%
      fat: Math.round(dailyCalories * 0.30 / 9), // 20-35% of calories, using 30%
      fiber: profile.gender === 'male' ? 38 : 25, // Daily recommended fiber
      sugar: Math.round(dailyCalories * 0.10 / 4), // <10% of calories
      sodium: 2300, // mg (upper limit regardless of profile)
    };
  };

  const dailyValues = calculateDailyValues(userProfile);

  // Calculate percentages of daily values
  const dailyPercentages = {
    calories: Math.round((perServing.calories / dailyValues.calories) * 100),
    protein: Math.round((perServing.protein / dailyValues.protein) * 100),
    carbs: Math.round((perServing.carbs / dailyValues.carbs) * 100),
    fat: Math.round((perServing.fat / dailyValues.fat) * 100),
    fiber: Math.round((perServing.fiber / dailyValues.fiber) * 100),
    sugar: Math.round((perServing.sugar / dailyValues.sugar) * 100),
    sodium: Math.round((perServing.sodium / dailyValues.sodium) * 100),
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-green-100 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Nutrition Facts</h2>
          
          {/* Profile Settings Button */}
          <button
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors text-sm font-medium"
          >
            {showProfileForm ? 'Close Profile' : 'Personalize'}
          </button>
        </div>

        {/* Profile Form */}
        {showProfileForm && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Gender & Age */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={userProfile.gender}
                    onChange={(e) => setUserProfile({...userProfile, gender: e.target.value as 'male' | 'female'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={userProfile.age}
                    onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              {/* Weight & Height */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={userProfile.weight}
                    onChange={(e) => setUserProfile({...userProfile, weight: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                    max="300"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={userProfile.height}
                    onChange={(e) => setUserProfile({...userProfile, height: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="100"
                    max="250"
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  value={userProfile.activityLevel}
                  onChange={(e) => setUserProfile({...userProfile, activityLevel: e.target.value as UserProfile['activityLevel']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="light">Light (light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                  <option value="active">Active (hard exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (very hard exercise, physical job)</option>
                </select>
                
                {/* Daily Values Preview */}
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="text-xs text-emerald-700 font-medium mb-1">Your Daily Values:</div>
                  <div className="text-xs text-emerald-600 space-y-1">
                    <div>Calories: {dailyValues.calories}</div>
                    <div>Protein: {dailyValues.protein}g • Carbs: {dailyValues.carbs}g • Fat: {dailyValues.fat}g</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Servings Control */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Daily values calculated for: <span className="font-medium text-gray-800">
              {userProfile.gender}, {userProfile.age}y, {userProfile.weight}kg, {userProfile.height}cm
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Servings:</label>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
              >
                −
              </button>
              <span className="px-4 py-1 text-center font-medium min-w-[3rem]">
                {servings}
              </span>
              <button
                onClick={() => onServingsChange(servings + 1)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Per Serving Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Per Serving</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Calories</span>
                <span className="text-lg font-bold text-gray-900">{perServing.calories}</span>
              </div>
              
              <div className="space-y-4">
                {/* Protein */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Protein</span>
                    <span className="font-medium text-blue-600">{perServing.protein}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dailyPercentages.protein, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.protein}% DV</span>
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Carbs</span>
                    <span className="font-medium text-green-600">{perServing.carbs}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dailyPercentages.carbs, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.carbs}% DV</span>
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Fat</span>
                    <span className="font-medium text-purple-600">{perServing.fat}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dailyPercentages.fat, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.fat}% DV</span>
                  </div>
                </div>

                {/* Fiber */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Fiber</span>
                    <span className="font-medium text-emerald-600">{perServing.fiber}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dailyPercentages.fiber, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.fiber}% DV</span>
                  </div>
                </div>

                {/* Sugar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Sugar</span>
                    <span className="font-medium text-pink-600">{perServing.sugar}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dailyPercentages.sugar > 100 ? 'bg-red-500' : 
                          dailyPercentages.sugar > 75 ? 'bg-orange-500' : 'bg-pink-500'
                        }`}
                        style={{ width: `${Math.min(dailyPercentages.sugar, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.sugar}% DV</span>
                  </div>
                </div>

                {/* Sodium */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Sodium</span>
                    <span className="font-medium text-red-600">{perServing.sodium}mg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dailyPercentages.sodium > 100 ? 'bg-red-600' : 
                          dailyPercentages.sodium > 50 ? 'bg-orange-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(dailyPercentages.sodium, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem]">{dailyPercentages.sodium}% DV</span>
                  </div>
                </div>
              </div>

              {/* Daily Value Legend */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  DV = Daily Value personalized for your profile ({dailyValues.calories} cal/day)
                </div>
              </div>
            </div>
          </div>

          {/* Total Recipe Column */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Recipe</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Calories</span>
                <span className="text-lg font-bold text-gray-900">{nutritionData.totalNutrition.calories}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-medium">{nutritionData.totalNutrition.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbs</span>
                  <span className="font-medium">{nutritionData.totalNutrition.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-medium">{nutritionData.totalNutrition.fat}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fiber</span>
                  <span className="font-medium">{nutritionData.totalNutrition.fiber}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sugar</span>
                  <span className="font-medium">{nutritionData.totalNutrition.sugar}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sodium</span>
                  <span className="font-medium">{nutritionData.totalNutrition.sodium}mg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Ingredients Breakdown */}
        {nutritionData.ingredients && nutritionData.ingredients.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-[0.15em]">
              Key Ingredients
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nutritionData.ingredients.slice(0, 6).map((ingredient, index) => (
                <div key={index} className="flex justify-between items-center text-xs p-3 bg-gray-50/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">{ingredient.name}</span>
                    <span className="text-gray-500 block">{ingredient.amount}</span>
                  </div>
                  <span className="font-medium text-gray-600">{ingredient.calories} cal</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 