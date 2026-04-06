// Store de sesión de registro de comida usando Zustand
// Maneja el estado del flujo completo: captura → análisis → confirmación

import { create } from 'zustand'
import type { AiLogResponse, AlimentoDetectado } from '@/types/logging'
import type { MealType } from '@/types/database'

// Pasos posibles del flujo de registro
export type LogStep =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'analyzing'
  | 'confirming'
  | 'saving'
  | 'done'
  | 'error'

interface LogSessionState {
  // Estado del flujo
  step: LogStep
  method: 'photo' | 'text' | 'manual' | 'barcode' | null
  mealType: MealType

  // Datos de foto
  photoFile: File | null
  photoPreviewUrl: string | null
  photoStoragePath: string | null

  // Entrada de texto
  textInput: string

  // Resultado de la IA
  aiResult: AiLogResponse | null
  editedAlimentos: AlimentoDetectado[]

  // Estado de error
  errorMessage: string | null

  // Calorías guardadas para mostrar en éxito
  savedKcal: number

  // Acciones
  startPhotoCapture(): void
  startTextLog(): void
  startManualSearch(): void
  startBarcodeCapture(): void
  setStep(step: LogStep): void
  setPhotoFile(file: File, previewUrl: string): void
  setPhotoStoragePath(path: string): void
  setTextInput(text: string): void
  setAiResult(result: AiLogResponse): void
  updateAlimento(index: number, changes: Partial<AlimentoDetectado>): void
  removeAlimento(index: number): void
  setMealType(type: MealType): void
  setError(msg: string): void
  setSavedKcal(kcal: number): void
  reset(): void
}

// Infiere el tipo de comida según la hora actual
export function inferMealType(): MealType {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 17) return 'lunch'
  if (hour < 22) return 'dinner'
  return 'snack'
}

// Estado inicial del store
const initialState = {
  step: 'idle' as LogStep,
  method: null,
  mealType: inferMealType(),
  photoFile: null,
  photoPreviewUrl: null,
  photoStoragePath: null,
  textInput: '',
  aiResult: null,
  editedAlimentos: [],
  errorMessage: null,
  savedKcal: 0,
}

export const useLogSessionStore = create<LogSessionState>((set) => ({
  ...initialState,

  // Inicia el flujo con foto
  startPhotoCapture: () =>
    set({ method: 'photo', step: 'capturing', errorMessage: null }),

  // Inicia el flujo con texto
  startTextLog: () =>
    set({ method: 'text', step: 'capturing', errorMessage: null }),

  // Inicia el flujo de búsqueda manual
  startManualSearch: () =>
    set({ method: 'manual', step: 'capturing', errorMessage: null }),

  // Inicia el flujo de escáner de código de barras
  startBarcodeCapture: () =>
    set({ method: 'barcode', step: 'capturing', errorMessage: null }),

  // Cambia el paso del flujo
  setStep: (step) => set({ step }),

  // Guarda el archivo de foto y su URL de previsualización
  setPhotoFile: (file, previewUrl) =>
    set({ photoFile: file, photoPreviewUrl: previewUrl }),

  // Guarda la ruta de almacenamiento de la foto en Supabase Storage
  setPhotoStoragePath: (path) => set({ photoStoragePath: path }),

  // Actualiza el texto de entrada libre
  setTextInput: (text) => set({ textInput: text }),

  // Guarda el resultado de la IA y copia los alimentos para edición
  setAiResult: (result) =>
    set({ aiResult: result, editedAlimentos: [...result.alimentos] }),

  // Actualiza un alimento editado por el usuario
  updateAlimento: (index, changes) =>
    set((state) => {
      const updated = [...state.editedAlimentos]
      updated[index] = { ...updated[index], ...changes }
      return { editedAlimentos: updated }
    }),

  // Elimina un alimento de la lista editada
  removeAlimento: (index) =>
    set((state) => ({
      editedAlimentos: state.editedAlimentos.filter((_, i) => i !== index),
    })),

  // Cambia el tipo de comida
  setMealType: (mealType) => set({ mealType }),

  // Registra un error y cambia al paso de error
  setError: (msg) => set({ errorMessage: msg, step: 'error' }),

  // Guarda las calorías para mostrar en la pantalla de éxito
  setSavedKcal: (kcal) => set({ savedKcal: kcal }),

  // Reinicia el store al estado inicial
  reset: () => set({ ...initialState, mealType: inferMealType() }),
}))
