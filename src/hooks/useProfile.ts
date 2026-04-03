// Hook de TanStack Query para cargar y gestionar el perfil del usuario
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserProfileInsert } from '@/types/database'

const PROFILE_QUERY_KEY = ['profile']

// Cargar el perfil del usuario actual
async function fetchProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    // Si no existe el perfil, retornar null (usuario nuevo)
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as UserProfile
}

// Hook para obtener el perfil del usuario
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Actualizar el perfil del usuario
async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}

// Hook para actualizar el perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string
      updates: Partial<UserProfile>
    }) => updateProfile(userId, updates),
    onSuccess: (data) => {
      // Actualizar el caché con los nuevos datos
      queryClient.setQueryData(PROFILE_QUERY_KEY, data)
    },
  })
}

// Crear el perfil del usuario por primera vez
async function createProfile(profile: UserProfileInsert): Promise<UserProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}

// Hook para crear el perfil inicial
export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data)
    },
  })
}

// Invalidar el caché del perfil
export function useInvalidateProfile() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
}
