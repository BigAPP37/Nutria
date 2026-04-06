'use client'

// Página principal de registro de comida
// Orquesta el flujo completo: selección de método → captura → análisis → confirmación → éxito

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLogSessionStore } from '@/stores/logSessionStore'
import { useAiLog } from '@/hooks/useAiLog'
import { useProfile } from '@/hooks/useProfile'
import { MealTypeSelector } from '@/components/logging/MealTypeSelector'
import { LogMethodTabs } from '@/components/logging/LogMethodTabs'
import { PhotoCapture } from '@/components/logging/PhotoCapture'
import { TextLogInput } from '@/components/logging/TextLogInput'
import { ManualSearch } from '@/components/logging/ManualSearch'
import { AnalyzingSpinner } from '@/components/logging/AnalyzingSpinner'
import { AiConfirmSheet } from '@/components/logging/AiConfirmSheet'
import { LogSuccess } from '@/components/logging/LogSuccess'
import { BarcodeScanner } from '@/components/logging/BarcodeScanner'
import { BarcodeConfirmCard } from '@/components/logging/BarcodeConfirmCard'
import type { FoodLookupResult } from '@/app/api/food-lookup/route'

// Monetización Premium — control de límite de fotos
import { usePremiumStore } from '@/stores/premiumStore'
import { PhotoLimitBanner } from '@/components/premium/PhotoLimitBanner'
import { PaywallModal } from '@/components/premium/PaywallModal'

