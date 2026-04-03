// Página de inicio de sesión
import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión – Nutria',
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
