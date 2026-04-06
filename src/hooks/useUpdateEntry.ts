'use client'

// Hook para actualizar una entrada del diario de comidas
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UpdateEntryParams {
  entryId: string
  custom_description?: string
  calories_kcal?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  quantity_grams?: number
}

async function updateEntry({ entryId, ...updates }: UpdateEntryParams): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('food_log_entries')
    .update(updates)
    .eq('id', entryId)
  if (error) throw new Error(error.message)
}

export function useUpdateEntry(onSuccess?: () => void) {
  return useMutation({
    mutationFn: updateEntry,
    onSuccess,
  })
}
