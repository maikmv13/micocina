import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, ChefHat, X, Heart, Calendar, 
  Flame, Leaf, Cookie, Beef, Scale, Soup, UtensilsCrossed,
  Dumbbell, Apple, Wheat, CircleDot, Check, Eye,
  Coffee, Sun, Moon
} from 'lucide-react';
import { MenuItem } from '../../types';
import { supabase } from '../../lib/supabase';

interface TodayCardProps {
  menuItems: MenuItem[];
  onViewRecipe: (menuItem: MenuItem) => void;
  activeMenu: any;
}

export function TodayCard({ menuItems, onViewRecipe, activeMenu }: TodayCardProps) {
  const [completions, setCompletions] = useState<Record<string, any>>({});
  
  const today = new Intl.DateTimeFormat('es-ES', { 
    weekday: 'long',
    day: 'numeric',
    month: 'long' 
  }).format(new Date());

  const todayFormatted = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchCompletions();
  }, [menuItems]);

  const fetchCompletions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recipe_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('day', todayFormatted);

      if (error) throw error;

      const completionsMap = (data || []).reduce((acc, completion) => ({
        ...acc,
        [completion.recipe_id]: completion
      }), {});

      setCompletions(completionsMap);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const handleToggleCompletion = async (menuItem: MenuItem, skipped = false) => {
    try {
      if (!activeMenu) {
        console.error('No active menu found');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingCompletion = completions[menuItem.recipe.id];

      if (existingCompletion) {
        const { error: deleteError } = await supabase
          .from('recipe_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (deleteError) throw deleteError;

        setCompletions(prev => {
          const newCompletions = { ...prev };
          delete newCompletions[menuItem.recipe.id];
          return newCompletions;
        });
        return;
      }

      const { data, error } = await supabase
        .from('recipe_completions')
        .upsert({
          user_id: user.id,
          recipe_id: menuItem.recipe.id,
          menu_id: activeMenu.id,
          day: todayFormatted,
          meal_type: menuItem.meal,
          skipped,
          skipped_reason: skipped ? 'Skipped manually' : null,
          rating: null,
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCompletions(prev => ({
          ...prev,
          [menuItem.recipe.id]: data
        }));
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const totalCalorias = menuItems.reduce((total, item) => {
    const calories = parseInt(item.recipe.calories?.replace(/\D/g, '') || '0');
    return total + calories;
  }, 0);

  const mealTypes = ['desayuno', 'comida', 'snack', 'cena'];

  const getMealIcon = (meal: string) => {
    switch (meal) {
      case 'desayuno':
        return <Coffee size={16} className="text-amber-500" />;
      case 'comida':
        return <Sun size={16} className="text-orange-500" />;
      case 'snack':
        return <Cookie size={16} className="text-emerald-500" />;
      case 'cena':
        return <Moon size={16} className="text-indigo-500" />;
      default:
        return null;
    }
  };

  const getMealTime = (meal: string): string => {
    switch (meal) {
      case 'desayuno':
        return '8:00';
      case 'comida':
        return '14:00';
      case 'snack':
        return '17:00';
      case 'cena':
        return '21:00';
      default:
        return '';
    }
  };

  const getMealTypeLabel = (meal: string): string => {
    switch (meal) {
      case 'desayuno':
        return 'Desayuno';
      case 'comida':
        return 'Almuerzo';
      case 'snack':
        return 'Merienda';
      case 'cena':
        return 'Cena';
      default:
        return '';
    }
  };

  const getMealColor = (meal: string): string => {
    switch (meal) {
      case 'desayuno':
        return 'bg-amber-50 border-amber-100 hover:bg-amber-100/50';
      case 'comida':
        return 'bg-orange-50 border-orange-100 hover:bg-orange-100/50';
      case 'snack':
        return 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50';
      case 'cena':
        return 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/50';
      default:
        return 'bg-rose-50 border-rose-100 hover:bg-rose-100/50';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-gradient-to-r from-orange-50 to-rose-50">
        <div className="flex items-center space-x-2">
          <div className="bg-rose-100 p-1.5 rounded-lg">
            <Calendar size={16} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 capitalize">{today}</h3>
          </div>
        </div>
        {totalCalorias > 0 && (
          <div className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-lg border border-rose-100">
            <Flame size={12} className="text-rose-500" />
            <span className="text-xs font-medium text-rose-600">{totalCalorias} kcal</span>
          </div>
        )}
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-rose-100">
        {mealTypes.map((mealType) => {
          const menuItem = menuItems.find(item => item.meal === mealType);
          const isCompleted = menuItem && completions[menuItem.recipe.id]?.completed_at;
          const isSkipped = menuItem && completions[menuItem.recipe.id]?.skipped;
          
          return (
            <div
              key={mealType}
              className={`group relative ${
                menuItem ? getMealColor(mealType) : 'hover:bg-gray-50'
              }`}
            >
              <div className="p-3">
                {/* Time and Icon */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${menuItem ? 'bg-white/50' : 'bg-gray-50'}`}>
                      {getMealIcon(mealType)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500">
                        {getMealTime(mealType)}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {getMealTypeLabel(mealType)}
                      </span>
                    </div>
                  </div>
                  {menuItem?.recipe.calories && (
                    <div className="flex items-center space-x-1 bg-white/80 px-1.5 py-0.5 rounded-lg">
                      <Flame size={10} className="text-rose-500" />
                      <span className="text-[10px] font-medium text-rose-600">
                        {menuItem.recipe.calories}
                      </span>
                    </div>
                  )}
                </div>

                {menuItem ? (
                  <div className="relative">
                    {/* Mobile Layout */}
                    <div className="sm:hidden flex space-x-3">
                      {/* Square Image */}
                      {menuItem.recipe.image_url ? (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={menuItem.recipe.image_url}
                            alt={menuItem.recipe.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ChefHat size={24} className="text-gray-400" />
                        </div>
                      )}

                      {/* Recipe Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {menuItem.recipe.name}
                        </h4>
                        {menuItem.recipe.side_dish && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {menuItem.recipe.side_dish}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {menuItem.recipe.category}
                        </p>
                        {(isCompleted || isSkipped) && (
                          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                            isCompleted 
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-50 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <>
                                <Check size={10} className="flex-shrink-0" />
                                <span>Completada</span>
                              </>
                            ) : (
                              <>
                                <X size={10} className="flex-shrink-0" />
                                <span>Saltada</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      {menuItem.recipe.image_url && (
                        <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden">
                          <img
                            src={menuItem.recipe.image_url}
                            alt={menuItem.recipe.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-sm text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {menuItem.recipe.name}
                        </h4>
                        {menuItem.recipe.side_dish && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {menuItem.recipe.side_dish}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {menuItem.recipe.category}
                        </p>
                        {(isCompleted || isSkipped) && (
                          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                            isCompleted 
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-50 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <>
                                <Check size={10} className="flex-shrink-0" />
                                <span>Completada</span>
                              </>
                            ) : (
                              <>
                                <X size={10} className="flex-shrink-0" />
                                <span>Saltada</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewRecipe(menuItem)}
                        className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200"
                        title="Ver receta"
                      >
                        <Eye size={16} />
                      </button>
                      {!isCompleted && !isSkipped && (
                        <>
                          <button
                            onClick={() => handleToggleCompletion(menuItem)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                            title="Marcar como completada"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleCompletion(menuItem, true)}
                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            title="Marcar como saltada"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">Sin planificar</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}