'use client'

import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  ExternalLink,
  LogOut,
  RefreshCw,
  Scale,
  Target,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useTdeeState } from '@/hooks/useTdeeState'
import type { UserProfile } from '@/types/database'
import { usePremiumStatus } from '@/hooks/usePremiumStatus'
import { usePremiumStore } from '@/stores/premiumStore'
import { PremiumSettingsCard } from '@/components/premium/PremiumSettingsCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AppHero, AppPage, AppSectionHeader } from '@/components/ui/AppPage'

const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  lose_weight: 'Perder peso',
  maintain: 'Mantener peso',
  gain_muscle: 'Ganar músculo',
}

const ACTIVITY_LABELS: Record<UserProfile['activity_level'], string> = {
  sedentary: 'Sedentario',
  lightly_active: 'Ligeramente activo',
  moderately_active: 'Moderadamente activo',
  very_active: 'Muy activo',
  extra_active: 'Extremadamente activo',
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <AppSectionHeader title={title} description={description} />
      <div className="app-panel mt-3 overflow-hidden rounded-[1.6rem]">{children}</div>
    </section>
  )
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string
  value?: string | null
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="text-sm text-[var(--ink-2)]">{label}</span>
      <div className="flex items-center gap-2">
        {value ? <span className="text-sm text-[var(--ink-3)]">{value}</span> : null}
        {onClick ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--ink-3)]" /> : null}
      </div>
    </>
  )

  if (!onClick) {
    return <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3.5 last:border-0">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-[var(--line-soft)] px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-[var(--surface-2)] active:bg-[var(--surface-1)]"
    >
      {content}
    </button>
  )
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3.5 transition-colors last:border-0 hover:bg-[var(--surface-2)]"
    >
      <span className="text-sm text-[var(--ink-2)]">{label}</span>
      <ExternalLink className="h-4 w-4 text-[var(--ink-3)]" />
    </Link>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [isSavingWeight, setIsSavingWeight] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState('2000')
  const [proteinGoal, setProteinGoal] = useState('150')
  const [carbsGoal, setCarbsGoal] = useState('250')
  const [fatGoal, setFatGoal] = useState('65')
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [isRedoingOnboarding, setIsRedoingOnboarding] = useState(false)
  const [redoOnboardingError, setRedoOnboardingError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const avatarSrc = useMemo(
    () => avatarPreviewUrl ?? profile?.avatar_url ?? null,
    [avatarPreviewUrl, profile?.avatar_url]
  )

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setEmail(user.email ?? null)
    })
  }, [router])

  const { data: tdeeState } = useTdeeState(userId)

  useEffect(() => {
    if (!tdeeState) return
    setCalorieGoal(String(tdeeState.goal_kcal))
    setProteinGoal(String(tdeeState.macro_targets.protein_g))
    setCarbsGoal(String(tdeeState.macro_targets.carbs_g))
    setFatGoal(String(tdeeState.macro_targets.fat_g))
  }, [tdeeState])

  const { data: premiumData } = usePremiumStatus(userId)
  const { isPremium } = usePremiumStore()

  async function handleRedoOnboarding() {
    if (isRedoingOnboarding) return

    setRedoOnboardingError(null)
    setIsRedoingOnboarding(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        setRedoOnboardingError('No pudimos reiniciar el onboarding. Inténtalo de nuevo.')
        return
      }

      useOnboardingStore.getState().reset()
      router.push('/onboarding')
      router.refresh()
    } finally {
      setIsRedoingOnboarding(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function getAvatarStoragePath(url: string | null | undefined): string | null {
    if (!url) return null

    const marker = '/storage/v1/object/public/avatars/'
    const index = url.indexOf(marker)
    if (index === -1) return null

    return url.slice(index + marker.length)
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !userId) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Selecciona una imagen válida.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('La imagen debe pesar menos de 5 MB.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setAvatarError(null)
    setAvatarPreviewUrl((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return previewUrl
    })
    setIsUploadingAvatar(true)

    try {
      const supabase = createClient()
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeExt = extension === 'png' || extension === 'webp' || extension === 'gif' ? extension : 'jpg'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`
      const previousAvatarPath = getAvatarStoragePath(profile?.avatar_url)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        await supabase.storage.from('avatars').remove([path])
        throw updateError
      }

      if (previousAvatarPath) {
        await supabase.storage.from('avatars').remove([previousAvatarPath])
      }

      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      setAvatarPreviewUrl(null)
    } catch (error) {
      setAvatarError('No pudimos subir la imagen. Inténtalo otra vez.')
      console.error('[settings] Error subiendo avatar:', error)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    if (!userId || !profile?.avatar_url || isRemovingAvatar) return

    setAvatarError(null)
    setIsRemovingAvatar(true)

    try {
      const supabase = createClient()
      const previousAvatarPath = getAvatarStoragePath(profile.avatar_url)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      if (previousAvatarPath) {
        await supabase.storage.from('avatars').remove([previousAvatarPath])
      }

      setAvatarPreviewUrl(null)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (error) {
      setAvatarError('No pudimos eliminar la imagen. Inténtalo otra vez.')
      console.error('[settings] Error eliminando avatar:', error)
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  async function handleSaveWeight() {
    const useLb = profile?.unit_weight === 'lb'
    const value = parseFloat(weightInput)

    if (useLb) {
      if (!value || value < 44 || value > 660) {
        setWeightError('Introduce un peso válido (44–660 lb)')
        return
      }
    } else if (!value || value < 20 || value > 300) {
      setWeightError('Introduce un peso válido (20–300 kg)')
      return
    }

    if (!userId) return

    const weightKg = useLb ? value * 0.453592 : value

    setWeightError(null)
    setIsSavingWeight(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('weight_entries').insert({
        user_id: userId,
        weight_kg: Math.round(weightKg * 100) / 100,
        recorded_at: new Date().toISOString(),
        notes: null,
      })

      if (error) {
        setWeightError('Error al guardar. Intenta de nuevo.')
        return
      }

      const { error: tdeeUpdateError } = await supabase.functions.invoke('tdee-update', {
        body: { user_id: userId },
      })

      if (tdeeUpdateError) {
        console.error('[settings] Error recalculando TDEE tras registrar peso:', tdeeUpdateError)
      }

      await queryClient.invalidateQueries({ queryKey: ['tdeeState', userId] })
      setShowWeightModal(false)
      setWeightInput('')
    } finally {
      setIsSavingWeight(false)
    }
  }

  async function handleSaveGoals() {
    if (!userId) return

    setIsSavingGoals(true)
    try {
      const supabase = createClient()
      await supabase.from('user_tdee_state').upsert(
        {
          user_id: userId,
          goal_kcal: parseInt(calorieGoal, 10),
          macro_protein_g: parseInt(proteinGoal, 10),
          macro_carbs_g: parseInt(carbsGoal, 10),
          macro_fat_g: parseInt(fatGoal, 10),
        },
        { onConflict: 'user_id' }
      )
      await queryClient.invalidateQueries({ queryKey: ['tdeeState', userId] })
      setShowGoalsModal(false)
    } finally {
      setIsSavingGoals(false)
    }
  }

  return (
    <AppPage>
      <AppHero
        eyebrow="Cuenta"
        title="Ajustes con el mismo tono que el resto del producto."
        description="Perfil, objetivos, suscripción y acciones de cuenta sin cambiar de lenguaje visual."
        action={
          <Link
            href="/dashboard"
            className="glass-pill flex h-10 w-10 items-center justify-center rounded-2xl text-white/90"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      >
        <div className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/82">
          <span className="h-2 w-2 rounded-full bg-white/80" />
          Configuración personal y seguimiento
        </div>
      </AppHero>

      <main className="space-y-5">
        {userId ? (
          <section>
            <AppSectionHeader title="Suscripción" description="Estado del plan y acceso premium." />
            <div className="mt-3">
              <PremiumSettingsCard
                isPremium={isPremium}
                premiumExpiresAt={premiumData?.premiumExpiresAt ?? null}
                subscriptionStatus={premiumData?.subscriptionStatus ?? 'free'}
              />
            </div>
          </section>
        ) : null}

        <Section title="Perfil" description="Datos base que Nutria usa para personalizar recomendaciones.">
          <div className="border-b border-[var(--line-soft)] px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] bg-[var(--surface-2)]">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt="Foto de perfil"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold uppercase text-[var(--ink-2)]">
                    {(profile?.display_name || email || 'N').slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink-1)]">Foto de perfil</p>
                <p className="mt-1 text-xs text-[var(--ink-3)]">
                  Sube una imagen cuadrada o vertical. Máximo 5 MB.
                </p>
                {avatarError ? (
                  <p className="mt-2 text-xs text-amber-600">{avatarError}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <Button
                type="button"
                variant="outline"
                fullWidth={false}
                isLoading={isUploadingAvatar}
                disabled={isUploadingAvatar || isRemovingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                <span className="inline-flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {profile?.avatar_url ? 'Cambiar foto' : 'Subir foto'}
                </span>
              </Button>
              {profile?.avatar_url || avatarPreviewUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth={false}
                  isLoading={isRemovingAvatar}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  onClick={handleRemoveAvatar}
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </span>
                </Button>
              ) : null}
            </div>
          </div>
          <Row label="Nombre" value={profile?.display_name ?? '—'} />
          <Row label="Email" value={email ?? '—'} />
          <Row label="Objetivo" value={profile?.goal ? GOAL_LABELS[profile.goal] : '—'} />
          <Row
            label="Actividad"
            value={profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level] : '—'}
          />
        </Section>

        <Section title="Seguimiento" description="Acciones que cambian tu base de progreso y objetivos.">
          <Row
            label="Registrar peso"
            onClick={() => {
              setWeightInput('')
              setWeightError(null)
              setShowWeightModal(true)
            }}
          />
          <Row
            label="Editar objetivos calóricos"
            onClick={() => setShowGoalsModal(true)}
          />
        </Section>

        <Section title="Cuenta" description="Acciones de navegación y sesión.">
          <button
            type="button"
            onClick={handleRedoOnboarding}
            disabled={isRedoingOnboarding}
            className="flex w-full items-center gap-3 border-b border-[var(--line-soft)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)] active:bg-[var(--surface-1)]"
          >
            <RefreshCw className="h-4 w-4 text-[var(--ink-3)]" />
            <span className="text-sm font-medium text-[var(--ink-2)]">
              {isRedoingOnboarding ? 'Reiniciando...' : 'Rehacer onboarding'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)] active:bg-[var(--surface-1)]"
          >
            <LogOut className="h-4 w-4 text-[var(--ink-3)]" />
            <span className="text-sm font-medium text-[var(--ink-2)]">Cerrar sesión</span>
          </button>
          {redoOnboardingError ? (
            <div className="border-t border-[var(--line-soft)] px-4 py-3">
              <p className="text-sm text-amber-600">{redoOnboardingError}</p>
            </div>
          ) : null}
        </Section>

        <Section title="Legal" description="Documentación pública y condiciones de uso.">
          <LegalLink href="/privacy" label="Política de privacidad" />
          <LegalLink href="/terms" label="Términos de uso" />
        </Section>

        <p className="pb-4 text-center text-[11px] text-[var(--ink-3)]/70">Nutria v1.0</p>
      </main>

      {showWeightModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWeightModal(false)
          }}
        >
          <div className="app-card w-full max-w-md rounded-t-[2rem] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-1)]">
                <Scale className="h-5 w-5 text-[var(--ink-2)]" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--ink-1)]">Registrar peso</p>
                <p className="text-xs text-[var(--ink-3)]">Se guarda con la fecha y hora actual</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                autoFocus
                type="number"
                min={profile?.unit_weight === 'lb' ? '44' : '20'}
                max={profile?.unit_weight === 'lb' ? '660' : '300'}
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={profile?.unit_weight === 'lb' ? '155' : '70.5'}
                className="text-center text-2xl font-bold"
                suffix={
                  <span className="pointer-events-none text-sm text-[var(--ink-3)]">
                    {profile?.unit_weight === 'lb' ? 'lb' : 'kg'}
                  </span>
                }
              />

              {weightError ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {weightError}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowWeightModal(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  fullWidth
                  isLoading={isSavingWeight}
                  disabled={!weightInput.trim() || isSavingWeight}
                  onClick={handleSaveWeight}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showGoalsModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGoalsModal(false)
          }}
        >
          <div className="app-card w-full max-w-md rounded-t-[2rem] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(201,106,43,0.1)]">
                <Target className="h-5 w-5 text-[var(--color-primary-500)]" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--ink-1)]">Objetivos diarios</p>
                <p className="text-xs text-[var(--ink-3)]">Ajusta tus metas de nutrición</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Calorías (kcal)', value: calorieGoal, onChange: setCalorieGoal },
                { label: 'Proteína (g)', value: proteinGoal, onChange: setProteinGoal },
                { label: 'Carbohidratos (g)', value: carbsGoal, onChange: setCarbsGoal },
                { label: 'Grasa (g)', value: fatGoal, onChange: setFatGoal },
              ].map((field) => (
                <Input
                  key={field.label}
                  type="number"
                  min="0"
                  label={field.label}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowGoalsModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                fullWidth
                isLoading={isSavingGoals}
                disabled={isSavingGoals}
                onClick={handleSaveGoals}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showLogoutConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(13,13,13,0.72)]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogoutConfirm(false)
          }}
        >
          <div
            className="w-full max-w-md rounded-t-[2rem] border border-[rgba(249,115,22,0.14)] px-6 pb-6 pt-5 shadow-[0_-18px_48px_rgba(0,0,0,0.42)]"
            style={{
              background: 'linear-gradient(180deg, rgba(28,25,23,0.98) 0%, rgba(13,13,13,0.98) 100%)',
              paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
            }}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/8">
                <LogOut className="h-5 w-5 text-[#F97316]" />
              </div>
              <div>
                <p className="text-base font-bold text-white">¿Seguro que quieres cerrar sesión?</p>
                <p className="mt-1 text-sm leading-6 text-white/64">
                  Volverás a la pantalla de acceso y tendrás que iniciar sesión de nuevo para seguir.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowLogoutConfirm(false)}
                className="border-white/14 bg-white/6 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                fullWidth
                onClick={async () => {
                  setShowLogoutConfirm(false)
                  await handleLogout()
                }}
                className="bg-[linear-gradient(135deg,#F97316_0%,#EA6C0A_100%)] text-white shadow-[0_14px_32px_rgba(249,115,22,0.28)]"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPage>
  )
}
