import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { FavoriteRecipe } from '../types';
import { useActiveProfile } from './useActiveProfile';

interface FavoriteRecipe {
  id?: string;           // uuid
  user_id: string;       // uuid
  recipe_id: string;     // uuid
  notes: string | null;  // text
  last_cooked: string | null;  // timestamptz
  tags: string[];        // _text
  created_at?: string;   // timestamptz
  rating: number;        // int4
}

export function useFavorites(isHouseholdView?: boolean) {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { id: userId, profile } = useActiveProfile();

  const fetchFavorites = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          last_cooked,
          notes,
          rating,
          tags,
          user_id,
          recipe_id,
          recipes (
            *
          ),
          profiles (
            id,
            full_name,
            user_type,
            linked_household_id
          )
        `);

      // Si estamos en vista household y el usuario pertenece a un household
      if (isHouseholdView && profile?.linked_household_id) {
        query = query.eq('profiles.linked_household_id', profile.linked_household_id);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: favoritesData, error: favoritesError } = await query;

      if (favoritesError) throw favoritesError;

      console.log('Raw favorites data:', favoritesData?.[0]);

      const transformedFavorites = favoritesData?.map(fav => ({
        ...fav.recipes,
        favorite_id: fav.id,
        created_at: fav.created_at,
        last_cooked: fav.last_cooked,
        notes: fav.notes,
        rating: fav.rating,
        tags: fav.tags,
        user_id: fav.user_id,
        member_name: fav.profiles?.full_name,
        recipe_id: fav.recipe_id
      })) || [];

      console.log('Transformed favorites:', transformedFavorites);
      setFavorites(transformedFavorites);
      setLoading(false);
      setError(null);

    } catch (e) {
      console.error('Error fetching favorites:', e);
      setError(e as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel('favorites_changes');
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: isHouseholdView && profile?.linked_household_id
            ? `profiles.linked_household_id=eq.${profile.linked_household_id}`
            : `user_id=eq.${userId}`
        },
        () => fetchFavorites()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, isHouseholdView, profile?.linked_household_id]);

  const addFavorite = async (favorite: Omit<FavoriteRecipe, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: favorite.user_id,
          recipe_id: favorite.recipe_id,
          notes: favorite.notes,
          last_cooked: favorite.last_cooked,
          tags: favorite.tags,
          rating: favorite.rating
        }])
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (recipe: FavoriteRecipe) => {
    try {
      if (!recipe.favorite_id) {
        throw new Error('No favorite ID provided');
      }

      // Verificar que el usuario sea el dueño del favorito
      if (recipe.user_id !== userId) {
        throw new Error('No tienes permiso para eliminar este favorito');
      }

      // Actualizar el estado inmediatamente para la UI
      setFavorites(prev => 
        prev.filter(f => f.favorite_id !== recipe.favorite_id)
      );

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', recipe.favorite_id)
        .eq('user_id', userId); // Asegurar que solo se elimine si el usuario es el dueño

      if (error) {
        await fetchFavorites(); // Recargar en caso de error
        throw error;
      }

    } catch (e) {
      console.error('Error removing favorite:', e);
      await fetchFavorites();
      throw e;
    }
  };

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite
  };
}