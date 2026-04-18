# Auditoría UX — Bloque 3

## [CRÍTICO] - El onboarding no sobrevive a un cierre real del navegador
- **Pantalla:** `/onboarding` y `src/stores/onboardingStore.ts`
- **Problema:** El onboarding persiste en `sessionStorage`, no en una capa duradera. Si el usuario refresca la misma pestaña, normalmente conserva el estado; si cierra la pestaña, cambia de navegador o vuelve más tarde desde cero, pierde todo lo rellenado.
- **Impacto en UX:** Sensación de trabajo perdido y castigo por interrumpir el flujo. En un onboarding largo, esto eleva mucho el abandono.
- **Fix:** Persistir el borrador en `localStorage` o en Supabase por usuario anónimo/autenticado; añadir recuperación explícita con “Continuar donde lo dejaste”.
- **Referencia visual:** Ahora el usuario vuelve al paso inicial; debería volver al último paso válido con sus respuestas intactas.

---

## [CRÍTICO] - El cierre del onboarding usa urgencia artificial y presión innecesaria
- **Pantalla:** `register` dentro de `/onboarding`
- **Problema:** La pantalla final muestra “Tu plan expira en” con una cuenta atrás de 10 minutos y un anillo visual de urgencia. No responde a una restricción real del producto; es presión comercial dentro de un flujo de confianza.
- **Impacto en UX:** Genera desconfianza, sensación de manipulación y tono de venta agresiva justo antes de pedir registro.
- **Fix:** Eliminar la cuenta atrás y sustituirla por un cierre honesto: “Tu plan está listo. Guarda tu cuenta para conservarlo”.
- **Referencia visual:** Ahora parece una oferta que caduca; debería sentirse como una confirmación tranquila de que el plan ya existe y solo falta guardarlo.

---

## [ALTO] - Falta Apple OAuth aunque el flujo y el briefing lo presuponen
- **Pantalla:** `/onboarding`, `/login`, `/register`
- **Problema:** Solo existe `signInWithOAuth({ provider: 'google' })`. No hay flujo Apple en onboarding ni en auth, pese a que el producto se plantea como app móvil y el usuario espera opciones nativas.
- **Impacto en UX:** Fricción innecesaria en iPhone y pérdida de confianza por expectativa incumplida.
- **Fix:** Implementar Apple Sign In o retirar toda expectativa de soporte Apple del producto/copy hasta que exista de verdad.
- **Referencia visual:** Ahora el usuario solo ve Google o email; debería ver Google y Apple en móvil iOS, con el mismo nivel visual y funcional.

---

## [ALTO] - El onboarding mezcla demasiadas pantallas educativas antes de entregar valor
- **Pantalla:** `/onboarding` en los pasos `education-restrictive-diets`, `diet-feedback`, `education-normal`, `education-environment`
- **Problema:** Hay varias pausas pedagógicas que frenan el avance sin desbloquear nada nuevo para el usuario. En especial en pérdida de peso, el flujo se alarga mucho antes de llegar al momento “esto ya es mío”.
- **Impacto en UX:** Fatiga, sensación de sermón y caída de ritmo. Para un usuario de 30-45 que quiere “empezar ya”, el flujo se siente más largo de lo necesario.
- **Fix:** Reducir a una sola pantalla educativa fuerte antes del registro, y mover el resto a tips posteriores o a onboarding progresivo dentro del dashboard.
- **Referencia visual:** Ahora el progreso avanza poco mientras el usuario sigue leyendo bloques explicativos; debería avanzar con mayor sensación de logro por pantalla.

---

