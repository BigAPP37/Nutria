'use client'

// Hook para eliminar (soft-delete) una entrada del diario de comidas
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

async function softDeleteEntry(entryId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('food_log_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', entryId)
  if (error) throw new Error(error.message)
}

export function useDeleteEntry(onSuccess?: () => void) {
  return useMutation({
    mutationFn: softDeleteEntry,
    onSuccess,
  })
}
