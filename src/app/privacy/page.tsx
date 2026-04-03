// Política de Privacidad de Nutria — accesible sin login
import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidad — Nutria',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white">Política de Privacidad</h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Última actualización: marzo de 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de tus datos personales es <strong className="text-white">Nutria</strong>.
              Puedes contactarnos para cualquier cuestión relacionada con la privacidad en:{' '}
              <a href="mailto:privacidad@nutriapro.es" className="underline" style={{ color: '#F97316' }}>
                privacidad@nutriapro.es
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Datos que recogemos y para qué</h2>
            <div className="space-y-3">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="font-medium text-white mb-1">Datos de cuenta</p>
                <p>Email y contraseña (cifrada). Finalidad: identificarte y proteger tu cuenta.</p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="font-medium text-white mb-1">Datos de perfil y salud</p>
                <p>
                  Edad, sexo biológico, peso, altura, objetivo nutricional y nivel de actividad física.
                  Finalidad: calcular tus objetivos calóricos y personalizar la experiencia.
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="font-medium text-white mb-1">Registros de alimentación</p>
                <p>
                  Alimentos registrados, cantidades, horarios y notas opcionales.
                  Finalidad: mostrarte tu progreso y generar recomendaciones.
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="font-medium text-white mb-1">Datos de uso</p>
                <p>
                  Interacciones con la app (pantallas visitadas, funciones usadas).
                  Finalidad: mejorar el servicio y detectar errores.
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}
              >
                <p className="font-medium text-white mb-1">Datos de salud sensibles (opcionales)</p>
                <p>
                  Información sobre relación con la alimentación y posibles trastornos del comportamiento
                  alimentario (TCA). Esta información es completamente voluntaria y se usa exclusivamente
                  para adaptar la experiencia de forma más segura y respetuosa.
                </p>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Base legal del tratamiento</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-white">Ejecución de contrato:</strong> para prestarte el servicio de seguimiento nutricional.</li>
              <li><strong className="text-white">Consentimiento explícito:</strong> para el tratamiento de datos de salud sensibles.</li>
              <li><strong className="text-white">Interés legítimo:</strong> para la mejora del servicio y prevención del fraude.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Plazo de conservación</h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa en Nutria. Si eliminas tu
              cuenta, procederemos a la supresión o anonimización de tus datos en un plazo máximo de
              <strong className="text-white"> 30 días</strong>, salvo obligación legal de conservación.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Tus derechos</h2>
            <p className="mb-3">
              En virtud del RGPD y la LOPDGDD, tienes derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-white">Acceso:</strong> saber qué datos tenemos sobre ti.</li>
              <li><strong className="text-white">Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong className="text-white">Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus datos.</li>
              <li><strong className="text-white">Portabilidad:</strong> recibir tus datos en un formato estructurado y legible.</li>
              <li><strong className="text-white">Oposición y limitación:</strong> oponerte a ciertos tratamientos.</li>
              <li><strong className="text-white">Retirada del consentimiento:</strong> en cualquier momento, sin que afecte al tratamiento previo.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Cómo ejercer tus derechos</h2>
            <p>
              Envía un email a{' '}
              <a href="mailto:privacidad@nutriapro.es" className="underline" style={{ color: '#F97316' }}>
                privacidad@nutriapro.es
              </a>{' '}
              indicando el derecho que deseas ejercer y adjuntando una copia de tu documento de identidad.
              Responderemos en un plazo máximo de <strong className="text-white">30 días</strong>.
            </p>
            <p className="mt-2">
              También puedes presentar una reclamación ante la{' '}
              <strong className="text-white">Agencia Española de Protección de Datos (AEPD)</strong> en{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#F97316' }}>
                www.aepd.es
              </a>.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Transferencias internacionales</h2>
            <p>
              Nutria utiliza los siguientes proveedores para operar el servicio:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Supabase</strong> — base de datos e infraestructura.
                Datos almacenados en la región EU (Frankfurt). Cumple con el RGPD.
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — hosting y edge network.
                Cumple con el RGPD mediante las cláusulas contractuales estándar de la UE.
              </li>
              <li>
                <strong className="text-white">Stripe</strong> — procesamiento de pagos.
                Certificado PCI-DSS. Datos de pago nunca almacenados en nuestros servidores.
              </li>
            </ul>
            <p className="mt-3">
              No vendemos ni cedemos tus datos a terceros para fines publicitarios o de marketing.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Cookies y almacenamiento local</h2>
            <p>
              Nutria utiliza cookies de sesión estrictamente necesarias para la autenticación.
              También usamos <strong className="text-white">localStorage</strong> para guardar temporalmente
              el progreso del proceso de registro (onboarding), que se elimina automáticamente al completarlo.
              No usamos cookies de rastreo publicitario.
            </p>
          </section>

          {/* Footer */}
          <div
            className="pt-6 mt-6 flex flex-col gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Link href="/terms" style={{ color: '#F97316' }} className="text-sm">
              Términos y Condiciones →
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