## [ALTO] - El producto tiene dos flujos distintos para “registrar comida”
- **Pantalla:** `/log` y `/dashboard/add`
- **Problema:** El bottom nav “Registrar” lleva a `/log`, que ofrece foto, texto, manual y código de barras. En cambio, el botón “+” dentro del dashboard lleva a `/dashboard/add`, que es otro flujo distinto, centrado en búsqueda/manual. La app enseña dos maneras diferentes de hacer la misma tarea principal.
- **Impacto en UX:** Confusión mental, aprendizaje duplicado y sensación de producto no unificado.
- **Fix:** Unificar en un solo flujo de registro con una sola arquitectura y una sola jerarquía visual. El acceso desde dashboard debe abrir el mismo flujo, preseleccionando la comida.
- **Referencia visual:** Ahora el usuario aprende dos interfaces para la misma acción; debería ver la misma experiencia siempre, con contexto distinto según desde dónde entra.

---

## [ALTO] - El CTA principal del dashboard está diluido
- **Pantalla:** `/dashboard`
- **Problema:** La acción clave de la app está repartida entre el botón central del bottom nav, los “+” pequeños de cada comida y el botón “Registrar con texto”. No hay un único patrón dominante.
- **Impacto en UX:** Reduce claridad y obliga al usuario nuevo a decidir primero “cómo se supone que aquí se registra”.
- **Fix:** Elegir un CTA primario único en dashboard. Recomendación: mantener el botón central del bottom nav como acción maestra y convertir los “+” por comida en accesos secundarios claramente subordinados.
- **Referencia visual:** Ahora hay tres puertas distintas con pesos parecidos; debería existir una entrada obvia y el resto ser atajos contextuales.

---

## [ALTO] - La base visible de alimentos hispanos se queda corta para uso diario real
- **Pantalla:** `/log`, `/dashboard/add`, `supabase/seeds/foods.sql`
- **Problema:** El seed visible del repositorio contiene 20 alimentos base, no un catálogo amplio. Faltan referencias muy obvias para un usuario español medio como gazpacho o paella, y el producto promete una experiencia más madura.
- **Impacto en UX:** Búsquedas pobres, sensación de catálogo “de demo” y caída de confianza al segundo o tercer uso.
- **Fix:** Llevar el catálogo mínimo a varios cientos de alimentos españoles comunes, con sinónimos, marcas frecuentes y platos compuestos típicos.
- **Referencia visual:** Ahora el usuario puede encontrar básicos sueltos; debería encontrar también platos cotidianos y variantes comunes sin cambiar de método.

---

## [ALTO] - La búsqueda manual en `/dashboard/add` no diferencia error real de ausencia de resultados
- **Pantalla:** `/dashboard/add`
- **Problema:** La búsqueda hace `supabase.from('foods').ilike(...)` sin exponer error de consulta al usuario. Si falla la red o Supabase, la experiencia se parece demasiado a “no hay resultados”.
- **Impacto en UX:** Confusión y pérdida de tiempo. El usuario prueba más términos cuando el problema no es su búsqueda sino el sistema.
- **Fix:** Añadir estado explícito de error/reintento separado del estado “sin resultados”.
- **Referencia visual:** Ahora el usuario acaba en vacío o spinner; debería ver “No pudimos buscar ahora mismo. Reintentar”.

---

## [MEDIO] - La pantalla de Log tiene exceso de aire y baja densidad útil
- **Pantalla:** `/log`
- **Problema:** El hero superior ocupa mucho espacio para una tarea transaccional. Entre cabecera, explicación, selector de comida, tabs y banners, la primera acción útil queda demasiado abajo, especialmente en pantallas pequeñas.
- **Impacto en UX:** Sensación de lentitud y de que la app “habla demasiado” antes de dejar registrar.
- **Fix:** Comprimir hero y copy, reducir padding vertical y llevar el método activo más arriba. En móvil, esta pantalla debe sentirse operativa, no promocional.
- **Referencia visual:** Ahora se ve mucha cabecera y poco trabajo real; debería abrir con comida + método + input casi a primera vista.

---

