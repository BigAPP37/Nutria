// Términos y Condiciones de Nutria — accesible sin login
import Link from 'next/link'

export const metadata = {
  title: 'Términos y Condiciones — Nutria',
}

export default function TermsPage() {
  return (
    <div
      className="min-h-screen px-5 py-12"
      style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0D0D0D 55%)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Cabecera */}
        <div className="mb-10">
          <Link
            href="/onboarding"
            className="text-sm mb-6 inline-block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ← Volver
          </Link>
          <h1 className="text-3xl font-bold text-white">Términos y Condiciones</h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Última actualización: marzo de 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Identificación del titular</h2>
            <p>
              Nutria es un servicio de seguimiento nutricional operado bajo la marca <strong className="text-white">Nutria</strong>.
              Para consultas legales o de privacidad puedes contactarnos en{' '}
              <a href="mailto:hola@nutriapro.es" className="underline" style={{ color: '#F97316' }}>
                hola@nutriapro.es
              </a>.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Objeto del servicio</h2>
            <p>
              Nutria es una aplicación de seguimiento nutricional que permite a los usuarios registrar
              su alimentación, visualizar su progreso y recibir recomendaciones personalizadas generadas
              por inteligencia artificial. El servicio tiene carácter informativo y de apoyo al bienestar
              personal, y <strong className="text-white">no constituye asesoramiento médico o dietético profesional</strong>.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Condiciones de uso</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Debes tener al menos 13 años para usar Nutria.</li>
              <li>Eres responsable de la exactitud de los datos que introduces.</li>
              <li>Está prohibido el uso automatizado, scraping o acceso masivo a la plataforma.</li>
              <li>No puedes usar el servicio para actividades ilegales o que vulneren derechos de terceros.</li>
              <li>Nutria se reserva el derecho de suspender cuentas que incumplan estas condiciones.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Suscripción y cancelación</h2>
            <p className="mb-2">
              Nutria ofrece un período de prueba gratuito de <strong className="text-white">7 días</strong> sin
              necesidad de tarjeta de crédito. Transcurrido ese período, el acceso a las funcionalidades
              premium requiere una suscripción de pago.
            </p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Puedes cancelar tu suscripción en cualquier momento desde Ajustes → Suscripción.</li>
              <li>La cancelación es efectiva al final del período de facturación en curso.</li>
              <li>No se realizan reembolsos por períodos no utilizados, salvo lo dispuesto por la normativa aplicable.</li>
              <li>Los precios pueden cambiar con un preaviso de 30 días por email.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Limitación de responsabilidad</h2>
            <p>
              Nutria no garantiza la exactitud de los datos nutricionales generados por inteligencia
              artificial. Los valores calóricos y de macronutrientes son estimaciones. Ante cualquier
              condición de salud, trastorno alimentario o necesidad dietética específica, consulta con
              un profesional sanitario cualificado.
            </p>
            <p className="mt-2">
              En la máxima medida permitida por la ley, Nutria no será responsable de daños directos
              o indirectos derivados del uso del servicio.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Propiedad intelectual</h2>
            <p>
              Todo el contenido de Nutria (marca, diseño, código, textos, imágenes) es propiedad
              exclusiva de sus titulares y está protegido por la legislación española e internacional
              de propiedad intelectual e industrial.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Modificaciones</h2>
            <p>
              Podemos actualizar estos términos ocasionalmente. Te notificaremos los cambios relevantes
              por email o mediante un aviso en la aplicación. El uso continuado del servicio tras la
              notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se rigen por la legislación española. Para cualquier controversia, las partes
              se someten a los juzgados y tribunales competentes de España, sin perjuicio de los derechos
              que como consumidor puedas tener conforme a la normativa de tu lugar de residencia.
            </p>
          </section>

          {/* Footer */}
          <div
            className="pt-6 mt-6 flex flex-col gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Link href="/privacy" style={{ color: '#F97316' }} className="text-sm">
              Política de Privacidad →
            </Link>
            <Link href="/onboarding" style={{ color: 'rgba(255,255,255,0.35)' }} className="text-sm">
              Volver al inicio
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
