import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, Filter, Flame, Clock, ChefHat, Command } from 'lucide-react';
import { Recipe, MealType } from '../../types';
import { useRecipes } from '../../hooks/useRecipes';
import { useVirtualizer } from '@tanstack/react-virtual';
import { categories } from '../../types/categories';

interface RecipeSelectorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  selectedDay: string;
  selectedMeal: MealType;
}

export function RecipeSelectorSidebar({ 
  isOpen, 
  onClose, 
  onSelectRecipe,
  selectedDay,
  selectedMeal
}: RecipeSelectorSidebarProps) {
  const { recipes, loading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, selectedCategory]);

  // Focus search input when sidebar opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Virtual list for performance
  const rowVirtualizer = useVirtualizer({
    count: filteredRecipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredRecipes.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredRecipes[selectedIndex]) {
            onSelectRecipe(filteredRecipes[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onSelectRecipe, onClose, filteredRecipes]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Seleccionar {selectedMeal}</h2>
                <p className="text-sm text-gray-500">{selectedDay}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar recetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Category filters */}
          {showFilters && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(({ id, label, emoji }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategory === id
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Command size={14} />
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">K</kbd>
                <span>para buscar</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">ESC</kbd>
                <span>para cerrar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe list */}
        <div 
          ref={parentRef}
          className="flex-1 overflow-y-auto"
        >
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const recipe = filteredRecipes[virtualRow.index];
              return (
                <div
                  key={recipe.id}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedIndex(virtualRow.index);
                      onSelectRecipe(recipe);
                    }}
                    className={`w-full p-4 text-left transition-colors ${
                      virtualRow.index === selectedIndex
                        ? 'bg-rose-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Recipe image or placeholder */}
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Recipe details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {recipe.name}
                        </h3>
                        
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                            {recipe.category}
                          </span>
                          {recipe.calories && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                              <Flame size={12} />
                              <span>{recipe.calories}</span>
                            </span>
                          )}
                          {recipe.prep_time && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              <Clock size={12} />
                              <span>{recipe.prep_time}</span>
                            </span>
                          )}
                        </div>

                        {recipe.side_dish && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                            {recipe.side_dish}
                          </p>
                        )}
                      </div>

                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto" />
              <p className="text-gray-500 mt-2">Cargando recetas...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredRecipes.length === 0 && (
            <div className="p-8 text-center">
              <ChefHat size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No se encontraron recetas</p>
              <p className="text-sm text-gray-500 mt-1">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}