## [MEDIO] - El flujo manual requiere demasiados taps para la acción más común
- **Pantalla:** `/dashboard` → `/dashboard/add` y `/log`
- **Problema:** Registrar manualmente obliga a varios pasos: entrar, elegir comida, elegir método o buscar, seleccionar alimento, ajustar gramos y confirmar. En muchos casos se mueve entre 5 y 7 taps antes de guardar.
- **Impacto en UX:** Fricción acumulada en la tarea más repetida del producto.
- **Fix:** Permitir quick add desde dashboard con recientes/favoritos, porciones rápidas y reuso de la última comida del mismo bloque horario.
- **Referencia visual:** Ahora el usuario hace navegación + decisión + porción antes de cerrar; debería poder repetir una comida frecuente en 2-3 taps.

---

## [MEDIO] - El feedback de guardado es inconsistente según el flujo
- **Pantalla:** `/log` y `/dashboard/add`
- **Problema:** En `/log` existe una pantalla de éxito dedicada. En `/dashboard/add` el guardado devuelve al dashboard sin una confirmación visible equivalente.
- **Impacto en UX:** El usuario no construye una expectativa clara de “qué pasa cuando guardo”.
- **Fix:** Unificar el patrón de feedback: toast persistente breve o retorno con highlight de la comida recién añadida.
- **Referencia visual:** Ahora un flujo celebra y otro teletransporta; debería haber una confirmación coherente en todos los caminos.

---

## [ALTO] - Stats repite el candado premium 3 veces y bloquea casi toda la página útil
- **Pantalla:** `/stats`
- **Problema:** El overlay `StatsPaywallOverlay` se monta 3 veces: sobre peso, calorías semanales y macros. El usuario free ve tres bloques grandes difuminados con el mismo candado y CTA.
- **Impacto en UX:** Sensación de muro, repetición visual cansina y lectura de “esta pantalla no es para mí”.
- **Fix:** Consolidar el bloqueo en un solo módulo premium o permitir una vista resumida de cada bloque con CTA único al final.
- **Referencia visual:** Ahora se ven 3 candados/overlays casi idénticos; debería haber una sola propuesta premium clara o previews parciales útiles.

---

## [ALTO] - La pantalla de estadísticas incumple la regla de copy y muestra jerga técnica
- **Pantalla:** `/stats`, `TdeeCard`, `MacroAverages`, `TdeeAdjustmentCard`
- **Problema:** El producto muestra conceptos internos como objetivo calórico, macros, TDEE y ajuste de TDEE. Eso contradice la regla editorial de no exponer estos términos al usuario.
- **Impacto en UX:** Hace la app más fría, técnica y menos comprensible para un usuario no experto.
- **Fix:** Reescribir la capa de copy visible: “energía diaria”, “equilibrio de comidas”, “tu referencia”, “ajuste sugerido”, etc.
- **Referencia visual:** Ahora la pantalla parece una herramienta de nutrición avanzada; debería sentirse como un panel claro y acompañante.

---

## [MEDIO] - La recompensa en Stats llega demasiado tarde para usuarios nuevos
- **Pantalla:** `/stats`
- **Problema:** Peso exige 3 registros para enseñar tendencia y calorías semanales exige 2 semanas válidas. Para un usuario nuevo, gran parte de la pantalla queda bloqueada o vacía durante demasiado tiempo.
- **Impacto en UX:** Sensación de producto “vacío” tras el esfuerzo inicial.
- **Fix:** Mostrar micro-recompensas tempranas: primer peso, primera semana parcial, progreso de constancia y “qué desbloqueas al seguir 3 días más”.
- **Referencia visual:** Ahora el vacío domina la pantalla; debería existir progreso parcial visible desde el primer o segundo uso.

---

