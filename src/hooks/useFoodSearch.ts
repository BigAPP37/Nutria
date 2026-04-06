'use client'

// Hook para buscar alimentos en la base de datos con debounce
// Llama al RPC search_foods de Supabase con 300ms de debounce

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FoodSearchResult } from '@/types/logging'

// Busca alimentos llamando al RPC de Supabase
async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('search_foods', {
    query,
    country: 'ES',
    limit:   20,
  })

  if (error) {
    throw new Error(`Error al buscar alimentos: ${error.message}`)
  }

  return (data as FoodSearchResult[]) ?? []
}

// Hook que retorna resultados de búsqueda con debounce de 300ms
export function useFoodSearch(query: string): {
  results: FoodSearchResult[]
  isLoading: boolean
} {
  // Estado del query con debounce aplicado
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Aplica el debounce al query de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['food-search', debouncedQuery],
    queryFn: () => searchFoods(debouncedQuery),
    // Solo busca si hay al menos 2 caracteres
    enabled: debouncedQuery.length >= 2,
    // Mantiene los resultados anteriores mientras carga nuevos
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  return {
    results: data ?? [],
    isLoading,
  }
}
