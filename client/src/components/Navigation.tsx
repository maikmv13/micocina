import React from 'react';
import { ChefHat, Calendar, ShoppingCart, Heart, Scale } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function Navigation({ activeTab, onTabChange, orientation = 'horizontal' }: NavigationProps) {
  const navItems = [
    { 
      id: 'recetas', 
      icon: ChefHat, 
      label: 'Recetas',
      description: 'Explorar'
    },
    { 
      id: 'menu', 
      icon: Calendar, 
      label: 'Menú',
      description: 'Planificar'
    },
    { 
      id: 'compra', 
      icon: ShoppingCart, 
      label: 'Compra',
      description: 'Lista'
    },
    {
      id: 'favoritos', 
      icon: Heart, 
      label: 'Favoritos',
      description: 'Guardados'
    },
    {
      id: 'peso',
      icon: Scale,
      label: 'Peso',
      description: 'Control'
    }
  ];

  if (orientation === 'vertical') {
    return (
      <div className="space-y-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-white/10 text-white'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav className={`
      fixed z-40 w-full bg-white border-t border-rose-100
      md:sticky md:top-14 md:border-t-0 md:border-b md:border-rose-100
      ${orientation === 'horizontal' ? 'bottom-0' : ''}
    `}>
      <div className="container mx-auto px-4">
        <div className="flex">
          {navItems.map(({ id, icon: Icon, label, description }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`group flex-1 py-3 md:py-4 transition-all duration-200 relative ${
                activeTab === id
                  ? 'text-rose-500'
                  : 'text-gray-400 hover:text-rose-400'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center md:justify-start md:px-4 md:space-x-2">
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  activeTab === id 
                    ? 'bg-rose-50' 
                    : 'group-hover:bg-rose-50/50'
                }`}>
                  <Icon 
                    size={20} 
                    className={`transition-all duration-300 ${
                      activeTab === id 
                        ? 'transform scale-110' 
                        : 'group-hover:scale-110'
                    }`} 
                  />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="font-medium text-xs md:text-sm">{label}</span>
                  <span className="hidden md:block text-xs text-gray-400 group-hover:text-rose-400 transition-colors">
                    {description}
                  </span>
                </div>
              </div>
              {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-pink-500 to-rose-500 md:top-0 md:bottom-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}