## [MEDIO] - La separación free vs premium es demasiado brusca y poco elegante
- **Pantalla:** `/stats`, `/plans`, `PremiumSettingsCard`
- **Problema:** La app mezcla previews útiles en planes con bloqueos duros en stats. No hay una lógica uniforme de “te dejo ver un poco, pero no todo”.
- **Impacto en UX:** El usuario no entiende dónde acaba el producto gratuito y dónde empieza el premium.
- **Fix:** Definir una política consistente: preview parcial siempre, o bloqueo duro siempre, pero no según pantalla.
- **Referencia visual:** Ahora premium cambia de tono según módulo; debería seguir una gramática única.

---

## [ALTO] - Settings expone controles internos que rompen el tono del producto
- **Pantalla:** `/settings`
- **Problema:** “Editar objetivos calóricos” abre un modal con calorías, proteína, carbohidratos y grasa. Eso vuelve a exponer el modelo interno y rompe la promesa de simplicidad.
- **Impacto en UX:** Sensación de producto menos humano y más de hoja de cálculo.
- **Fix:** Reemplazar por un lenguaje de objetivos de día: “Más energía”, “Más ligereza”, “Más saciedad”, o esconderlo en un modo avanzado explícito.
- **Referencia visual:** Ahora parece un panel técnico de configuración; debería sentirse como ajustes personales comprensibles.

---

## [MEDIO] - El logout no tiene confirmación ni cierre emocional limpio
- **Pantalla:** `/settings`
- **Problema:** `Cerrar sesión` ejecuta logout inmediato. No hay confirmación ni mensaje final, y en móvil es fácil pulsarlo por error.
- **Impacto en UX:** Frustración, pérdida de contexto y sensación de acción brusca.
- **Fix:** Añadir confirmación ligera tipo bottom sheet con “Cancelar / Cerrar sesión”.
- **Referencia visual:** Ahora es un botón simple; debería ser una acción confirmada.

---

## [BAJO] - Los enlaces legales abren nueva pestaña aunque son páginas internas
- **Pantalla:** `/settings`
- **Problema:** `LegalLink` usa `<a target="_blank">` para `/privacy` y `/terms`, que son rutas internas. En móvil/PWA rompe continuidad y genera sensación de salida del flujo principal.
- **Impacto en UX:** Pequeña desorientación y peor sensación de app nativa.
- **Fix:** Usar navegación interna normal con `Link`, salvo que realmente se quiera abrir un recurso externo.
- **Referencia visual:** Ahora parece que vas a salir de la app; debería sentirse como una pantalla más del producto.

---

## [ALTO] - El modo oscuro no está implementado de forma sistémica
- **Pantalla:** toda la app
- **Problema:** El briefing pide verificar un dark theme con `#0D0D0D` y naranja `#F97316`, pero la app real está construida sobre superficies claras (`--surface-0`, `white`, `#FAFAF9`) y solo algunas pantallas sueltas usan fondo oscuro.
- **Impacto en UX:** Sensación de sistema visual inconsistente y de requisito incumplido.
- **Fix:** O bien declarar que el producto es light-first y retirar el requisito, o bien implementar tokens de dark mode de verdad y aplicarlos a todo el sistema.
- **Referencia visual:** Ahora onboarding/legal usan negro y el resto es crema/blanco; debería existir una sola lógica de tema.

---

## [MEDIO] - La regla “nunca rojo” está rota en errores visibles
- **Pantalla:** `/settings`, `/plans/[planId]`
- **Problema:** Se usan `text-red-600` y errores rojos en avatar, rehacer onboarding y activación de plan. Esto contradice la guía visual explícita.
- **Impacto en UX:** Ruido visual y pérdida de consistencia de marca.
- **Fix:** Sustituir rojo por una escala cálida/ámbar propia del sistema, manteniendo contraste y claridad sin romper el lenguaje visual.
- **Referencia visual:** Ahora el error cambia abruptamente de color respecto al resto de Nutria; debería seguir la misma paleta cálida.

---

