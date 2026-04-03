// Página de registro de nuevo usuario
import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Crear cuenta – Nutria',
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}