// Obtiene la fecha de hoy en formato ISO (YYYY-MM-DD)
function getTodayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export default function LogPage() {
  const router = useRouter()
  const store = useLogSessionStore()
  const { data: profile } = useProfile()

  const [userId, setUserId] = useState<string | null>(null)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [showPhotoPaywall, setShowPhotoPaywall] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<FoodLookupResult | null>(null)
  const [isBarcodeSearching, setIsBarcodeSearching] = useState(false)
  const [isSavingBarcode, setIsSavingBarcode] = useState(false)

  // Estado Premium y control de fotos diarias
  const { isPremium, photoLogsToday, maxFreePhotos, canUsePhoto, incrementPhotoLog } = usePremiumStore()

  const today = getTodayIso()

  // Obtiene el usuario autenticado al montar el componente
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }

    fetchUser()
  }, [router])

  // Resetea el store al montar la página para empezar limpio
  useEffect(() => {
    store.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hook de mutación de la IA
  const aiLogMutation = useAiLog()

  // Manejador: el usuario seleccionó una foto y quiere analizarla
  function handlePhotoAnalyze(file: File) {
    if (!userId) return

    // Verificar límite de fotos antes de procesar — mostrar paywall si se excede
    if (!canUsePhoto()) {
      setShowPhotoPaywall(true)
      return
    }

    store.setPhotoFile(file, URL.createObjectURL(file))
    store.setStep('uploading')

    aiLogMutation.mutate(
      {
        method: 'photo',
        userId,
        mealType: store.mealType,
        logDate: today,
        photoFile: file,
        countryCode: profile?.country_code ?? 'ES',
      },
      {
        onSuccess: (data) => {
          // Incrementar el conteo de fotos del día tras un análisis exitoso
          incrementPhotoLog()
          store.setAiResult(data)
          store.setStep('confirming')
        },
        onError: (error) => {
          store.setError(error.message || 'Error al analizar la foto')
        },
      }
    )
  }

  // Manejador: el usuario quiere analizar el texto introducido
  function handleTextAnalyze() {
    if (!userId || !store.textInput.trim()) return

    store.setStep('analyzing')

    aiLogMutation.mutate(
      {
        method: 'text',
        userId,
        mealType: store.mealType,
        logDate: today,
        textPayload: store.textInput,
        countryCode: profile?.country_code ?? 'ES',
      },
      {
        onSuccess: (data) => {
          store.setAiResult(data)
          store.setStep('confirming')
        },
        onError: (error) => {
          store.setError(error.message || 'Error al analizar el texto')
        },
      }
    )
  }

  // Manejador: confirma el resultado de la IA y navega al dashboard
  function handleConfirm() {
    if (!store.aiResult) return
    store.setSavedKcal(Math.round(store.aiResult.totales.calorias))
    store.setStep('done')
  }

  // Manejador: descarta el resultado eliminando las entradas insertadas por la IA
  async function handleDiscard() {
    if (!store.aiResult?.log_entry_ids?.length) {
      store.reset()
      return
    }

    setIsDiscarding(true)
    try {
      const supabase = createClient()
      await supabase
        .from('food_log_entries')
        .delete()
        .in('id', store.aiResult.log_entry_ids)
    } catch {
      // Si falla el borrado, igualmente volvemos al estado inicial
    } finally {
      setIsDiscarding(false)
      store.reset()
    }
  }

  // Manejador: código de barras detectado — busca el producto en Open Food Facts
  async function handleBarcodeDetected(barcode: string) {
    setIsBarcodeSearching(true)
    try {
      const res = await fetch(`/api/food-lookup?barcode=${encodeURIComponent(barcode)}`)
      const data: FoodLookupResult = await res.json()
      if (data.found) {
        setBarcodeProduct(data)
      } else {
        store.setError('Producto no encontrado. Prueba con búsqueda manual.')
      }
    } catch {
      store.setError('Error al buscar el producto. Inténtalo de nuevo.')
    } finally {
      setIsBarcodeSearching(false)
    }
  }

  // Manejador: usuario confirma el producto escaneado con cantidad elegida
  async function handleBarcodeConfirm(product: FoodLookupResult, grams: number) {
    if (!userId) return
    setIsSavingBarcode(true)
    try {
      const ratio = grams / 100
      const supabase = createClient()
      const { error: insertError } = await supabase.from('food_log_entries').insert({
        user_id: userId,
        food_id: null,
        log_date: today,
        meal_type: store.mealType,
        logging_method: 'barcode',
        calories_kcal: Math.round(product.kcal_100g * ratio),
        protein_g: Math.round(product.protein_100g * ratio * 10) / 10,
        carbs_g: Math.round(product.carbs_100g * ratio * 10) / 10,
        fat_g: Math.round(product.fat_100g * ratio * 10) / 10,
        fiber_g: product.fiber_100g != null ? Math.round(product.fiber_100g * ratio * 10) / 10 : null,
        quantity_grams: grams,
        custom_description: product.brand ? `${product.name} (${product.brand})` : product.name,
        deleted_at: null,
      })
      if (insertError) throw new Error(insertError.message)
      store.setSavedKcal(Math.round(product.kcal_100g * ratio))
      store.setStep('done')
    } catch {
      store.setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setIsSavingBarcode(false)
    }
  }

  // Manejador: el usuario añadió un alimento manualmente con éxito
  function handleManualAdded(kcal: number) {
    store.setSavedKcal(kcal)
    store.setStep('done')
  }

  // Determina si estamos en un paso de análisis o carga
  const isAnalyzing =
    store.step === 'uploading' || store.step === 'analyzing'

  // Pantalla de éxito — ocupa toda la pantalla sin cabecera
  if (store.step === 'done') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <LogSuccess
            kcal={store.savedKcal}
            mealType={store.mealType}
            onLogAnother={() => store.reset()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 pb-12">
        {/* Cabecera con botón de volver */}
        <header className="flex items-center gap-3 py-4 sticky top-0 bg-stone-50 z-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="
              p-2.5 rounded-xl text-stone-500
              hover:bg-stone-100 transition-colors
              min-h-[44px] min-w-[44px] flex items-center justify-center
            "
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-stone-800">Registrar comida</h1>
        </header>

        <div className="flex flex-col gap-5">
          {/* Selector de tipo de comida — siempre visible (excepto análisis) */}
          {!isAnalyzing && store.step !== 'confirming' && (
            <MealTypeSelector
              value={store.mealType}
              onChange={store.setMealType}
            />
          )}

          {/* Selector de método — visible cuando el usuario aún no ha empezado a analizar */}
          {!isAnalyzing &&
            store.step !== 'confirming' &&
            store.method !== 'manual' &&
            !(store.method === 'barcode' && (barcodeProduct || isBarcodeSearching)) && (
              <LogMethodTabs
                active={store.method}
                onSelect={(m) => {
                  setBarcodeProduct(null)
                  if (m === 'photo') store.startPhotoCapture()
                  else if (m === 'text') store.startTextLog()
                  else if (m === 'barcode') store.startBarcodeCapture()
                  else store.startManualSearch()
                }}
              />
            )}

          {/* Zona dinámica según el paso y método actuales */}

          {/* Banner de límite de fotos — visible cuando el método es foto y el usuario es gratuito */}
          {store.method === 'photo' && !isPremium && (
            <PhotoLimitBanner
              photoLogsToday={photoLogsToday}
              maxFreePhotos={maxFreePhotos}
              onUpgrade={() => setShowPhotoPaywall(true)}
            />
          )}

          {/* Foto: captura */}
          {store.method === 'photo' && store.step === 'capturing' && (
            <PhotoCapture
              onAnalyze={handlePhotoAnalyze}
              isLoading={aiLogMutation.isPending}
            />
          )}

          {/* Texto: entrada libre */}
          {store.method === 'text' && store.step === 'capturing' && (
            <TextLogInput
              value={store.textInput}
              onChange={store.setTextInput}
              onAnalyze={handleTextAnalyze}
              isLoading={aiLogMutation.isPending}
            />
          )}

          {/* Manual: búsqueda en base de datos */}
          {store.method === 'manual' && userId && (
            <div className="flex flex-col gap-4">
              {/* Selector de tipo de comida siempre visible en manual */}
              <MealTypeSelector
                value={store.mealType}
                onChange={store.setMealType}
              />

              {/* Botón para cambiar de método */}
              <button
                onClick={() => store.reset()}
                className="
                  flex items-center gap-2 text-sm text-stone-500
                  hover:text-stone-700 transition-colors
                  min-h-[44px] w-fit
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar método
              </button>

              <ManualSearch
                mealType={store.mealType}
                logDate={today}
                userId={userId}
                onAdded={(kcal) => handleManualAdded(kcal)}
              />
            </div>
          )}

          {/* Spinner de análisis */}
          {isAnalyzing && store.method !== 'manual' && (
            <AnalyzingSpinner method={store.method as 'photo' | 'text'} />
          )}

          {/* Código de barras: escáner de cámara */}
          {store.method === 'barcode' && store.step === 'capturing' && !barcodeProduct && (
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              isSearching={isBarcodeSearching}
            />
          )}

          {/* Código de barras: confirmación de producto */}
          {store.method === 'barcode' && barcodeProduct && (
            <BarcodeConfirmCard
              product={barcodeProduct}
              onConfirm={handleBarcodeConfirm}
              onDiscard={() => { setBarcodeProduct(null); store.startBarcodeCapture() }}
              isSaving={isSavingBarcode}
            />
          )}

          {/* Confirmación del resultado de la IA */}
          {store.step === 'confirming' && store.aiResult && (
            <AiConfirmSheet
              result={store.aiResult}
              onConfirm={handleConfirm}
              onDiscard={handleDiscard}
              isDiscarding={isDiscarding}
            />
          )}

          {/* Tarjeta de error */}
          {store.step === 'error' && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <span className="text-amber-500 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Ha ocurrido un error
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {store.errorMessage ?? 'Error desconocido. Intenta de nuevo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => store.reset()}
                className="
                  w-full py-3 rounded-xl bg-amber-500 text-white
                  text-sm font-semibold
                  hover:bg-amber-600 transition-colors
                  min-h-[44px]
                "
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Placeholder de inicio: invita al usuario a seleccionar un método */}
          {store.step === 'idle' && store.method === null && (
            <div className="text-center py-12">
              <p className="text-stone-400 text-sm">
                Selecciona cómo quieres registrar tu comida
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de paywall para límite de fotos */}
      {showPhotoPaywall && (
        <PaywallModal
          isOpen={showPhotoPaywall}
          onClose={() => setShowPhotoPaywall(false)}
          trigger="photo_limit"
        />
      )}
    </div>
  )
}