## [ALTO] - No existe tratamiento UX real del estado offline
- **Pantalla:** toda la app
- **Problema:** No hay listeners de conectividad, banners offline, colas ni mensajes específicos. Si falla Supabase o la red, la mayoría de pantallas simplemente muestran error genérico, vacío o spinner.
- **Impacto en UX:** El usuario no entiende si el problema es suyo, de cobertura o de la app.
- **Fix:** Añadir estado offline transversal con banner persistente, botones de reintento y degradación funcional clara.
- **Referencia visual:** Ahora “parece roto”; debería leerse “sin conexión, algunos datos pueden no actualizarse”.

---

## [MEDIO] - Varias pantallas cargan con spinner aislado en lugar de skeleton contextual
- **Pantalla:** `/plans`, `/plans/[planId]`, partes de `/stats`
- **Problema:** Algunas vistas usan solo spinner centrado y otras skeletons útiles. La experiencia de carga no tiene un patrón consistente.
- **Impacto en UX:** La percepción de calidad fluctúa y algunas esperas se sienten más largas de lo necesario.
- **Fix:** Estandarizar skeletons por pantalla en móvil: hero, tarjetas y listas con espacio reservado.
- **Referencia visual:** Ahora unas pantallas “desaparecen” mientras cargan y otras no; debería mantenerse siempre la estructura visual.

---

## [MEDIO] - El dashboard nuevo tiene buen tono, pero el empty state todavía guía poco
- **Pantalla:** `/dashboard`
- **Problema:** Cuando no hay comidas, la pantalla muestra secciones vacías ordenadas, pero no hay un módulo central de “primer paso” que enseñe claramente qué hacer primero y por qué.
- **Impacto en UX:** El usuario nuevo entiende que está vacío, pero no necesariamente qué acción conviene tomar antes.
- **Fix:** Añadir un empty state principal encima de las comidas con CTA único: “Registra tu primer desayuno” o “Haz una foto de tu comida”.
- **Referencia visual:** Ahora ves tarjetas y bloques sin contenido; debería existir una invitación principal y concreta.

---

## [MEDIO] - Planes de comida comunica mejor que Stats, pero sigue usando un lenguaje demasiado funcional
- **Pantalla:** `/plans`, `/plans/[planId]`
- **Problema:** El módulo de planes funciona razonablemente bien, pero sigue apoyándose mucho en kcal/día, duración y datos funcionales. Falta una promesa más humana: “para semanas caóticas”, “para comer simple”, etc.
- **Impacto en UX:** Menos conexión emocional con el plan y menos sensación de “esto es para mí”.
- **Fix:** Reescribir títulos/subcopys de catálogo y detalle hacia situaciones reales de vida, manteniendo datos técnicos como soporte secundario.
- **Referencia visual:** Ahora parece un catálogo estructurado; debería sentirse como una ayuda concreta para un contexto cotidiano.

---

# Evaluación general

## 1. PRIMERA IMPRESIÓN
Un usuario nuevo siente que Nutria tiene intención de marca y un tono más cálido que muchas apps de nutrición, pero también percibe fricción temprano: onboarding largo, cierre manipulativo y demasiadas decisiones antes de registrar la primera comida.

## 2. FRICCIÓN
La acción más común, registrar comida, sigue teniendo demasiados pasos. Según el camino, se mueve aproximadamente entre 4 y 7 taps. Para uso diario, eso es demasiado si no hay recientes, favoritos o quick add.

## 3. SOUL
La app sí tiene personalidad. Nuti y el lenguaje visual ayudan. Donde pierde alma es cuando asoma el sistema interno: macros, objetivos, TDEE, overlays premium repetidos y módulos que parecen hechos por capas distintas.

## 4. COMPETIDORES
- **Claridad del dashboard:** mejor tono que Fastic y más humano que Yazio, pero todavía menos claro en CTA primario.
- **Facilidad de registro de comida:** hoy peor que Yazio en velocidad y repetición; similar a Fastic en fricción si no se usa foto.
- **Sensación de progreso:** mejor narrativa que Fastic, pero Stats bloquea demasiado pronto y demasiado fuerte para free.

