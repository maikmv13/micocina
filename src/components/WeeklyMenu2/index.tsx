import React, { useState, useEffect } from 'react';
import { MenuItem, Recipe, MealType } from '../../types';
import { ExtendedWeeklyMenuDB } from '../../services/weeklyMenu';
import { TodayCard } from './TodayCard';
import { MobileView } from './MobileView';
import { DesktopView } from './DesktopView';
import { Header } from './Header';
import { MenuHistory } from './MenuHistory';
import { OnboardingWizard } from './OnboardingWizard';
import { useMenuActions } from '../../hooks/useMenuActions';
import { useRecipes } from '../../hooks/useRecipes';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import { supabase } from '../../lib/supabase';
import { weekDays } from './utils';
import { RecipeSelectorSidebar } from './RecipeSelectorSidebar';
import { Navigate } from 'react-router-dom';
import { MenuSkeleton } from './MenuSkeleton';

export function WeeklyMenu2() {
  const [selectedDay, setSelectedDay] = useState<string>('Lunes');
  const [showHistory, setShowHistory] = useState(false);
  const [menuHistory, setMenuHistory] = useState<ExtendedWeeklyMenuDB[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<MenuItem | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedMealInfo, setSelectedMealInfo] = useState<{
    day: string;
    meal: MealType;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Verificar autenticación primero
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
        if (!user) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Solo cargar el menú si hay usuario
  const { 
    menuItems: menu, 
    loading: menuLoading, 
    error 
  } = useActiveMenu(userId || undefined);
  const { recipes } = useRecipes();

  // Handle menu updates
  const handleAddToMenu = async (recipe: Recipe | null, day: string, meal: MealType) => {
    try {
      if (!userId) {
        console.error('No hay un usuario autenticado');
        return;
      }

      console.log('Actualizando menú:', {
        menuId: userId,
        day,
        meal,
        recipeId: recipe?.id
      });

      const dayKey = Object.entries({
        'Lunes': 'monday',
        'Martes': 'tuesday',
        'Miércoles': 'wednesday',
        'Jueves': 'thursday',
        'Viernes': 'friday',
        'Sábado': 'saturday',
        'Domingo': 'sunday'
      }).find(([key]) => key === day)?.[1];

      const mealKey = {
        'desayuno': 'breakfast',
        'comida': 'lunch',
        'snack': 'snack',
        'cena': 'dinner'
      }[meal];

      if (!dayKey || !mealKey) {
        throw new Error('Invalid day or meal type');
      }

      const fieldName = `${dayKey}_${mealKey}_id`;

      const { error: updateError } = await supabase
        .from('weekly_menus')
        .update({ [fieldName]: recipe?.id || null })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Force page reload to update menu
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar el menú:', error);
    }
  };

  // Menu actions (generate, export, etc.) - MOVIDO DESPUÉS DE handleAddToMenu
  const { 
    isGenerating, 
    lastGenerated, 
    showOnboarding: menuShowOnboarding,
    setShowOnboarding: setMenuShowOnboarding,
    handleGenerateMenu, 
    handleExport 
  } = useMenuActions(
    userId || undefined,
    handleAddToMenu,
    (menuId: string | null) => {
      if (menuId) {
        window.location.reload();
      }
    }
  );

  // Verificar si hay suficientes recetas favoritas
  const checkFavoriteRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: favorites } = await supabase
        .from('favorites')
        .select('recipe_id, recipes!favorites_recipe_id_fkey (meal_type)')
        .eq('user_id', user.id);

      if (!favorites || favorites.length === 0) return false;

      // Contar recetas por tipo de comida
      const mealTypeCounts = favorites.reduce((acc, fav) => {
        const mealType = fav.recipes?.meal_type;
        if (mealType) {
          acc[mealType] = (acc[mealType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Verificar mínimos por tipo de comida (2 por cada tipo)
      const hasEnough = Object.entries(mealTypeCounts).every(([type, count]) => count >= 2);
      
      return hasEnough;
    } catch (error) {
      console.error('Error checking favorites:', error);
      return false;
    }
  };

  // Manejar la generación del menú
  const handleGenerateMenuClick = async () => {
    try {
      const hasEnoughFavorites = await checkFavoriteRecipes();
      
      if (!hasEnoughFavorites) {
        setShowOnboardingWizard(true);
        return;
      }

      try {
        await handleGenerateMenu(recipes);
      } catch (error) {
        // Si el error es por falta de recetas, mostrar el wizard
        if (error instanceof Error && error.message.includes('No hay suficientes recetas')) {
          setShowOnboardingWizard(true);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error al generar menú:', error);
    }
  };

  // Load menu history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: history, error } = await supabase
          .from('weekly_menus')
          .select('*')
          .eq('status', 'archived')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMenuHistory(history || []);
      } catch (error) {
        console.error('Error loading menu history:', error);
      }
    };

    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  // Restore menu from history
  const handleRestoreMenu = async (menuId: string) => {
    try {
      // Archive current active menu
      if (userId) {
        await supabase
          .from('weekly_menus')
          .update({ status: 'archived' })
          .eq('id', userId);
      }

      // Restore selected menu
      await supabase
        .from('weekly_menus')
        .update({ status: 'active' })
        .eq('id', menuId);

      setShowHistory(false);
      window.location.reload();
    } catch (error) {
      console.error('Error restoring menu:', error);
    }
  };

  // Handle meal selection
  const handleMealClick = (day: string, meal: MealType) => {
    console.log('Seleccionando comida:', { day, meal });
    setSelectedMealInfo({ day, meal });
    setShowRecipeSelector(true);
  };

  // Handle recipe selection
  const handleRecipeSelect = async (recipe: Recipe) => {
    if (selectedMealInfo) {
      console.log('Seleccionando receta:', {
        recipe,
        day: selectedMealInfo.day,
        meal: selectedMealInfo.meal
      });

      try {
        await handleAddToMenu(recipe, selectedMealInfo.day, selectedMealInfo.meal);
        setShowRecipeSelector(false);
        setSelectedMealInfo(null);
      } catch (error) {
        console.error('Error selecting recipe:', error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return <MenuSkeleton />;
  }

  // Si no hay usuario o showOnboarding es true, mostrar onboarding
  if (!userId || showOnboarding) {
    return (
      <Navigate to="/" replace />
    );
  }

  // Si hay error en la carga del menú
  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-red-200 p-6">
        <p className="text-red-600 text-center">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 mx-auto block"
          onClick={() => window.location.reload()}
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Recipe Selector Sidebar */}
      <RecipeSelectorSidebar
        isOpen={showRecipeSelector}
        onClose={() => {
          setShowRecipeSelector(false);
          setSelectedMealInfo(null);
        }}
        onSelectRecipe={handleRecipeSelect}
        selectedDay={selectedMealInfo?.day || ''}
        selectedMeal={selectedMealInfo?.meal || 'comida'}
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={() => {
          setShowOnboardingWizard(false);
          handleGenerateMenu(recipes);
        }}
        onGenerateMenu={() => handleGenerateMenu(recipes)}
      />

      {/* Contenedor principal */}
      <div>
        {/* Header */}
        <Header
          className="mb-6"
          onGenerateMenu={handleGenerateMenuClick}
          onExport={() => handleExport(menu)}
          onToggleHistory={() => setShowHistory(!showHistory)}
          isGenerating={isGenerating}
          lastGenerated={lastGenerated}
        />

        {/* Main content */}
        <div className="relative mb-6">
          {menuLoading ? (
            <div className="mt-4 md:mt-6">
              <MenuSkeleton />
            </div>
          ) : (
            <>
              {/* Today's Menu */}
              <div className="mt-4 md:mt-6">
                <TodayCard
                  menuItems={menu}
                  onViewRecipe={setSelectedRecipe}
                  activeMenu={null}
                />
              </div>

              {/* Weekly Menu View */}
              <div className="mt-6">
                <div className="hidden md:block">
                  <DesktopView
                    weekDays={weekDays}
                    weeklyMenu={menu}
                    onMealClick={handleMealClick}
                    onRemoveMeal={(day, meal) => handleAddToMenu(null, day, meal)}
                    onViewRecipe={setSelectedRecipe}
                    onAddToMenu={handleAddToMenu}
                    activeMenu={null}
                  />
                </div>
                <div className="md:hidden">
                  <MobileView
                    selectedDay={selectedDay as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'  }
                    weekDays={weekDays}
                    weeklyMenu={menu}
                    onDayChange={setSelectedDay}
                    onMealClick={handleMealClick}
                    onRemoveMeal={(day, meal) => handleAddToMenu(null, day, meal)}
                    onViewRecipe={setSelectedRecipe}
                    onAddToMenu={handleAddToMenu}
                    activeMenu={null}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Menu History y Onboarding Wizard */}
        {showHistory && (
          <div className="mb-6">
            <MenuHistory
              history={menuHistory}
              onRestore={handleRestoreMenu}
              onHistoryChange={setMenuHistory}
              onMenuArchived={() => {}}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default WeeklyMenu2;