## 5. TOP 5 mejoras de mayor impacto con menor esfuerzo
1. Unificar `/log` y `/dashboard/add` en un solo flujo de registro.
2. Eliminar la cuenta atrás del registro final y sustituirla por copy honesto.
3. Persistir onboarding de verdad más allá de `sessionStorage`.
4. Reducir los overlays premium de Stats a un solo bloqueo/CTA coherente.
5. Reescribir todo el copy visible que aún expone “macros”, “TDEE” y objetivos técnicos.

## ✅ FIXED — 2026-04-17 — Registro final sin urgencia manipulativa
- Se eliminó el countdown de 10 minutos, el anillo de urgencia y todo el copy de expiración en el paso final de `/onboarding`.
- Se reemplazó por un cierre sereno con el copy: “Tu plan está listo” y “Crea tu cuenta para guardarlo y empezar hoy”.

## ✅ FIXED — 2026-04-17 — Regla “nunca rojo” aplicada en los hallazgos rápidos
- Se sustituyeron los errores visibles en `/settings` y `/plans/[planId]` de rojo a ámbar para mantener el lenguaje visual de Nutria.

## ✅ FIXED — 2026-04-17 — Confirmación de logout
- Se añadió una confirmación tipo bottom sheet en `/settings` antes de cerrar sesión, con acciones “Cancelar” y “Cerrar sesión”.

## ✅ FIXED — 2026-04-17 — Enlaces legales internos
- Los enlaces a `/privacy` y `/terms` en `/settings` dejaron de abrir nueva pestaña y ahora usan navegación interna con `next/link`.

## ✅ FIXED — 2026-04-17 — Error de red separado de “sin resultados” en búsqueda
- Se añadió manejo explícito de fallo de búsqueda en `/dashboard/add` y en `ManualSearch` del flujo `/log`.
- Ahora la UI distingue entre “No pudimos buscar ahora mismo” y “No encontramos ese alimento”, con botón de reintento.

## ✅ FIXED — 2026-04-17 — Feedback de guardado consistente en `/dashboard/add`
- Se creó un toast reutilizable y se aplicó tras guardado exitoso de comida en `/dashboard/add`, alineando mejor el feedback con el resto de la app.

## ✅ FIXED — 2026-04-17 — `/log` pasa a ser el flujo único de registro
- Todos los accesos del dashboard para añadir comida ahora apuntan a `/log` con la comida preseleccionada vía query param.
- `/log` recupera esa comida al entrar y la mantiene al reiniciar el flujo, y la ruta antigua `/dashboard/add` se eliminó por completo.

## ✅ FIXED — 2026-04-17 — Stats con un solo bloqueo premium coherente
- La pantalla `/stats` ahora deja visible la parte gratuita arriba y agrupa todo lo premium en un único bloque al final, con un solo candado y un único CTA.
- Se eliminaron los overlays repetidos sobre cada tarjeta bloqueada.

## ✅ FIXED — 2026-04-17 — Empty state del dashboard con CTA claro
- Cuando no hay comidas del día, el dashboard muestra un módulo central con Nuti, mensaje de arranque y CTA directo a `/log`.
- El módulo desaparece automáticamente al existir al menos un registro.

## ✅ FIXED — 2026-04-17 — Cabecera de `/log` más compacta
- Se redujo el padding vertical del hero y se acercaron el selector de comida y los métodos de registro al borde superior.
- La primera fila de acciones queda visible antes en pantallas pequeñas sin eliminar contenido del flujo.

## ✅ FIXED — 2026-04-17 — Persistencia del onboarding entre sesiones
- El store del onboarding ahora persiste en `localStorage` con la clave `onboarding-store` para recuperar respuestas y pantalla actual aunque el usuario cierre la app.
- Al completar el onboarding correctamente, esa persistencia se limpia mediante el `reset()` del store.
